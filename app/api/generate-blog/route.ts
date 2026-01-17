import { createServerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: Request) {
    try {
        const { topic, intent, keywords, length, links } = await request.json()

        // Auth check
        const cookieStore = await cookies()
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value
                    },
                    set(name: string, value: string, options: any) {
                        try {
                            cookieStore.set({ name, value, ...options })
                        } catch (error) {
                        }
                    },
                    remove(name: string, options: any) {
                        try {
                            cookieStore.set({ name, value: '', ...options })
                        } catch (error) {
                        }
                    },
                },
            }
        )
        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Check if user is admin (optional: double check db role)
        const { data: profile } = await supabase
            .from('clients')
            .select('role')
            .eq('id', session.user.id)
            .single()

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const systemPrompt = `You are an expert SEO Blog Writer for 'Avant-Garde Enterprise', a premium, high-tech consulting firm.
        Your goal is to write a blog post that ranks well on search engines and drives traffic.
        
        The user wants a blog post with the following parameters:
        - Topic: ${topic}
        - Intent: ${intent}
        - Keywords: ${keywords}
        - Length: ${length}
        - Links to include: ${links}
        
        Output Format: JSON string matching this structure:
        {
          "title": "Catchy, SEO-optimized title",
          "content_html": "<p>Rich HTML content...</p>", 
          "excerpt": "Short summary for preview cards",
          "seo_title": "Meta Title (under 60 chars)",
          "seo_description": "Meta Description (under 160 chars)",
          "social_snippets": {
            "linkedin": "Draft for a LinkedIn post promoting this article",
            "facebook": "Draft for a Facebook post promoting this article"
          }
        }
        
        Style Guide:
        - Tone: Professional, authoritative, yet innovative and dynamic.
        - Structure: Use H2, H3 tags for hierarchy. Use bullet points for readability.
        - Links: Naturally weave the provided links into the content where appropriate.
        `

        const completion = await openai.chat.completions.create({
            messages: [{ role: 'system', content: systemPrompt }],
            model: 'gpt-4o', // or gpt-4-turbo
            response_format: { type: "json_object" },
        })

        const content = completion.choices[0].message.content
        if (!content) throw new Error('No content generation')

        const blogData = JSON.parse(content)

        // Save Draft to DB
        const { data: insertedBlog, error: dbError } = await supabase
            .from('blogs')
            .insert({
                title: blogData.title,
                slug: blogData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
                content: blogData.content_html,
                excerpt: blogData.excerpt,
                status: 'draft',
                author_id: session.user.id,
                seo_title: blogData.seo_title,
                seo_description: blogData.seo_description,
                generated_social_snippets: blogData.social_snippets,
                intent: intent,
                seo_keywords: keywords.split(',').map((k: string) => k.trim())
            })
            .select()
            .single()

        if (dbError) {
            console.error('DB Error:', dbError)
            // Fallback: return the generated data even if save failed, so user doesn't lose it
            return NextResponse.json({ blog: blogData, saved: false, error: dbError.message })
        }

        return NextResponse.json({ blog: insertedBlog, saved: true })

    } catch (error: any) {
        console.error('Error generating blog:', error)
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
    }
}
