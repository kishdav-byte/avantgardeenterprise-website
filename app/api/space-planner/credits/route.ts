import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabaseServer'
import { getUserCredits } from '@/lib/space-planner-credits'
import { getOrDeriveFingerprint, checkGuestMicroAuditLimit } from '@/lib/space-planner-fingerprint'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
    try {
        const supabase = await createServerSupabase()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        // 1. Authenticated User flow (Regular or Admin)
        if (user && !authError) {
            const credits = await getUserCredits(user.id, user.email)
            return NextResponse.json({
                success: true,
                ...credits,
                isGuest: false,
            })
        }

        // 2. Unauthenticated Guest flow (Check IP + Browser Fingerprint)
        const { fingerprint, ipHash } = getOrDeriveFingerprint(req)
        const { used } = await checkGuestMicroAuditLimit(fingerprint, ipHash)

        // Also check guest cookie fallback
        const sampleUsedCookie = req.cookies.get('sp_sample_used')?.value === 'true'
        const isSampleUsed = used || sampleUsedCookie

        return NextResponse.json({
            success: true,
            hasCredit: !isSampleUsed,
            balance: 0,
            freeSampleAvailable: !isSampleUsed,
            isGuest: true,
            guestLimitReached: isSampleUsed,
            isMicroAuditOnly: true,
            isAdmin: false,
        })
    } catch (err: any) {
        console.error('Error fetching credits / guest status:', err)
        return NextResponse.json(
            { error: err?.message || 'Failed to fetch credits status' },
            { status: 500 }
        )
    }
}
