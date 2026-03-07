import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { GoogleGenerativeAI } from "@google/generative-ai"
import { SPORTS_CLIPS_CONFIG } from '@/lib/sports-clips-config'

export async function POST(request: NextRequest) {
    try {
        const cookieStore = await cookies()

        // Robust key detection
        const gKey = process.env.GEMINI_API_KEY || process.env.Gemini_API_Key || '';
        const oKey = process.env.OPENAI_API_KEY || '';
        const finalKey = gKey || oKey || '';
        const keySource = gKey ? 'GEMINI_KEY' : (oKey ? 'OPENAI_KEY' : 'NONE');

        if (!finalKey) {
            return NextResponse.json({ error: "No API key found in environment variables (GEMINI_API_KEY or OPENAI_API_KEY)" }, { status: 500 })
        }

        const genAI = new GoogleGenerativeAI(finalKey)

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
            model: "gemini-1.5-flash",
            systemInstruction: SPORTS_CLIPS_CONFIG.systemPrompt,
            generationConfig: {
                maxOutputTokens: 2048,
                temperature: 0.7,
            }
        })

        // Extract base64 data
        const base64Data = image.split(',')[1]

        console.log(`[SPORTS-CLIPS] Using ${model.model} with ${keySource}. Prefix: ${finalKey.substring(0, 10)}...`)

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
