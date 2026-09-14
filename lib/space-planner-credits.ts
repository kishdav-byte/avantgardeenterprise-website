import { createServerSupabase, createAdminSupabase } from './supabaseServer'
import type { SpacePlannerCredits } from './space-planner-types'

export interface CreditStatus {
    hasCredit: boolean
    balance: number
    freeSampleAvailable: boolean
    lifetimeGranted: number
    lifetimeUsed: number
    isAdmin?: boolean
    isGuest?: boolean
    isMicroAuditOnly?: boolean
    guestLimitReached?: boolean
}

/**
 * Checks whether a user possesses the administrator role or email.
 */
export async function checkIsAdmin(userId: string, email?: string): Promise<boolean> {
    if (email === 'kishdav@gmail.com') return true
    try {
        const adminSupabase = createAdminSupabase()
        const { data: client } = await adminSupabase
            .from('clients')
            .select('role, email')
            .eq('id', userId)
            .maybeSingle()

        return client?.role === 'admin' || client?.email === 'kishdav@gmail.com'
    } catch {
        return false
    }
}

/**
 * Retrieves or initializes the user's credit profile in Supabase.
 * Admin users automatically receive unlimited bypass status.
 */
export async function getUserCredits(userId: string, email?: string): Promise<CreditStatus> {
    // 1. Admin Override Check
    const isAdmin = await checkIsAdmin(userId, email)
    if (isAdmin) {
        return {
            hasCredit: true,
            balance: 999999,
            freeSampleAvailable: true,
            lifetimeGranted: 999999,
            lifetimeUsed: 0,
            isAdmin: true,
        }
    }

    const supabase = await createServerSupabase()

    const { data, error } = await supabase.rpc('get_or_create_space_planner_credits', {
        p_user_id: userId,
    })

    if (error || !data) {
        console.error('Error fetching space planner credits:', error)
        // Fallback check directly in space_planner_credits table
        const { data: record } = await supabase
            .from('space_planner_credits')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle()

        if (record) {
            return {
                hasCredit: record.balance > 0 || !record.free_sample_used,
                balance: record.balance,
                freeSampleAvailable: !record.free_sample_used,
                lifetimeGranted: record.lifetime_granted,
                lifetimeUsed: record.lifetime_used,
                isAdmin: false,
            }
        }

        return {
            hasCredit: true,
            balance: 1,
            freeSampleAvailable: true,
            lifetimeGranted: 1,
            lifetimeUsed: 0,
            isAdmin: false,
        }
    }

    const credits = data as SpacePlannerCredits
    const freeSampleAvailable = !credits.free_sample_used
    const hasCredit = credits.balance > 0 || freeSampleAvailable

    return {
        hasCredit,
        balance: credits.balance,
        freeSampleAvailable,
        lifetimeGranted: credits.lifetime_granted,
        lifetimeUsed: credits.lifetime_used,
        isAdmin: false,
    }
}

/**
 * Deducts 1 credit or redeems the free sample for an audit.
 * Uses atomic row locks inside the PostgreSQL RPC.
 * Admin users bypass deduction automatically.
 */
export async function deductAuditCredit(
    userId: string,
    auditId?: string,
    email?: string
): Promise<{ success: boolean; message: string; balance: number; usedFreeSample: boolean }> {
    // Admin Override: Do not deduct credits
    const isAdmin = await checkIsAdmin(userId, email)
    if (isAdmin) {
        return {
            success: true,
            message: 'Admin unlimited override applied (no deduction)',
            balance: 999999,
            usedFreeSample: false,
        }
    }

    try {
        const supabase = await createServerSupabase()

        const { data, error } = await supabase.rpc('deduct_space_planner_credit', {
            p_user_id: userId,
            p_audit_id: auditId || null,
        })

        if (error || !data) {
            console.warn('Could not deduct space planner credit (table/RPC may need migration):', error?.message)
            return {
                success: true,
                message: 'Sample granted via resilience fallback',
                balance: 0,
                usedFreeSample: true,
            }
        }

        const res = data as { success: boolean; message: string; balance: number; used_free_sample: boolean }
        return {
            success: res.success,
            message: res.message,
            balance: res.balance,
            usedFreeSample: res.used_free_sample,
        }
    } catch (err: any) {
        console.warn('deductAuditCredit exception handled gracefully:', err?.message)
        return {
            success: true,
            message: 'Sample granted via resilience fallback',
            balance: 0,
            usedFreeSample: true,
        }
    }
}

/**
 * Adds credits upon successful Stripe checkout completion.
 * Can be called with admin privileges in webhooks.
 */
export async function addPurchasedCredits(
    userId: string,
    amount: number,
    stripeSessionId: string,
    metadata: Record<string, any> = {}
): Promise<{ success: boolean; newBalance: number }> {
    const adminSupabase = createAdminSupabase()

    const { data, error } = await adminSupabase.rpc('add_space_planner_credits', {
        p_user_id: userId,
        p_amount: amount,
        p_stripe_session_id: stripeSessionId,
        p_metadata: metadata,
    })

    if (error || !data) {
        console.error('Error adding purchased credits:', error)
        throw new Error(error?.message || 'Failed to credit account')
    }

    const res = data as { success: boolean; new_balance: number }
    return {
        success: res.success,
        newBalance: res.new_balance,
    }
}
