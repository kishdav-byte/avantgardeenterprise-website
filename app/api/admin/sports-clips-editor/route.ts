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

        // Initialize Gemini model with specific API version (v1)
        const model = genAI.getGenerativeModel(
            {
                model: "gemini-1.5-flash",
                systemInstruction: SPORTS_CLIPS_CONFIG.systemPrompt,
                generationConfig: {
                    maxOutputTokens: 2048,
                    temperature: 0.7,
                }
            },
            { apiVersion: 'v1' }
        )

        // Extract base64 data
        const base64Data = image.split(',')[1]

        console.log(`[SPORTS-CLIPS] Using ${model.model} with ${keySource}. Prefix: ${finalKey.substring(0, 10)}...`)

        let aiResponse = "";
        try {
            // Generate content with Gemini
            const result = await model.generateContent([
                {
                    inlineData: {
                        data: base64Data,
                        mimeType: "image/jpeg"
                    }
                },
                { text: prompt || "Analyze my DaVinci Resolve workspace and provide guidance on my current project." }
            ])
            aiResponse = result.response.text()
        } catch (geminiError: any) {
            console.error("[SPORTS-CLIPS] Gemini Primary Failed, attempting OpenAI fallback:", geminiError.message);

            // FALLBACK: Use OpenAI if available
            if (oKey && oKey.startsWith('sk-')) {
                const { OpenAI } = await import('openai');
                const openai = new OpenAI({ apiKey: oKey });

                const completion = await openai.chat.completions.create({
                    model: "gpt-4o",
                    messages: [
                        {
                            role: "system",
                            content: SPORTS_CLIPS_CONFIG.systemPrompt
                        },
                        {
                            role: "user",
                            content: [
                                { type: "text", text: prompt || "Analyze my DaVinci Resolve workspace and provide guidance on my current project." },
                                {
                                    type: "image_url",
                                    image_url: {
                                        url: `data:image/jpeg;base64,${base64Data}`
                                    }
                                }
                            ]
                        }
                    ],
                    max_tokens: 1000
                });

                aiResponse = completion.choices[0]?.message?.content || "No response from OpenAI fallback.";
                console.log("[SPORTS-CLIPS] Served via OpenAI Fallback.");
            } else {
                throw geminiError; // Re-throw if no fallback possible
            }
        }

        return NextResponse.json({ message: aiResponse })

    } catch (error: any) {
        console.error('Sports Clips Editor API error:', error)
        return NextResponse.json(
            { error: error.message || 'An error occurred processing your request' },
            { status: 500 }
        )
    }
}
