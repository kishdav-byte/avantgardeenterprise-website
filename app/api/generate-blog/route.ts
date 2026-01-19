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

MANDATORY STRUCTURAL REQUIREMENTS FOR 1200+ WORDS:
1. THE HOOK: Start with a visceral, 5-paragraph description of the pain and stakes of "${focus}".
2. DEPTH MANDATE: You MUST include at least 8 distinct subheadings (<h2> tags). Under EACH subheading, you MUST write at least 5 dense, info-rich paragraphs. 
3. PARAGRAPH DENSITY: Every single paragraph MUST be 6-8 sentences long. Do not allow the AI to be brief. Expand on the technical "why," the psychological "impact," and provide a "mental model" or visualization for every section.
4. ACTIONABLE EXAMPLES: You MUST include a dedicated section titled with a benefit-driven name (e.g., "From Theory to Practice: Tactics that Win") that contains at least 3 "WRONG WAY vs. RIGHT WAY" literal text comparisons with a brief explanation of WHY the Right Way wins.
5. EXPERT INTEGRATION: Seamlessly weave in a quote or insight from an industry expert in every section using unique, high-authority names/titles. Never use placeholder names like Jane Doe or John Smith.
6. REQUIRED THEMES:
   - The Psychology of the concept.
   - The Technical Mechanics or "Under the Hood" logic.
   - Strategic selection vs. poor alternatives.
   - Common failure points and "Physics" of why they break.
   - The Human/Recruiter/Customer psychology of the transition.
   - A step-by-step optimization blueprint.
   - The "Easy Button": Position "${productName}" (${safeProductUrl}) as the automation solution.

FORMATTING & PERSUASION:
- Format everything in clean HTML (No markdown, no asterisks, no hashtags).
- Use <h2> for subheadings and <p> for dense paragraphs.
- Hyperlink "${productName}" to "${safeProductUrl}" using an <a> tag.
- CRITICAL: Do NOT use labels like "Chapter 1," "Section 1," or "Introduction."
- CRITICAL: Do NOT use my instructions as headings.

At the end, include a meta description in this format:
<p style="display:none;">Meta description: [Insert a 150-character SEO summary of the article here]</p>

Output Format: JSON string structure:
{
    "refined_title": "A compelling, benefit-driven version of the title",
    "content_html": "The full, deep 1200+ word HTML body content",
    "excerpt": "A high-CTR summary for preview text",
    "social_snippets": { "linkedin": "A professional post draft", "facebook": "An engaging post draft" },
    "seo_score": 98,
    "seo_critique": "A brief breakdown."
}`

        const completion = await openai.chat.completions.create({
            messages: [{ role: 'system', content: prompt }],
            model: 'gpt-4o',
            max_tokens: 4096,
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
