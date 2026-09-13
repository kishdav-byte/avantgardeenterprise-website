import { createBrowserClient } from '@supabase/ssr'
import { processLock } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!supabaseUrl && typeof window === 'undefined') {
    console.warn('⚠️ NEXT_PUBLIC_SUPABASE_URL is missing. Supabase functionality will be disabled.')
}

export const supabase = createBrowserClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder',
    {
        auth: {
            lock: processLock,
        }
    }
)

