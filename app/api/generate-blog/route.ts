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
Your goal is to write an exhaustive, high-authority "Ultimate Guide" blog post that provides massive value.

CURRENT GOAL: 
- Target Keyword: "${primaryKeyword}"
- Product: "${productName}" (${safeProductUrl})
- Target Length: At least ${length} words.

STRICT 7-CHAPTER BLUEPRINT & VERBOSITY MANDATE:
CHAPTER 1: THE HOOK & PSYCHOLOGY. Start with a visceral, 4-paragraph description of the "Resume Black Hole." Discuss the psychological toll of ghosting and the high stakes of modern career transition. (Min 300 words)
CHAPTER 2: THE TECHNICAL "TRUTH." For the terms 'Parsing', 'OCR', and 'Boolean search', you MUST provide: 1. Technical definition. 2. A 'Recruiters-eye' view of why they use it. 3. A 'Bot-eye' view of how the machine literally 'sees' the characters. (Min 400 words)
CHAPTER 3: THE KEYWORD TRAP. Deconstruct why "Keyword Stuffing" is detected by modern algorithms. Provide 3+ literal, multi-sentence "WRONG vs. RIGHT" examples. Explain the 'Why' for each. (Min 400 words)
CHAPTER 4: FORMATTING PHYSICS. A granular technical guide on columns, tables, non-standard fonts, and graphics. Explain the 'Parsing Error' that occurs when an ATS hits a column. (Min 350 words)
CHAPTER 5: THE HUMAN HAND-OFF. The transition from bot to human. Describe the '6-second scan' psychology in detail. (Min 250 words)
CHAPTER 6: THE "EASY BUTTON." Position ${productName} at ${safeProductUrl} as the automated antidote to this manual exhaustion. Contrast the 4-hour manual tweak vs. the 30-second AI optimization. (Min 250 words)
CHAPTER 7: THE FINAL BLUEPRINT. A 10-point checklist for the reader. (Min 150 words)

CONTENT REQUISITES:
- ENCYCLOPEDIC DEPTH: Do not state a fact without explaining the mechanics behind it.
- NO SUMMARIZATION: If you reach the end of a section and it's short, invent a "Deep Dive" or "Case Study" sub-section to expand it.
- HYPERLINK: Naturally link "${productName}" to "${safeProductUrl}".
- REFINED TITLE: Create an elite, high-CTR headline as the H1.

Output Format: JSON:
{
    "refined_title": "Elite Headline",
    "content_html": "Exhaustive HTML content",
    "excerpt": "Summary",
    "social_snippets": { "linkedin": "...", "facebook": "..." },
    "seo_score": 98,
    "seo_critique": "Breakdown."
}`

        const completion = await openai.chat.completions.create({
            messages: [{ role: 'system', content: prompt }],
            model: 'gpt-4o',
            max_tokens: 4096, // Force maximum output length
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
