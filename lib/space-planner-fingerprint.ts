import { NextRequest } from 'next/server'
import { createHash, randomUUID } from 'crypto'
import { createAdminSupabase, createServerSupabase } from './supabaseServer'

const IP_HASH_SALT = process.env.SPACE_PLANNER_SALT || 'avantgarde-spaceiq-micro-audit-salt-2026'

/**
 * Extracts and securely hashes the client IP address.
 */
export function hashClientIp(req: NextRequest): string {
    const forwarded = req.headers.get('x-forwarded-for')
    const realIp = req.headers.get('x-real-ip')
    const ip = forwarded ? forwarded.split(',')[0].trim() : (realIp || '127.0.0.1')

    return createHash('sha256')
        .update(`${ip}:${IP_HASH_SALT}`)
        .digest('hex')
}

/**
 * Retrieves the guest browser fingerprint from headers or cookies.
 * If none is provided, derives a fallback fingerprint using IP + User-Agent.
 */
export function getOrDeriveFingerprint(req: NextRequest): { fingerprint: string; ipHash: string } {
    const ipHash = hashClientIp(req)
    
    // 1. Check custom header sent by client
    const headerFp = req.headers.get('x-space-planner-fingerprint')
    if (headerFp && headerFp.trim().length >= 8) {
        return { fingerprint: headerFp.trim(), ipHash }
    }

    // 2. Check cookie
    const cookieFp = req.cookies.get('sp_guest_fp')?.value
    if (cookieFp && cookieFp.trim().length >= 8) {
        return { fingerprint: cookieFp.trim(), ipHash }
    }

    // 3. Fallback: hash IP + User-Agent
    const userAgent = req.headers.get('user-agent') || 'unknown-ua'
    const acceptLanguage = req.headers.get('accept-language') || 'en'
    const fallback = createHash('sha256')
        .update(`fp:${ipHash}:${userAgent}:${acceptLanguage}`)
        .digest('hex')

    return { fingerprint: fallback, ipHash }
}

/**
 * Checks whether this guest (by browser fingerprint or IP hash)
 * has already consumed their 1 free micro-audit sample.
 */
export async function checkGuestMicroAuditLimit(
    fingerprint: string,
    ipHash: string
): Promise<{ used: boolean; auditId?: string }> {
    const adminSupabase = createAdminSupabase()

    try {
        const { data, error } = await adminSupabase
            .from('space_planner_guest_usage')
            .select('audit_id, fingerprint, ip_hash')
            .or(`fingerprint.eq.${fingerprint},ip_hash.eq.${ipHash}`)
            .limit(1)

        if (error) {
            console.warn('[SpaceIQ Guest Tracking] Guest usage lookup error (table may need migration):', error.message)
            return { used: false }
        }

        if (data && data.length > 0) {
            return { used: true, auditId: data[0].audit_id }
        }

        return { used: false }
    } catch (e: any) {
        console.warn('[SpaceIQ Guest Tracking] Error verifying guest sample:', e?.message)
        return { used: false }
    }
}

/**
 * Records a completed guest micro-audit in the tracking table.
 */
export async function recordGuestMicroAuditUsage(
    fingerprint: string,
    ipHash: string,
    auditId: string
): Promise<boolean> {
    const adminSupabase = createAdminSupabase()

    try {
        const { error } = await adminSupabase
            .from('space_planner_guest_usage')
            .insert({
                fingerprint,
                ip_hash: ipHash,
                audit_id: auditId,
            })

        if (error) {
            console.warn('[SpaceIQ Guest Tracking] Failed to record guest usage:', error.message)
            return false
        }

        return true
    } catch (e: any) {
        console.warn('[SpaceIQ Guest Tracking] Unexpected error recording guest usage:', e?.message)
        return false
    }
}
