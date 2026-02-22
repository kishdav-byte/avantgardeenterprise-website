import { NextResponse } from 'next/server';
import { createServerClient } from "@supabase/ssr";
import OpenAI from "openai";
import { cookies } from "next/headers";
import drills from '../../../../data/k9_drill_library.json';

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

        const systemInstruction = `You are an expert dog trainer AI called Pawgress AI. 
      You will be provided with a dog's profile and the handler's overarching goal. 
      There is NO video provided for this initial baseline prompt.
      Generate a progressive 24-week (6-month) interactive training plan tailored to this specific dog's baseline. 
      
      CRITICAL TRAINING RULES:
      1. REPETITION IS KEY: You will output a WEEKLY plan (24 total weeks). Handlers will repeat the assigned daily routine every training day for that entire week to build rigorous consistency and muscle memory before advancing.
      2. FILL THE TIME COMPLETELY: If the handler has 20 mins/day, and a drill only takes 10 mins, you MUST assign 2 different drills to the 'daily_routine' to fill the full 20 minutes. If they have 30 mins, assign 3 drills, etc. 
      3. DRILL SELECTION & PROGRESSION: You have 6 months (24 weeks). Start with basic foundations for the first month, but by the middle and end of the plan, you MUST actively progress the dog into highly advanced disciplines (like Long-Distance Fetch, Advanced Search, Off-Leash Heeling, Agility, Protection basics) based on their specific goals. A Hunting dog should genuinely take 6 months of escalating work! For the 'daily_routine' array, you MUST select from this exact list of library drills: [${allowedDrills}]. If none fit perfectly, pick the closest one.
      
      Return ONLY a JSON response matching the required schema exactly, with NO markdown formatting, NO backticks. Schema must include:
      {
        "initial_feedback": "A 2-4 sentence personalized evaluation. If they have lofty goals but very low time (e.g. 10 mins/day for a Protection Dog), kindly suggest splitting it into multiple sessions. State the reality that complex training takes 6+ months of patience and repetition.",
        "weekly_plan": [ { "week": 1, "focus": "...", "description": "...", "daily_routine": ["The Name Game", "Focus Wall"] }, ... up to 24 weeks ]
      }`;

        const userPrompt = `Dog Context: ${dogData?.name} is a ${dogData?.age_months} month old ${dogData?.color} ${dogData?.breed} with ${dogData?.energy_level} energy.
    Current Skill Level: ${dogData?.current_skill_level}.
    Current Concerns: ${dogData?.current_concerns || 'None'}.
    Training Goal: ${goalData?.desired_outcome}.
    Schedule: ${dogData?.training_minutes_per_day} minutes per day, ${dogData?.training_days_per_week} days per week.

    Please generate the full 24-week baseline 'weekly_plan' JSON array. 
    - IMPORTANT: Mathematically ensure that the number of drills assigned per week's daily_routine adds up equally to their requested ${dogData?.training_minutes_per_day} minutes (Assume each drill takes ~10 minutes).
    - IMPORTANT: Ensure high repetition by providing the exact same routine for all training days in a given week. 
    - Include rest days implicitly: they will train ${dogData?.training_days_per_week} days/week utilizing this routine, and rest the other days.
    - IMPORTANT: Ensure you generate all 24 WEEKS to give a truly long-term 6-month roadmap towards advanced skills.`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: systemInstruction },
                { role: "user", content: userPrompt }
            ],
            response_format: { type: "json_object" },
        });

        const resJsonRaw = completion.choices[0].message.content || "{}";

        let resJson;
        try {
            resJson = JSON.parse(resJsonRaw);
        } catch {
            const cleaned = resJsonRaw.replace(/^```json/g, "").replace(/```$/g, "");
            resJson = JSON.parse(cleaned);
        }

        // Log the plan
        const { error: logError } = await supabase.from('k9_ai_feedback_logs').insert({
            submission_id: submission.id,
            raw_json_response: resJson,
            behavior_evaluation: resJson?.initial_feedback || "Initial Baseline Assessment generated from textual profile.",
            handler_evaluation: "No video provided yet. Focus on building consistency."
        });

        if (logError) {
            console.error("DB Log Error:", logError);
            throw new Error(`Failed to save AI log: ${logError.message}`);
        }

        return NextResponse.json(resJson);

    } catch (error: any) {
        console.error("Baseline Plan Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
