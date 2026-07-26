import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const TARGET_BASE_URL = 'https://ai-receptionist-414225355758.us-central1.run.app/api'

async function checkAdminAuth() {
    const cookieStore = await cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() { return cookieStore.getAll(); },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
                    } catch { }
                }
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabase
        .from('clients')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'admin') {
        return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 })
    }

    return null
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
    // Authenticate user & check admin role
    const authResponse = await checkAdminAuth()
    if (authResponse) return authResponse

    const resolvedParams = await params
    const pathArray = resolvedParams.path || []
    const subpath = pathArray.join('/')
    const targetUrl = `${TARGET_BASE_URL}/${subpath}${request.nextUrl.search}`

    try {
        const res = await fetch(targetUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        })

        if (!res.ok) {
            return NextResponse.json({ error: `Backend returned status ${res.status}` }, { status: res.status })
        }

        const data = await res.json()
        return NextResponse.json(data)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
    // Authenticate user & check admin role
    const authResponse = await checkAdminAuth()
    if (authResponse) return authResponse

    const resolvedParams = await params
    const pathArray = resolvedParams.path || []
    const subpath = pathArray.join('/')
    const targetUrl = `${TARGET_BASE_URL}/${subpath}${request.nextUrl.search}`

    try {
        const body = await request.json()
        const res = await fetch(targetUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        })

        if (!res.ok) {
            return NextResponse.json({ error: `Backend returned status ${res.status}` }, { status: res.status })
        }

        const data = await res.json()
        return NextResponse.json(data)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
