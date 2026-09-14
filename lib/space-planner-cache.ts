import type { SpaceAudit, SpaceAuditResult } from './space-planner-types'

export interface CachedAuditBundle {
    audit: SpaceAudit
    results: SpaceAuditResult | null
    timestamp: number
}

// Global cache to maintain audit states across serverless lifecycles in the same process
const globalAuditCache = new Map<string, CachedAuditBundle>()

/**
 * Stores an audit record in the server-side memory cache.
 */
export function setCachedAudit(id: string, audit: SpaceAudit, results: SpaceAuditResult | null = null): void {
    globalAuditCache.set(id, {
        audit,
        results,
        timestamp: Date.now(),
    })

    // Housekeeping: Purge records older than 24 hours
    const ONE_DAY_MS = 24 * 60 * 60 * 1000
    const now = Date.now()
    for (const [key, val] of globalAuditCache.entries()) {
        if (now - val.timestamp > ONE_DAY_MS) {
            globalAuditCache.delete(key)
        }
    }
}

/**
 * Retrieves a cached audit bundle if present.
 */
export function getCachedAudit(id: string): CachedAuditBundle | undefined {
    return globalAuditCache.get(id)
}

/**
 * Updates results and status for a cached audit.
 */
export function updateCachedAuditResults(id: string, results: SpaceAuditResult): void {
    const existing = globalAuditCache.get(id)
    if (existing) {
        existing.results = results
        existing.audit = {
            ...existing.audit,
            status: 'completed',
            updated_at: new Date().toISOString(),
        }
        existing.timestamp = Date.now()
    } else {
        // Synthesize minimal audit if missing
        setCachedAudit(id, {
            id,
            space_context: 'home',
            room_type: 'living_room',
            goals: ['organize_categorize'],
            budget_tier: 'medium',
            lifestyle_metrics: { family_size: 2, has_pets: false, age_groups: ['adult'], primary_usage: 'General' },
            clutter_photos: [],
            status: 'completed',
            is_free_sample: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        }, results)
    }
}
