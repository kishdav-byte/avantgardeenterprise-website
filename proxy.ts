
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const path = request.nextUrl.pathname
    const isProtectedRoute = path.startsWith('/dashboard') || path.startsWith('/admin')

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
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // Correct way to get safe session data in middleware
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
        console.log("MIDDLEWARE: User authenticated:", user.id)
    }

    // 1. Protected Route Guard (TEMPORARILY DISABLED FOR DEBUGGING)
    /*
    if (isProtectedRoute && !user) {
        console.log("MIDDLEWARE: Redirecting to login.")
        const redirectUrl = request.nextUrl.clone()
        redirectUrl.pathname = '/login'
        return NextResponse.redirect(redirectUrl)
    }
    */

    return supabaseResponse
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
