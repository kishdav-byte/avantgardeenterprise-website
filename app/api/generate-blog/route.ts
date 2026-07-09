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

        const { topic, focus, keywords, productName, productUrl, authorName, length = '1200', imageStyles = ['Minimalist'], publishDate, generateMultipleImages = false } = await request.json()

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

        const prompt = `Write a ${length}-word blog post titled: "${topic}".
Target SEO Keyword: "${primaryKeyword}".
Naturally integrate and promote this product: "${productName}" (link: ${safeProductUrl}).

TONE, VOICE & HUMAN RELATABILITY:
1. WRITING VOICE: Write in the first-person ("I" or "we") as a seasoned, slightly opinionated senior developer or engineer. Build a relatable connection with the reader. Use a conversational, authentic tone. Avoid textbook or academic phrasing.
2. BAN BANALITIES AND AI-ISMS: Never use boilerplate openings or transitions like "In today's fast-paced digital landscape," "Furthermore," "Moreover," "It is crucial to consider," "In conclusion," "Unleash," "Demystify," or "Dive deep."
3. VARIABLE PARAGRAPH PACING: Do NOT write uniform, long paragraphs. Mix long analytical paragraphs with short, punchy single-sentence paragraphs to create natural reading flow. 
4. RELATABLE HUMOR: Use pragmatic, real-world analogies, minor self-deprecation, or light professional humor (e.g., pointing out developer frustrations, late-night debugging session clichés, etc.).
5. RAGS TO RICHES / TRUTHS: Start the hook with a story of a real developer/business problem or failure. Admit limitations before claiming solutions.

MANDATORY STRUCTURAL REQUIREMENTS:
1. THE HOOK: Start with an evocative, story-driven introduction (use varying paragraph styles, not uniform blocks).
2. DEPTH MANDATE: Include at least 8 distinct subheadings (<h2> tags).
3. CONTENT UNDER HEADINGS: Under each heading, provide rich, insightful content (with standard paragraphs, occasional bullet list, or blockquotes). Ensure they avoid fluff or dry repetitions.
4. EXPERT CALL-OUTS: Include conversational expert quotes or thoughts from a persona (e.g., Chief Architect, VP of Engineering). Use this EXACT HTML structure:
   <blockquote style="border-left: 4px solid #CCFF00; padding: 20px; margin: 20px 0; background: rgba(255,255,255,0.05); font-style: italic;">
      "[Quote or thought from expert]" — [Name], [Title]
   </blockquote>
5. ACTIONABLE COMPARISONS: Include a comparison section titled "The Pro vs. The Amateur". Use this EXACT list format for at least 3 comparisons:
   <ul>
     <li><strong>WRONG WAY:</strong> [Generic, low-value approach]</li>
     <li><strong>RIGHT WAY:</strong> [Strategic, high-value approach]</li>
     <li><strong>THE WIN:</strong> [A punchy, 2-3 sentence technical or psychological explanation]</li>
   </ul>
6. REQUIRED THEMES:
   - The human psychology or cognitive friction surrounding the concept.
   - Beneath the surface mechanics.
   - Common failure points (why standard approaches crash).
   - A step-by-step optimization blueprint.
   - Position "${productName}" (${safeProductUrl}) as a modern, reliable automation solution.

FORMATTING & PERSUASION:
- Format in clean HTML (No markdown, no asterisks, no hashtags).
- Use <h2> for subheadings and <p> for paragraphs.
- Hyperlink "${productName}" to "${safeProductUrl}" using an <a> tag.
- Do NOT use labels like "Chapter 1," "Section 1," or "Introduction" to structure the post.

At the end, include a meta description in this format:
<p style="display:none;">Meta description: [Insert a 150-character SEO summary of the article here]</p>

Output Format (Output strictly as a JSON object):
{
    "refined_title": "A highly clickable, human-styled title",
    "content_html": "The full HTML body content",
    "excerpt": "A human, high-CTR preview text",
    "social_snippets": { "linkedin": "A natural, non-commercial post draft", "facebook": "An engaging, friendly post draft" },
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

        // 2. Generate Images (Multiple if requested)
        const generatedImages: Array<{ style: string; url: string; publicUrl?: string }> = []

        let singleImageFallback = false

        if (generateMultipleImages && imageStyles.length > 0) {
            // Generate multiple images with different styles
            for (const style of imageStyles) {
                const imagePrompt = getImagePrompt(finalTitle, style)

                try {
                    const imageResponse = await openai.images.generate({
                        model: "dall-e-3",
                        prompt: imagePrompt,
                        n: 1,
                        size: "1024x1024",
                        quality: "standard"
                    })

                    const imageUrl = imageResponse?.data?.[0]?.url || ""
                    if (imageUrl) {
                        generatedImages.push({ style, url: imageUrl })
                    }
                } catch (imgError) {
                    console.error(`Error generating ${style} image:`, imgError)
                }
            }

            if (generatedImages.length > 0) {
                // Return blog data with multiple image options
                return NextResponse.json({
                    blog: { ...blogData, title: finalTitle },
                    images: generatedImages,
                    requiresImageSelection: true
                })
            } else {
                console.warn("All style image generations failed / DALL-E model not enabled. Falling back to single featured post image.")
                singleImageFallback = true
            }
        }

        if (!generateMultipleImages || singleImageFallback) {
            // Original single image generation
            const imageStyle = imageStyles[0] || 'Minimalist'
            const imagePrompt = getImagePrompt(finalTitle, imageStyle)
            let finalImageUrl = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000" // Premium Cyber-Organic background fallback

            try {
                const imageResponse = await openai.images.generate({
                    model: "dall-e-3",
                    prompt: imagePrompt,
                    n: 1,
                    size: "1024x1024",
                    quality: "standard"
                })

                const imageUrl = imageResponse?.data?.[0]?.url || ""
                if (imageUrl) {
                    finalImageUrl = imageUrl
                }
            } catch (imageGenErr) {
                console.error("DALL-E image generation failed on current OpenAI plan. Proceeding with premium abstract placeholder:", imageGenErr)
            }

            // 3. Upload to Supabase Storage (Permanent Hosting)
            if (finalImageUrl) {
                try {
                    const imageRes = await fetch(finalImageUrl)
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
                    featured_image: finalImageUrl,
                    status: 'draft',
                    published_at: publishDate ? new Date(publishDate).toISOString() : null,
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
                return NextResponse.json({ blog: { ...blogData, featured_image: finalImageUrl }, saved: false, error: dbError.message })
            }

            return NextResponse.json({ blog: insertedBlog, saved: true })
        }

    } catch (error: any) {
        console.error('Error generating blog:', error)
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
    }
}

function getImagePrompt(title: string, style: string): string {
    const styleDescriptions: Record<string, string> = {
        'Minimalist': 'minimalist, clean, simple geometric shapes with negative space',
        'Abstract': 'abstract, artistic, non-representational forms with bold colors',
        'Realistic': 'photorealistic, detailed, natural lighting and textures',
        'Futuristic': 'futuristic, sci-fi, sleek technology and neon accents',
        'Corporate': 'professional, business-oriented, clean and polished',
        'Vibrant': 'vibrant, colorful, energetic with bold contrasts',
        'Dark': 'dark, moody, dramatic with deep shadows',
        'Illustrative': 'illustrated, artistic, hand-drawn aesthetic'
    }

    const styleDesc = styleDescriptions[style] || 'modern and professional'

    return `Generate a ${styleDesc} style illustration that visually represents the concept of: "${title}".

