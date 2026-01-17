import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const contactSchema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    message: z.string().min(1),
})

export async function POST(request: Request) {
    try {
        const body = await request.json()

        // Validation
        const validation = contactSchema.safeParse(body)
        if (!validation.success) {
            return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
        }

        const { name, email, message } = validation.data

        // Insert into Supabase
        const { error } = await supabase
            .from('contacts')
            .insert([{ name, email, message }])

        if (error) {
            console.error('Supabase error:', error)
            return NextResponse.json({ error: 'Database error' }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('API error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
