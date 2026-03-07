import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { GoogleGenerativeAI } from "@google/generative-ai"
import { SPORTS_CLIPS_CONFIG } from '@/lib/sports-clips-config'

const apiKey = process.env.GEMINI_API_KEY || process.env.Gemini_API_Key || process.env.OPENAI_API_KEY || ''
const genAI = new GoogleGenerativeAI(apiKey)

export async function POST(request: NextRequest) {
    try {
        const cookieStore = await cookies()

        // Create Supabase client
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() { return cookieStore.getAll(); },
                    setAll(cookiesToSet) {
                        try {
                            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
                        } catch { }
                    }
                },
            }
        )

        // Check authentication and admin role
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { data: profile } = await supabase
            .from('clients')
            .select('role')
            .eq('id', user.id)
            .single()

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 })
        }

        // Parse request body
        const { image, prompt } = await request.json()

        if (!image) {
            return NextResponse.json({ error: "No image provided" }, { status: 400 })
        }

        // Initialize Gemini model
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash-latest",
            systemInstruction: SPORTS_CLIPS_CONFIG.systemPrompt,
        })

        // Extract base64 data
        const base64Data = image.split(',')[1]

        // Generate content
        const result = await model.generateContent([
            {
                inlineData: {
                    data: base64Data,
                    mimeType: "image/jpeg"
                }
            },
            { text: prompt || "Analyze my DaVinci Resolve workspace and provide guidance on my current project." }
        ])

        const aiResponse = result.response.text()

        return NextResponse.json({ message: aiResponse })

    } catch (error: any) {
        console.error('Sports Clips Editor API error:', error)
        return NextResponse.json(
            { error: error.message || 'An error occurred processing your request' },
            { status: 500 }
        )
    }
}
