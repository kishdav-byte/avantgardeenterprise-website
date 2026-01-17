import { createServerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')

    if (code) {
        const cookieStore = await cookies()
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value
                    },
                    set(name: string, value: string, options: any) {
                        try {
                            cookieStore.set({ name, value, ...options })
                        } catch (error) {
                            // Cookie will be set on client
                        }
                    },
                    remove(name: string, options: any) {
                        try {
                            cookieStore.set({ name, value: '', ...options })
                        } catch (error) {
                            // Cookie will be removed on client
                        }
                    },
                },
            }
        )

        await supabase.auth.exchangeCodeForSession(code)
    }

    // Redirect to dashboard
    return NextResponse.redirect(new URL('/dashboard', requestUrl.origin))
}
