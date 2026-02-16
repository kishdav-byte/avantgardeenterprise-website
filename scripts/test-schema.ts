
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl!, supabaseKey!)

async function testInsert() {
    console.log("Attempting manual insert into 'clients' to debug schema...")
    const { data, error } = await supabase
        .from('clients')
        .insert({
            id: '00000000-0000-0000-0000-000000000001',
            email: 'test-schema-check-2@example.com',
            first_name: 'Test',
            last_name: 'User',
            role: 'user'
        })

    if (error) {
        console.error("Insert failed. Error detail:", error)
        if (error.message.includes('column') || error.message.includes('missing')) {
            console.log("This likely confirms a schema mismatch.")
        }
    } else {
        console.log("Insert succeeded. Schema matches these 4 fields.")
    }
}

testInsert()
