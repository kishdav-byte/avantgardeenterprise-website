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

        const prompt = `You are a world-class SEO content strategist and high-conversion copywriter. 
Your goal is to write a deeply engaging, SEO-optimized blog post that provides massive value while naturally positioning a product as the ultimate solution.

INPUTS:
- Initial Topic/Title Idea: "${topic}"
- Main Point/Focus: "${focus}"
- Target Keyword: "${primaryKeyword}"
- Latent Semantic Keywords: "${keywords}"
- Product Name: "${productName}"
- Product URL: "${safeProductUrl}"
- Target Length: At least ${length} words.

CRITICAL ARCHITECTURE INSTRUCTIONS:
1. TITLE REFINEMENT: Do not just use the initial topic. Treat it as a raw idea. Create a compelling, benefit-driven headline (H1) that grabs attention (e.g., using "How to," "Secrets of," "Ultimate Guide," or addressing a specific fear/desire).
2. THE HOOK: Do NOT start with generic phrases like "In today's fast-paced world." Start with the PAIN. Connect emotionally with the reader's frustration or the high stakes of their problem.
3. ACTIONABLE VALUE & EXAMPLES: Provide specific, concrete examples. Use "Before vs. After" or "Wrong way vs. Right way" scenarios. If you give a tip, give a real-world example of how to apply it.
4. THE "EASY BUTTON" TRANSITION: Position "${productName}" not just as a tool, but as the logical "Easy Button." Bridging the gap between the hard manual work described and the automated/improved solution the product offers.
5. FORMATTING: Output strictly clean HTML. Use <h2> for main sections and <h3> for sub-points. Use <p> and <ul>/<li> for readability. Ensure a clear, scannable hierarchy.
6. WORD COUNT: You MUST reach the ${length} word minimum. Expand on nuances, provide more examples, and go deeper into the "why" and "how" to ensure the length is substantial.

TECHNICAL MANDATES:
- Perform a natural hyperlink for "${productName}" to "${safeProductUrl}" inside the body.
- Output strictly clean HTML (no markdown tags like \`\`\`html or **).
- Include a hidden meta description at the very end using: <p style="display:none;">Meta description: [150 chars]</p>

Output Format: JSON string structure:
{
    "refined_title": "The new compelling headline you created",
    "content_html": "The full HTML body content",
    "excerpt": "A high-CTR summary for preview text",
    "social_snippets": {
        "linkedin": "A professional post draft",
        "facebook": "An engaging post draft"
    },
    "seo_score": 90,
    "seo_critique": "A brief breakdown of why this ranks well."
}`

        const completion = await openai.chat.completions.create({
            messages: [{ role: 'system', content: prompt }],
            model: 'gpt-4o',
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
                    const fileName = `blog-${Date.now()}-${Math.random().toString(36).substring(7)}.png`

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
                slug: `${finalTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${Date.now()}`,
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
