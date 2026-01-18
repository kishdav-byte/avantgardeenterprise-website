
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('Testing Supabase Connection...')
console.log('URL:', supabaseUrl ? 'Found' : 'Missing')
console.log('Key:', supabaseKey ? 'Found' : 'Missing')

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing environment variables!')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
    const start = Date.now()
    console.log('Attempting to fetch blogs (public)...')

    try {
        const { data, error } = await supabase
            .from('blogs')
            .select('count')
            .limit(1)
            .single()

        const duration = Date.now() - start
        if (error) {
            console.error('❌ Connection Failed:', error.message)
            console.error('Details:', error)
        } else {
            console.log(`✅ Connection Successful! (Took ${duration}ms)`)
            console.log('Data sample:', data)
        }
    } catch (err) {
        console.error('❌ Unexpected Error:', err)
    }
}

testConnection()
