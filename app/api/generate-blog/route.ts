import { createServerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import OpenAI from 'openai'

export async function POST(request: Request) {
    try {
        const apiKey = process.env.OPENAI_API_KEY
        if (!apiKey) {
            return NextResponse.json({ error: 'OpenAI API Key not configured' }, { status: 500 })
        }

        const openai = new OpenAI({ apiKey })

        const { topic, focus, keywords, productName, productUrl } = await request.json()

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

        // Verify Admin
        const { data: profile } = await supabase
            .from('clients')
            .select('role')
            .eq('id', session.user.id)
            .single()

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // 1. Generate Blog Content
        const primaryKeyword = keywords.split(',')[0]
        const prompt = `Write a 1200-word SEO-optimized blog post titled: ${topic}
Target the keyword: ${primaryKeyword}
Naturally mention the product: "${productName}" and link to it using this URL: ${productUrl}

CRITICAL INSTRUCTIONS:
1. You MUST hyperlink the text "${productName}" to "${productUrl}" at least once in the body content.
2. The link must be a standard HTML <a> tag: <a href="${productUrl}">${productName}</a>.
3. Do NOT output markdown (like [text](url)). Output strictly clean HTML.
4. Do NOT include '```html' or any code block markers.

Formatting Rules:
        - Use<h2> for subheadings
            - Use<p> for paragraphs
                - Use<ul> / <ol> for lists
                    - Maintain a professional, authoritative tone.

At the end, include a meta description in this format:
        <p style="display:none;" > Meta description: [Insert a 150 - character SEO summary of the article here] </p>

Output Format: JSON string structure:
        {
            "content_html": "The full HTML content including meta description",
                "excerpt": "Short summary for preview text",
                    "social_snippets": {
                "linkedin": "Draft for a LinkedIn post",
                    "facebook": "Draft for a Facebook post"
            }
        } `

        const completion = await openai.chat.completions.create({
            messages: [{ role: 'system', content: prompt }],
            model: 'gpt-4o',
            response_format: { type: "json_object" },
        })

        const contentRaw = completion.choices[0].message.content
        if (!contentRaw) throw new Error('No content generation')
        const blogData = JSON.parse(contentRaw)

        // 2. Generate Image
        const imagePrompt = `Generate a clean, professional, blog - style illustration that visually captures the theme of: "${topic} and ${primaryKeyword}".
Do not include any text, numbers, letters, symbols, or writing in any language.
Avoid branding, logos, or anything that resembles UI.
Make it minimal, modern, and purely visual.
The image should be appealing, clean, and suited for a blog header — but it must be completely free of text.`

        const imageResponse = await openai.images.generate({
            model: "dall-e-3",
            prompt: imagePrompt,
            n: 1,
            size: "1024x1024",
            quality: "standard",
            style: "vivid"
        })

        const imageUrl = imageResponse?.data?.[0]?.url || ""

        // 3. Save to DB
        const { data: insertedBlog, error: dbError } = await supabase
            .from('blogs')
            .insert({
                title: topic,
                slug: topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
                content: blogData.content_html,
                excerpt: blogData.excerpt,
                featured_image: imageUrl, // Temporary URL. In prod, you'd download and upload to storage. for now we'll save the link.
                status: 'draft',
                author_id: session.user.id,
                generated_social_snippets: blogData.social_snippets,
                intent: focus,
                seo_keywords: keywords.split(',').map((k: string) => k.trim())
            })
            .select()
            .single()

        if (dbError) {
            console.error('DB Error:', dbError)
            return NextResponse.json({ blog: { ...blogData, featured_image: imageUrl }, saved: false, error: dbError.message })
        }

        return NextResponse.json({ blog: insertedBlog, saved: true })

    } catch (error: any) {
        console.error('Error generating blog:', error)
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
    }
}
