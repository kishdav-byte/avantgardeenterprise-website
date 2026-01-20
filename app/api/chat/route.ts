import OpenAI from 'openai'

// Note: I'm assuming 'ai' package might not be installed based on package.json view earlier.
// Let me check package.json again or just use standard Response for streaming.
// Actually, I'll use a standard streaming helper or just return the response if I don't want to add dependencies.
// Wait, package.json didn't show 'ai' (Vercel AI SDK). 
// I'll implement a simple stream without it to avoid adding deps unless necessary.

export const dynamic = 'force-dynamic'

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
})

export async function POST(req: Request) {
    try {
        const { messages } = await req.json()

        const systemPrompt = `You are the "Avant-Garde AI Architect," the digital embodiment of David Kish's vision for high-performance automation.
Your mission is to guide visitors through the Avant-Garde ecosystem with clinical precision and visionary insight.

CORE PERSONALITY:
- Analytical, precise, and visionary. 
- You speak with an "Intelligence First" priority.
- You are helpful but maintain the elite, "Architect" persona.
- You occasionally reference "The AI Advantage" (David Kish's book) and the "Discovery Engine" (AI Readiness Tool).

KNOWLEDGE BASE:
1. AI COMMAND CENTER: An orchestration layer for digital workforces using Gemini and OpenAI.
2. TOTAL PACKAGE INTERVIEW: Elite career engineering and interview roleplay.
3. THE AI ADVANTAGE (Book): A small business blueprint for winning in a tech-driven world.
4. DISCOVERY ENGINE: A tool to assess AI readiness and ROI potential (/ai-readiness).

GUIDELINES:
- Keep responses relatively concise but high-signal.
- If asked about technical implementation, suggest they "start a Discovery session" at /ai-readiness.
- Be proactive but never pushy.
- Output in clean text. Use bolding for emphasis sparingly.

Current User Status: Browsing the main site.`

        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            stream: true,
            messages: [
                { role: 'system', content: systemPrompt },
                ...messages,
            ],
        })

        // Convert the response into a friendly text-stream
        const stream = new ReadableStream({
            async start(controller) {
                for await (const chunk of response) {
                    const content = chunk.choices[0]?.delta?.content || ''
                    controller.enqueue(new TextEncoder().encode(content))
                }
                controller.close()
            },
        })

        return new Response(stream)
    } catch (error: any) {
        console.error('Chat API Error:', error)
        return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    }
}
