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
        const { text } = await request.json()

        if (!text) {
            return NextResponse.json({ error: 'Text is required' }, { status: 400 })
        }

        // Auth check - Admin only
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

        const { data: profile } = await supabase
            .from('clients')
            .select('role')
            .eq('id', session.user.id)
            .single()

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // Handle text splitting for TTS max 4096 char limit
        const MAX_CHARS = 4000;
        const chunks: string[] = [];

        // Simple splitting by max chars (imperfect, might cut words, but fine for simple chunking, though better to split by chunks of max 4000)
        let currentText = text;
        while (currentText.length > 0) {
            if (currentText.length <= MAX_CHARS) {
                chunks.push(currentText);
                break;
            } else {
                // Try to split by sentence or just substring
                let splitPoint = currentText.substring(0, MAX_CHARS).lastIndexOf('. ');
                if (splitPoint === -1) {
                    splitPoint = currentText.substring(0, MAX_CHARS).lastIndexOf(' ');
                }
                if (splitPoint === -1) {
                    splitPoint = MAX_CHARS;
                }
                chunks.push(currentText.substring(0, splitPoint + 1));
                currentText = currentText.substring(splitPoint + 1);
            }
        }

        const audioBuffers: Uint8Array[] = [];

        for (const chunk of chunks) {
            const mp3 = await openai.audio.speech.create({
                model: 'tts-1',
                voice: 'alloy', // modern conversational voice
                input: chunk,
            });

            const buffer = new Uint8Array(await mp3.arrayBuffer());
            audioBuffers.push(buffer);
        }

        // Concatenate buffers (for MP3, concatenating files directly is valid)
        const totalLength = audioBuffers.reduce((acc, curr) => acc + curr.length, 0);
        const concatenatedBuffer = new Uint8Array(totalLength);
        let offset = 0;
        for (const buffer of audioBuffers) {
            concatenatedBuffer.set(buffer, offset);
            offset += buffer.length;
        }

        return new NextResponse(concatenatedBuffer, {
            headers: {
                'Content-Type': 'audio/mpeg',
                'Content-Disposition': 'inline; filename="tts.mp3"',
            },
        });

    } catch (error: any) {
        console.error('Error in TTS generation:', error)
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
    }
}