CRITICAL REQUIREMENTS:
- DO NOT include any people, humans, faces, hands, or body parts
- DO NOT include any text, numbers, letters, symbols, or writing in any language
- DO NOT include branding, logos, or UI elements
- Focus on: abstract concepts, objects, technology, nature, architecture, or symbolic representations
- Use: geometric shapes, patterns, lighting effects, environments, or conceptual imagery
- Make it ${styleDesc} and suited for a professional blog header

Create a compelling visual metaphor using objects, environments, or abstract elements only.`
}

// New endpoint to save blog with selected image
export async function PUT(request: Request) {
    try {
        const { blogData, selectedImageUrl, topic, focus, keywords, productName, productUrl, authorName, publishDate } = await request.json()

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

        // Verify Admin
        const { data: profile } = await supabase
            .from('clients')
            .select('role')
            .eq('id', session.user.id)
            .single()

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // Upload selected image to Supabase Storage
        let finalImageUrl = selectedImageUrl

        if (selectedImageUrl) {
            try {
                const imageRes = await fetch(selectedImageUrl)
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

                        finalImageUrl = publicUrl
                    }
                }
            } catch (storageErr) {
                console.error('Image Processing Error:', storageErr)
            }
        }

        // Save to DB
        const { data: insertedBlog, error: dbError } = await supabase
            .from('blogs')
            .insert({
                title: blogData.refined_title || topic,
                slug: `${(blogData.refined_title || topic).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${Date.now()}`,
                content: blogData.content_html,
                excerpt: blogData.excerpt,
                featured_image: finalImageUrl,
                status: 'draft',
                published_at: publishDate ? new Date(publishDate).toISOString() : null,
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
            return NextResponse.json({ error: dbError.message }, { status: 500 })
        }

        return NextResponse.json({ blog: insertedBlog, saved: true })

    } catch (error: any) {
        console.error('Error saving blog:', error)
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
    }
}
