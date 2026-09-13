import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabaseServer'
import { getUserCredits } from '@/lib/space-planner-credits'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
    try {
        const supabase = await createServerSupabase()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const credits = await getUserCredits(user.id)

        return NextResponse.json({
            success: true,
            ...credits,
        })
    } catch (err: any) {
        console.error('Error fetching user credits:', err)
        return NextResponse.json(
            { error: err?.message || 'Failed to fetch credits' },
            { status: 500 }
        )
    }
}
