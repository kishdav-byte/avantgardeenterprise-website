
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const path = request.nextUrl.pathname

    // Define paths that require a session check (Protected + Login for redirect)
    // We strictly avoid running the extensive auth check on public pages (blog, products, home) to prevent lag
    const isProtected = path.startsWith('/dashboard') || path.startsWith('/admin')
    const isLoginPage = path === '/login'

    // FAST PATH: If it's a public page OR the login page, skip Supabase entirely
    // This removes the "spinning" on the Portal link caused by slow/hanging auth checks.
    if (!isProtected) {
        return response
    }

    // SLOW PATH (Only for Dashboard/Admin/Login): Create client and check session
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
                    response = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // Helper to get user without throwing
    const { data: { user } } = await supabase.auth.getUser()

    // 1. Protected Route Guard
    if (isProtected && !user) {
        const redirectUrl = request.nextUrl.clone()
        redirectUrl.pathname = '/login'
        return NextResponse.redirect(redirectUrl)
    }

    // 2. Login Page Guard (Redirect to Dashboard if already logged in)
    if (isLoginPage && user) {
        const redirectUrl = request.nextUrl.clone()
        redirectUrl.pathname = '/dashboard'
        return NextResponse.redirect(redirectUrl)
    }

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - api (API routes - generally we want middleware to run on API routes too for auth, but sometimes not. Keeping it simple here.)
         * - public files (images, etc)
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
