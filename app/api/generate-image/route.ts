import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
    try {
        const apiKey = process.env.OPENAI_API_KEY
        if (!apiKey) {
            return NextResponse.json({ error: 'OpenAI API Key not configured' }, { status: 500 })
        }

        // Auth check
        const cookieStore = await cookies()
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) { return cookieStore.get(name)?.value },
                    set(name: string, value: string, options: any) { try { cookieStore.set({ name, value, ...options }) } catch (error) { } },
                    remove(name: string, options: any) { try { cookieStore.set({ name, value: '', ...options }) } catch (error) { } },
                },
            }
        )
        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { prompt, style = 'vivid' } = await request.json()

        const openai = new OpenAI({ apiKey })
        let imageUrl = ""

        try {
            const imageResponse = await openai.images.generate({
                model: "dall-e-3",
                prompt,
                n: 1,
                size: "1024x1024",
                quality: "standard"
            })
            imageUrl = imageResponse?.data?.[0]?.url || ""
        } catch (imageGenErr) {
            console.error("DALL-E generation failed, using premium cyber-organic fallback image:", imageGenErr)
            imageUrl = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000"
        }

        if (!imageUrl) {
            throw new Error('Failed to generate image or retrieve fallback')
        }

        // Upload to Supabase Storage
        try {
            const imageRes = await fetch(imageUrl)
            if (imageRes.ok) {
                const imageBuffer = await imageRes.arrayBuffer()
                const fileName = `blog-${Date.now()}-${Math.random().toString(36).substring(7)}.png`

                const { error: uploadError } = await supabase
                    .storage
                    .from('blog-images')
                    .upload(fileName, imageBuffer, {
                        contentType: 'image/png',
                        upsert: false
                    })

                if (!uploadError) {
                    const { data: { publicUrl } } = supabase
                        .storage
                        .from('blog-images')
                        .getPublicUrl(fileName)

                    return NextResponse.json({ imageUrl: publicUrl })
                }
            }
        } catch (storageErr) {
            console.error('Storage error:', storageErr)
        }

        // If storage fails, return the OpenAI URL
        return NextResponse.json({ imageUrl })

    } catch (error: any) {
        console.error('Error generating image:', error)
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
    }
}
