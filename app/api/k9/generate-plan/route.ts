import { NextResponse } from 'next/server';
import { createServerClient } from "@supabase/ssr";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { cookies } from "next/headers";
import drills from '../../../../data/k9_drill_library.json';

const apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

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

        const { dogId, goalId } = await req.json();
        if (!dogId || !goalId) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

        const { data: goalData } = await supabase.from('k9_training_goals').select('*').eq('id', goalId).single();
        const { data: dogData } = await supabase.from('k9_dogs').select('*').eq('id', dogId).single();

        // Create a 'submission' record to hold this baseline plan
        const { data: submission } = await supabase.from('k9_video_submissions').insert({
            user_id: user.id,
            dog_id: dogId,
            goal_id: goalId,
            storage_path: 'baseline_text_generation',
            status: 'analyzed'
        }).select().single();

        if (!submission) throw new Error("Could not create baseline tracking record");

        const allowedDrills = drills.map(d => `'${d.name}'`).join(", ");

        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-pro",
            systemInstruction: `You are an expert dog trainer AI called Pawgress AI. 
      You will be provided with a dog's profile and the handler's overarching goal. 
      There is NO video provided for this initial baseline prompt.
      Generate a progressive 30-day interactive calendar (training plan) tailored to this specific dog's baseline. 
      IMPORTANT: For the 'drills' array inside each calendar day, you MUST select from this exact list of library drills: [${allowedDrills}]. If none fit perfectly, pick the closest one.
      Return ONLY a JSON response matching the required schema exactly, with NO markdown formatting, NO backticks. Schema must include { "training_plan": [ { "day": 1, "focus": "...", "description": "...", "drills": ["The Name Game", ...] } ] }`,
            generationConfig: {
                responseMimeType: "application/json",
            },
        });

        const prompt = `Dog Context: ${dogData?.name} is a ${dogData?.age_months} month old ${dogData?.color} ${dogData?.breed} with ${dogData?.energy_level} energy.
    Current Skill Level: ${dogData?.current_skill_level}.
    Current Concerns: ${dogData?.current_concerns || 'None'}.
    Training Goal: ${goalData?.desired_outcome}.
    Schedule: ${dogData?.training_minutes_per_day} mins/day, ${dogData?.training_days_per_week} days/week.

    Please generate the 30-day baseline 'training_plan' JSON array. Make it highly progressive based on their specific concerns and goals. Include rest days based on their schedule of ${dogData?.training_days_per_week} days/week.`;

        const result = await model.generateContent(prompt);
        const resJsonRaw = result.response.text();

        let resJson;
        try {
            resJson = JSON.parse(resJsonRaw);
        } catch {
            const cleaned = resJsonRaw.replace(/^```json/g, "").replace(/```$/g, "");
            resJson = JSON.parse(cleaned);
        }

        // Log the plan
        await supabase.from('k9_ai_feedback_logs').insert({
            submission_id: submission.id,
            raw_json_response: resJson,
            behavior_evaluation: "Initial Baseline Assessment generated from textual profile.",
            handler_evaluation: "No video provided yet. Focus on building consistency."
        });

        return NextResponse.json(resJson);

    } catch (error: any) {
        console.error("Baseline Plan Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
