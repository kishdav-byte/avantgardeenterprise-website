
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import path from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing environment variables!')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkPolicies() {
    console.log('Checking RLS policies for clients table...')
    try {
        const { data, error } = await supabase.rpc('get_policies', { table_name: 'clients' })

        if (error) {
            // If RPC doesn't exist, try querying pg_policies directly (might fail with anon key)
            console.warn('RPC get_policies failed, trying direct query...')
            const { data: policies, error: pgError } = await supabase
                .from('pg_policies')
                .select('*')
                .eq('tablename', 'clients')

            if (pgError) {
                console.error('❌ Failed to fetch policies:', pgError.message)
            } else {
                console.log('Policies found:', policies)
            }
        } else {
            console.log('Policies found:', data)
        }
    } catch (err) {
        console.error('❌ Unexpected Error:', err)
    }
}

checkPolicies()
