import { NextResponse } from 'next/server';
import { createServerClient } from "@supabase/ssr";
import OpenAI from "openai";
import { cookies } from "next/headers";

const apiKey = process.env.OPENAI_API_KEY || '';
const openai = new OpenAI({ apiKey });

export async function POST(req: Request) {
    try {
        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() { return cookieStore.getAll(); },
                    setAll(cookiesToSet) {
                        try {
                            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
                        } catch { }
                    }
                },
            }
        );

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { data: client } = await supabase.from('clients').select('role').eq('id', user.id).single();
        if (client?.role !== 'admin') {
            return NextResponse.json({ error: "Forbidden: Admin only" }, { status: 403 });
        }

        const { exerciseName, exerciseDescription } = await req.json();

        if (!exerciseName) {
            return NextResponse.json({ error: "Missing exercise name" }, { status: 400 });
        }

        const cleanExerciseName = exerciseName.toLowerCase().replace(/[^a-z0-9]/g, '-');

        // 1. Check if video already exists in the cache table
        const { data: cachedVisual, error: cacheError } = await supabase
            .from('tai_chi_visuals')
            .select('video_url')
            .eq('exercise_name', cleanExerciseName)
            .single();

        if (cachedVisual && cachedVisual.video_url) {
            console.log(`[Cache Hit] Returning existing video for ${exerciseName}`);
            return NextResponse.json({ videoUrl: cachedVisual.video_url });
        }

        // 2. Not in cache -> Generate using OpenAI Sora
        console.log(`[Cache Miss] Generating new video for ${exerciseName} using Sora...`);
        const prompt = `A highly professional, photorealistic educational video of a person performing the Tai Chi movement named "${exerciseName}". 
Context/Description of movement: "${exerciseDescription}". 
The video should clearly demonstrate the posture, balance, and hand positions in a slow, controlled motion. Clean, modern, soft-focus studio backdrop to make the instructor pop. Studio lighting, award-winning health and fitness videography.`;

        // Start video generation job
        const videoJob = await openai.videos.create({
            model: "sora-2",
            prompt: prompt,
            seconds: "4",
            size: "720x1280"
        });

        const videoId = videoJob.id;
        console.log(`[Sora] Started video job ${videoId}`);

        // Poll for completion (Wait up to 120 seconds)
        let isComplete = false;
        let fetchStart = Date.now();
        let currentJob = null;

        while (!isComplete && Date.now() - fetchStart < 120000) {
            await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds between polls
            currentJob = await openai.videos.retrieve(videoId);
            console.log(`[Sora] Polling job ${videoId} - Status: ${currentJob.status}`);

            if (currentJob.status === 'completed' || currentJob.status === 'failed') {
                isComplete = true;
            }
        }

        if (!currentJob || currentJob.status !== 'completed') {
            throw new Error(`Video generation failed or timed out. Status: ${currentJob?.status}`);
        }

        // 3. Download the MP4 content
        console.log(`[Sora] Video complete. Downloading MP4...`);
        const videoResponse = await openai.videos.downloadContent(videoId);

        if (!videoResponse.ok) {
            throw new Error(`Failed to download MP4 from OpenAI. Status: ${videoResponse.status}`);
        }

        const arrayBuffer = await videoResponse.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // 4. Upload to Supabase Storage
        const fileName = `${cleanExerciseName}-${Date.now()}.mp4`;

        console.log(`[Supabase] Uploading to tai_chi_videos bucket as ${fileName}...`);

        // Since we are uploading from the server, we can use the Service Role key 
        // to bypass RLS for inserting to the bucket, OR we can upload acting as the admin user.
        // We'll use the user client. Make sure the 'tai_chi_videos' bucket allows authenticated inserts.
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('tai_chi_videos')
            .upload(fileName, buffer, {
                contentType: 'video/mp4',
                upsert: true
            });

        if (uploadError) {
            console.error("Storage upload error:", uploadError);
            throw new Error(`Failed to upload video to storage: ${uploadError.message}`);
        }

        // 5. Get Public URL and cache it
        const { data: publicUrlData } = supabase.storage
            .from('tai_chi_videos')
            .getPublicUrl(fileName);

        const videoUrl = publicUrlData.publicUrl;

        console.log(`[Cache] Saving mapping to database: ${cleanExerciseName} -> ${videoUrl}`);
        const { error: insertError } = await supabase
            .from('tai_chi_visuals')
            .insert([
                { exercise_name: cleanExerciseName, video_url: videoUrl }
            ]);

        if (insertError) {
            // Log it but still return the generated video URL
            console.error("Error saving to visuals cache table:", insertError);
        }

        return NextResponse.json({ videoUrl: videoUrl });

    } catch (error: any) {
        console.error("Generate Tai Chi Video Error:", error.message, error.stack);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
