
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl!, supabaseKey!)

async function checkUser(userId: string) {
    console.log(`Checking user: ${userId}`)

    // Check if user exists in auth.users (can't do this directly with anon key usually)
    // but we can check the clients table
    const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

    if (error) {
        console.error('Error fetching client:', error)
    } else {
        console.log('Client Data:', data)
    }
}

// User ID from screenshot: e3as4ed174cf4bf7..
checkUser('e3as4ed1-74cf-4bf7-9759-397a6e11812a') // Guessed UUID format based on first parts
