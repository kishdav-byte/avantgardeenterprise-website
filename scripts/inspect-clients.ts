
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role for schema inspection if possible

const supabase = createClient(supabaseUrl!, supabaseKey!)

async function inspectTable() {
    console.log("Inspecting 'clients' table structure...")
    const { data, error } = await supabase
        .from('clients')
        .select('*')
        .limit(1)

    if (error) {
        console.error("Error fetching from clients:", error)
        return
    }

    if (data && data.length > 0) {
        console.log("Sample client row keys:", Object.keys(data[0]))
    } else {
        console.log("No data in clients table to inspect keys.")
    }
}

inspectTable()
