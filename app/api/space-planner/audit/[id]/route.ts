import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabaseServer'

export const dynamic = 'force-dynamic'

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: auditId } = await params
        const supabase = await createServerSupabase()

        // 1. Authenticate Requesting User
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
        }

        // 2. Fetch Audit Record
        const { data: audit, error: auditError } = await supabase
            .from('space_audits')
            .select('*')
            .eq('id', auditId)
            .maybeSingle()

        if (auditError || !audit) {
            return NextResponse.json({ error: 'Space audit not found' }, { status: 404 })
        }

        // Verify ownership (unless admin)
        if (audit.user_id !== user.id) {
            const { data: profile } = await supabase
                .from('clients')
                .select('role')
                .eq('id', user.id)
                .maybeSingle()

            if (profile?.role !== 'admin') {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
            }
        }

        // 3. Fetch Audit Results Record
        const { data: results, error: resultsError } = await supabase
            .from('space_audit_results')
            .select('*')
            .eq('audit_id', auditId)
            .maybeSingle()

        return NextResponse.json({
            success: true,
            audit,
            results: results || null,
        })
    } catch (err: any) {
        console.error('Error fetching audit details:', err)
        return NextResponse.json(
            { error: err?.message || 'Failed to retrieve audit details' },
            { status: 500 }
        )
    }
}
