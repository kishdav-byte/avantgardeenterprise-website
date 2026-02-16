
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl!, supabaseKey!)

async function listClients() {
    console.log(`Listing all clients...`)

    const { data, error } = await supabase
        .from('clients')
        .select('id, email, first_name, role')

    if (error) {
        console.error('Error fetching clients:', error)
    } else {
        console.log('Clients:', data)
    }
}

listClients()
