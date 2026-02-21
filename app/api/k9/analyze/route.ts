import { NextResponse } from 'next/server';
import { createServerClient } from "@supabase/ssr";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import { cookies } from "next/headers";
import fs from 'fs';
import path from 'path';
import os from 'os';
import drills from '../../../../data/k9_drill_library.json';

// Polyfill fetch for Node if needed, but NextApp gives native fetch
const apiKey = process.env.GEMINI_API_KEY || process.env.Gemini_API_Key || process.env.OPENAI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);
const fileManager = new GoogleAIFileManager(apiKey);

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
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Rate Limiting (Usage Limiting Middleware)
        const { data: usageLimit } = await supabase
            .from("k9_usage_limits")
            .select("*")
            .eq("user_id", user.id)
            .single();

        if (usageLimit) {
            if (usageLimit.api_calls_this_month >= usageLimit.monthly_video_limit) {
                return NextResponse.json({ error: "Monthly API limit exceeded." }, { status: 429 });
            }
        } else {
            // Create default free limit
            await supabase.from("k9_usage_limits").insert({ user_id: user.id });
        }

        const { videoPath, dogId, goalId } = await req.json();

        if (!videoPath || !dogId || !goalId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const { data: submission } = await supabase.from('k9_video_submissions').insert({
            user_id: user.id,
            dog_id: dogId,
            goal_id: goalId,
            storage_path: videoPath,
            status: 'processing'
        }).select().single();

        if (!submission) {
            return NextResponse.json({ error: "Internal Error tracking submission" }, { status: 500 });
        }

        // Get signed URL to download
        const { data: signedUrlData, error: sError } = await supabase
            .storage
            .from('k9-videos')
            .createSignedUrl(videoPath, 60 * 10);

        if (sError || !signedUrlData) {
            return NextResponse.json({ error: "Could not access video cloud storage" }, { status: 500 });
        }

        // Fetch video from bucket to temp storage to pass to Gemini
        const videoResponse = await fetch(signedUrlData.signedUrl);
        const videoBuffer = await videoResponse.arrayBuffer();

        const tempFilePath = path.join(os.tmpdir(), `k9_video_${Date.now()}.mp4`);
        fs.writeFileSync(tempFilePath, Buffer.from(videoBuffer));

        // Upload to Gemini
        const uploadResult = await fileManager.uploadFile(tempFilePath, {
            mimeType: "video/mp4",
            displayName: "Dog Training Video"
        });

        let file = await fileManager.getFile(uploadResult.file.name);
        while (file.state === "PROCESSING") {
            process.stdout.write(".")
            await new Promise((resolve) => setTimeout(resolve, 5000));
            file = await fileManager.getFile(uploadResult.file.name);
        }

        if (file.state === "FAILED") {
            throw new Error("Video processing failed inside AI.");
        }

        const { data: goalData } = await supabase.from('k9_training_goals').select('*').eq('id', goalId).single();
        const { data: dogData } = await supabase.from('k9_dogs').select('*').eq('id', dogId).single();

        const allowedDrills = drills.map(d => `'${d.name}'`).join(", ");

        const systemInstruction = `You are an expert dog trainer AI called Pawgress AI. 
      You will be provided a video of a dog and handler, along with the dog's details and the handler's overarching goal.
      Evaluate the dog's behavior and the handler's technique. Then generate a 30-day interactive calendar (training plan). 
      IMPORTANT: For the 'drills' array inside each calendar day, you MUST select from this exact list of library drills: [${allowedDrills}]. If none fit perfectly, pick the closest one.
      Return ONLY a JSON response matching the required schema exactly, with NO markdown formatting, NO backticks.`;

        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            systemInstruction: systemInstruction,
            generationConfig: {
                responseMimeType: "application/json",
            },
        });

        const prompt = `Dog Context: ${dogData?.name} is a ${dogData?.age_months} month old ${dogData?.breed} with ${dogData?.energy_level} energy.
    Training Goal: ${goalData?.desired_outcome}

    Please analyze the attached video and give me the JSON output with 'evaluation' (dog_behavior, handler_technique) and 'training_plan' (calendar of 30 days) and 'drills'.`;

        const result = await model.generateContent([
            {
                fileData: {
                    mimeType: uploadResult.file.mimeType,
                    fileUri: uploadResult.file.uri
                }
            },
            { text: prompt }
        ]);

        const resJsonRaw = result.response.text();
        let resJson;
        try {
            resJson = JSON.parse(resJsonRaw);
        } catch {
            const cleaned = resJsonRaw.replace(/^```json/g, "").replace(/```$/g, "");
            resJson = JSON.parse(cleaned);
        }

        // Log the interaction
        await supabase.from('k9_ai_feedback_logs').insert({
            submission_id: submission.id,
            raw_json_response: resJson,
            behavior_evaluation: resJson?.evaluation?.dog_behavior,
            handler_evaluation: resJson?.evaluation?.handler_technique
        });

        // Clean up
        fs.unlinkSync(tempFilePath);
        await fileManager.deleteFile(uploadResult.file.name);

        // Update submission
        await supabase.from('k9_video_submissions').update({ status: 'analyzed' }).eq('id', submission.id);

        // Increment usage
        await supabase.rpc('increment_k9_api_usage', { user_id_param: user.id });

        return NextResponse.json(resJson);

    } catch (error: any) {
        console.error("K9 Video Analyze Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
