/**
 * Client-side browser fingerprint generator and manager.
 * Safely runs in browser environments with zero server dependencies.
 */
export function getClientFingerprint(): string {
    if (typeof window === 'undefined') return ''

    try {
        let fp = localStorage.getItem('sp_guest_fp')
        if (!fp || fp.length < 10) {
            const screenInfo = `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`
            const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''
            const nav = `${navigator.language}_${navigator.hardwareConcurrency || 2}`
            const randomPart = Math.random().toString(36).substring(2, 15)
            fp = `fp_${btoa(`${screenInfo}_${tz}_${nav}`).replace(/[^a-zA-Z0-9]/g, '').slice(0, 16)}_${randomPart}`

            localStorage.setItem('sp_guest_fp', fp)
        }

        // Keep cookie synchronized (365 days)
        document.cookie = `sp_guest_fp=${fp}; path=/; max-age=31536000; SameSite=Lax`

        return fp
    } catch {
        return 'sp_guest_fallback'
    }
}
