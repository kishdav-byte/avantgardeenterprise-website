import { createServerClient } from '@supabase/ssr'
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

        const { topic, focus, keywords, productName, productUrl, authorName, length = '1200', imageStyle = 'Minimalist' } = await request.json()

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

        // Sanitize URL to ensure absolute path
        let safeProductUrl = productUrl.trim()
        if (!safeProductUrl.startsWith('http://') && !safeProductUrl.startsWith('https://')) {
            safeProductUrl = 'https://' + safeProductUrl
        }

        const prompt = `Write a ${length}-word SEO-optimized blog post titled: "${topic}"
Target the keyword: "${primaryKeyword}"
Naturally mention and promote this product: "${productName}"
Product link: ${safeProductUrl}

HTML SYNTAX RULES (NON-NEGOTIABLE):
- EVERY paragraph must start with <p> and end with </p>.
- EVERY expert quote must use this EXACT syntax: <blockquote style="border-left: 4px solid #CCFF00; padding: 20px; margin: 20px 0; background: rgba(255,255,255,0.05); font-style: italic;">"Quote content" — Name, Title</blockquote>
- EVERY comparison must use this EXACT syntax: <ul><li><strong>WRONG WAY:</strong> ...</li><li><strong>RIGHT WAY:</strong> ...</li><li><strong>THE WIN:</strong> ...</li></ul>
- DO NOT use markdown (*, #, **). Use only <h2> and <p>.

CONTENT ENGINE (2000+ WORDS):
1. THE HOOK: 5 dense paragraphs (8 sentences each) about the visceral pain of "${focus}".
2. DEPTH: 6 Subheadings (<h2>). Under each, you MUST write 5 massive paragraphs.
3. THE 3-LAYER RULE (EVERY PARA): Each paragraph MUST cover: 
   - [Technical Mechanics] + [Psychological Stakes] + [Mental Model/Metaphor].
4. THE WIN: The "THE WIN" section must be a 5-sentence technical deep-dive.

MANDATORY THEMES:
- The Psychology of the concept.
- Under the Hood (Technical Mechanics).
- Failure Physics (Why most people fail).
- The "Easy Button": Promote "${productName}" (${safeProductUrl}) as the ultimate solution.

Output strictly as JSON:
{
    "refined_title": "Elite Title",
    "content_html": "Rich, formatted HTML content following all SYNTAX RULES above. Must be at least 1500-2000 words.",
    "excerpt": "High-CTR summary",
    "social_snippets": { "linkedin": "Post", "facebook": "Post" },
    "seo_score": 98,
    "seo_critique": "Breakdown"
}`

        const completion = await openai.chat.completions.create({
            messages: [{ role: 'system', content: prompt }],
            model: 'gpt-4o',
            max_tokens: 4096,
            temperature: 0.7,
            response_format: { type: "json_object" },
        })

        const contentRaw = completion.choices[0].message.content
        if (!contentRaw) throw new Error('No content generation')
        const blogData = JSON.parse(contentRaw)
        const finalTitle = blogData.refined_title || topic

        // 2. Generate Image
        const imagePrompt = `Generate a ${imageStyle} style illustration that visually captures the theme of: "${finalTitle}".
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
        let finalImageUrl = imageUrl

        // 3. Upload to Supabase Storage (Permanent Hosting)
        if (imageUrl) {
            try {
                const imageRes = await fetch(imageUrl)
                if (imageRes.ok) {
                    const imageBuffer = await imageRes.arrayBuffer()
                    const fileName = `blog - ${Date.now()} -${Math.random().toString(36).substring(7)}.png`

                    const { data: uploadData, error: uploadError } = await supabase
                        .storage
                        .from('blog-images')
                        .upload(fileName, imageBuffer, {
                            contentType: 'image/png',
                            upsert: false
                        })

                    if (uploadError) {
                        console.error('Storage Upload Error:', uploadError)
                    } else {
                        // Get public URL
                        const { data: { publicUrl } } = supabase
                            .storage
                            .from('blog-images')
                            .getPublicUrl(fileName)

                        finalImageUrl = publicUrl
                    }
                }
            } catch (storageErr) {
                console.error('Image Processing Error:', storageErr)
                // Fallback to the temp URL if upload fails, so we at least return something
            }
        }

        // 4. Save to DB
        const { data: insertedBlog, error: dbError } = await supabase
            .from('blogs')
            .insert({
                title: finalTitle,
                slug: `${finalTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')} -${Date.now()} `,
                content: blogData.content_html,
                excerpt: blogData.excerpt,
                featured_image: finalImageUrl, // Saved permanent URL from Supabase Storage
                status: 'draft',
                author_id: session.user.id,
                author_name: authorName || 'Avant-Garde Team',
                generated_social_snippets: blogData.social_snippets,
                intent: focus,
                seo_keywords: keywords.split(',').map((k: string) => k.trim()),
                seo_score: blogData.seo_score || 0,
                seo_critique: blogData.seo_critique || ""
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
