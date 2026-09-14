import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createAdminSupabase } from '@/lib/supabaseServer'
import { checkIsAdmin } from '@/lib/space-planner-credits'
import { getCachedAudit } from '@/lib/space-planner-cache'

export const dynamic = 'force-dynamic'

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: auditId } = await params
        const supabase = await createServerSupabase()
        const adminSupabase = createAdminSupabase()

        // 1. Check optional authenticated session
        const { data: { user } } = await supabase.auth.getUser()

        // 2. Fetch Audit Record (Database with in-memory fallback)
        const cached = getCachedAudit(auditId)
        let audit: any = null

        try {
            const { data, error } = await adminSupabase
                .from('space_audits')
                .select('*')
                .eq('id', auditId)
                .maybeSingle()
            if (!error && data) {
                audit = data
            }
        } catch (dbErr) {
            console.warn('[SpacePlanner] Database fetch error for space_audits:', dbErr)
        }

        if (!audit && cached?.audit) {
            audit = cached.audit
        }

        if (!audit) {
            return NextResponse.json({ error: 'Space audit not found' }, { status: 404 })
        }

        // 3. Verify access authorization
        let isAdmin = false
        if (user) {
            isAdmin = await checkIsAdmin(user.id, user.email)
        }

        const isGuestAudit = !audit.user_id
        const isOwner = Boolean(user && audit.user_id === user.id)

        // If it's a private user audit and requester is neither owner nor admin:
        if (!isGuestAudit && !isOwner && !isAdmin) {
            if (!user) {
                return NextResponse.json({ error: 'Authentication required to view this audit' }, { status: 401 })
            }
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // 4. Fetch Audit Results Record (Database with in-memory fallback)
        let results: any = null
        try {
            const { data } = await adminSupabase
                .from('space_audit_results')
                .select('*')
                .eq('audit_id', auditId)
                .maybeSingle()
            if (data) {
                results = data
            }
        } catch (dbErr) {
            console.warn('[SpacePlanner] Database fetch error for space_audit_results:', dbErr)
        }

        if (!results && cached?.results) {
            results = cached.results
        }

        return NextResponse.json({
            success: true,
            audit,
            results: results || null,
            isGuestAudit,
            isOwner,
            isAdmin,
        })
    } catch (err: any) {
        console.error('Error fetching audit details:', err)
        return NextResponse.json(
            { error: err?.message || 'Failed to retrieve audit details' },
            { status: 500 }
        )
    }
}
