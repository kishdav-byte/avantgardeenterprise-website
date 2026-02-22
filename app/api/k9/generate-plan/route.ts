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
      Generate a progressive 60-day interactive calendar (training plan) tailored to this specific dog's baseline. 
      
      CRITICAL TRAINING RULES:
      1. REPETITION IS KEY: Do NOT just give a new drill every single day. Master dog trainers spend several consecutive days (or even weeks) repeating the exact same core drills to build consistency and muscle memory before moving to advanced variations.
      2. FILL THE TIME COMPLETELY: If the handler has 20 mins/day, and a drill only takes 10 mins, you MUST assign 2 different drills for that day to fill the full 20 minutes. If they have 30 mins, assign 3 drills, etc. Handlers want to use their full allotted time. You may also suggest repeating the same drill twice in one day if it fits the repetition goal.
      3. DRILL SELECTION & PROGRESSION: You have 60 days. Start with foundations, but by the middle and end of the plan, you MUST actively progress the dog into advanced drills (like Fetch, Search, Heeling, Agility) based on their goals. For the 'drills' array inside each calendar day, you MUST select from this exact list of library drills: [${allowedDrills}]. If none fit perfectly, pick the closest one.
      
      Return ONLY a JSON response matching the required schema exactly, with NO markdown formatting, NO backticks. Schema must include:
      {
        "initial_feedback": "A 2-4 sentence personalized evaluation. If they have lofty goals but very low time (e.g. 10 mins/day for a Protection Dog), kindly suggest splitting it into multiple sessions or adding more time. State the reality that dog training takes patience, repetition, and time.",
        "training_plan": [ { "day": 1, "focus": "...", "description": "...", "drills": ["The Name Game", "Focus Wall"] }, ... up to 60 days ]
      }`;

        const userPrompt = `Dog Context: ${dogData?.name} is a ${dogData?.age_months} month old ${dogData?.color} ${dogData?.breed} with ${dogData?.energy_level} energy.
    Current Skill Level: ${dogData?.current_skill_level}.
    Current Concerns: ${dogData?.current_concerns || 'None'}.
    Training Goal: ${goalData?.desired_outcome}.
    Schedule: ${dogData?.training_minutes_per_day} minutes per day, ${dogData?.training_days_per_week} days per week.

    Please generate the full 60-day baseline 'training_plan' JSON array. 
    - IMPORTANT: Mathematically ensure that the number of drills assigned per day adds up equally to their requested ${dogData?.training_minutes_per_day} minutes (Assume each drill takes ~10 minutes).
    - IMPORTANT: Ensure high repetition! Repeat core drills across multiple consecutive days to build a strong foundation. 
    - Include rest days explicitly based on their schedule of ${dogData?.training_days_per_week} days/week.
    - IMPORTANT: Ensure you generate all 60 days to give a truly progressive roadmap towards advanced skills.`;

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
