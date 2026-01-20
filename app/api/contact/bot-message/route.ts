import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const botLeadSchema = z.object({
    name: z.string().optional().default('Anonymous AI Lead'),
    email: z.string().email(),
    message: z.string().min(1),
    metadata: z.record(z.string(), z.any()).optional().default({})
})

export async function POST(request: Request) {
    try {
        const body = await request.json()

        // Validation
        const validation = botLeadSchema.safeParse(body)
        if (!validation.success) {
            return NextResponse.json({ error: 'Invalid data', details: validation.error }, { status: 400 })
        }

        const { name, email, message, metadata } = validation.data

        // Insert into Supabase 'inquiries' table
        // We can use the 'message' field to store the full conversation context if provided
        const { error } = await supabase
            .from('inquiries')
            .insert([{
                name,
                email,
                message: `[BOT CAPTURED] ${message}`,
                // If there's extra room in the schema we could add more, but inquiries is fixed
            }])

        if (error) {
            console.error('Supabase error:', error)
            return NextResponse.json({ error: 'Database error' }, { status: 500 })
        }

        return NextResponse.json({ success: true, message: 'Transmission received. The Architect has logged your signal.' })
    } catch (error: any) {
        console.error('API error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
