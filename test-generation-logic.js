const OpenAI = require('openai');
const dotenv = require('dotenv');
const path = require('path');

// Load .env.local
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
    console.error('OPENAI_API_KEY not found in .env.local');
    process.exit(1);
}

const openai = new OpenAI({ apiKey });

const topic = "leverage ai, don't fight it";
const focus = "the longer you spend fighting AI the further behind you'll be. Will there be a lot of jobs that are moved to ai or some automated bot, very likely. But, AI needs a guide, a";
const keywords = "leverage ai, ai automation, developer future";
const productName = "Avant-Garde Enterprise";
const productUrl = "https://avant-gardeenterprise.com";
const length = "1200";
const imageStyles = ["Minimalist"];

const primaryKeyword = keywords.split(',')[0];

let safeProductUrl = productUrl.trim();
if (!safeProductUrl.startsWith('http://') && !safeProductUrl.startsWith('https://')) {
    safeProductUrl = 'https://' + safeProductUrl;
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
}`;

function getImagePrompt(title, style) {
    const styleDescriptions = {
        'Minimalist': 'minimalist, clean, simple geometric shapes with negative space',
        'Abstract': 'abstract, artistic, non-representational forms with bold colors',
        'Realistic': 'photorealistic, detailed, natural lighting and textures',
        'Futuristic': 'futuristic, sci-fi, sleek technology and neon accents',
        'Corporate': 'professional, business-oriented, clean and polished',
        'Vibrant': 'vibrant, colorful, energetic with bold contrasts',
        'Dark': 'dark, moody, dramatic with deep shadows',
        'Illustrative': 'illustrated, artistic, hand-drawn aesthetic'
    };

    const styleDesc = styleDescriptions[style] || 'modern and professional';

    return `Generate a ${styleDesc} style illustration that visually represents the concept of: "${title}".

CRITICAL REQUIREMENTS:
- DO NOT include any people, humans, faces, hands, or body parts
- DO NOT include any text, numbers, letters, symbols, or writing in any language
- DO NOT include branding, logos, or UI elements
- Focus on: abstract concepts, objects, technology, nature, architecture, or symbolic representations
- Use: geometric shapes, patterns, lighting effects, environments, or conceptual imagery
- Make it ${styleDesc} and suited for a professional blog header

Create a compelling visual metaphor using objects, environments, or abstract elements only.`;
}

async function run() {
    try {
        console.log("1. Simulating OpenAI Chat Completion (Post Content)...");
        const completion = await openai.chat.completions.create({
            messages: [{ role: 'system', content: prompt }],
            model: 'gpt-4o',
            max_tokens: 4096,
            response_format: { type: "json_object" },
        });

        const contentRaw = completion.choices[0].message.content;
        console.log("Success! Chat completion finished. Parsing JSON...");
        const blogData = JSON.parse(contentRaw);
        const finalTitle = blogData.refined_title || topic;
        console.log("Refined Title:", finalTitle);

        console.log("2. Simulating OpenAI DALL-E Image Generation...");
        const imageStyle = imageStyles[0] || 'Minimalist';
        const imagePrompt = getImagePrompt(finalTitle, imageStyle);
        console.log("Image Prompt:", imagePrompt);

        let imageResponse;
        try {
            console.log("Trying DALL-E 3...");
            imageResponse = await openai.images.generate({
                model: "dall-e-3",
                prompt: imagePrompt,
                n: 1,
                size: "1024x1024",
                quality: "standard"
            });
        } catch (dalleErr) {
            console.warn("DALL-E 3 failed:", dalleErr.message);
            if (dalleErr.message && (dalleErr.message.includes("does not exist") || dalleErr.message.includes("not found") || dalleErr.message.includes("Unknown parameter"))) {
                console.log("Degrading to DALL-E 2...");
                imageResponse = await openai.images.generate({
                    model: "dall-e-2",
                    prompt: imagePrompt,
                    n: 1,
                    size: "1024x1024"
                });
            } else {
                throw dalleErr;
            }
        }

        const imageUrl = imageResponse?.data?.[0]?.url || "";
        console.log("DALL-E Success! Image URL matches:", imageUrl ? "Yes (generated)" : "No");
        console.log("Image URL:", imageUrl);
    } catch (err) {
        console.error("SIMULATION FAIL:", err);
    }
}

run();
