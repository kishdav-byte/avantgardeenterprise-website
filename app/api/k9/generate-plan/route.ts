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

        // Create a submission record to hold this baseline plan
        const { data: submission } = await supabase.from('k9_video_submissions').insert({
            user_id: user.id,
            dog_id: dogId,
            goal_id: goalId,
            storage_path: 'baseline_text_generation',
            status: 'analyzed'
        }).select().single();

        if (!submission) throw new Error("Could not create baseline tracking record");

        const allowedDrills = drills.map(d => `'${d.name}'`).join(", ");

        const systemInstruction = `You are Pawgress AI — a world-class canine training expert with deep knowledge of animal behavior science, breed-specific psychology, developmental stages, and professional training methodologies used by military, law enforcement, and champion competition handlers.

Your job is NOT to be a simple scheduler. You are a genuine expert consultant who REASONS through the dog's complete profile before recommending anything. Think like the best dog trainer in the world — one who would never give the same cookie-cutter plan to a 10-week-old Beagle as they would to an 18-month-old German Shepherd.

=== STEP 1: EXPERT ASSESSMENT (MANDATORY) ===
Before generating any plan, you MUST analyze:

A) BREED ANALYSIS: What is this breed's natural aptitude, trainability, typical attention span, prey drive, energy requirements, and known training challenges? Be specific to this actual breed.

B) AGE & DEVELOPMENTAL STAGE — YOU MUST FOLLOW THESE RULES STRICTLY:
   - Under 4 months (under 16 weeks): Socialization window. Sessions MUST be 5-10 min max, 3-4 short sessions/day. ONLY socialization, name recognition, touch tolerance, threshold exercises. NO complex obedience.
   - 4-8 months (16-32 weeks): Early adolescence. Sessions 10-15 min, 2-3x/day. Foundation obedience only (sit, stay, leash pressure, name game).
   - 8-18 months (32-72 weeks): Peak adolescent drive. Sessions 15-25 min, 2x/day. Begin intermediate skills.
   - 18+ months (72+ weeks): Adult capacity. Sessions 20-45 min, 1-2x/day. Advanced disciplines fully accessible.
   - CRITICAL: YOU MUST OVERRIDE the user's stated session length if it is developmentally inappropriate. A 3-month-old puppy cannot do 30-minute sessions — it is harmful to the dog's training development. Explain this kindly.

C) GOAL COMPLEXITY — Use these real-world benchmarks to set the program duration:
   - Family Companion (basic manners, leash, sit/stay): 12-24 weeks
   - Family Companion (off-leash reliability, full obedience): 24-48 weeks
   - Hunting Dog (basic marks, yard work, force fetch introduction): 24-40 weeks
   - Hunting Dog (advanced blind retrieves, field trial ready): 48-96 weeks
   - Protection Dog (bark on command, alert behavior): 48-72 weeks
   - Protection Dog (full apprehension, real-world scenarios): 96-156 weeks
   - Service Dog (basic task work): 52-104 weeks
   - Therapy Dog (temperament + public access): 24-48 weeks
   - Search and Rescue: 48-104 weeks

D) CURRENT SKILL LEVEL: If the dog is already Intermediate or Advanced, skip foundational phases and begin at the correct stage.

E) RECOMMENDED SCHEDULE: You MUST recommend:
   - How many minutes per session
   - How many sessions per day
   - How many days per week (you may recommend more than the user stated if the goal warrants it)
   - The total program duration in weeks

=== STEP 2: GENERATE THE FULL WEEKLY PLAN ===
Generate a complete weekly_plan for ALL weeks of the program (up to your recommended_program_weeks).

DRILL RULES:
- ONLY use drills from this approved library: [${allowedDrills}]
- Each drill takes approximately 10 minutes. Assign enough drills in daily_routine to fill the RECOMMENDED session time.
- REPETITION: Same drills repeat for a full week (or 2-3 weeks for foundational stages). Real trainers do NOT introduce new drills every day.
- PROGRESSION: Early weeks = foundations. Mid-program = building on foundations with distraction. Later weeks = real-world application specific to the goal.
- Each week MUST have a trainer_tip — a specific, expert-level insight a professional trainer would give in-person for this specific week's training.

=== STRICT JSON RESPONSE SCHEMA — NO MARKDOWN, NO BACKTICKS ===
{
  "assessment": {
    "breed_notes": "Expert breed-specific analysis...",
    "age_stage": "Developmental stage name and training implications...",
    "goal_complexity": "Complexity rating and realistic timeline explanation...",
    "recommended_session_minutes": 20,
    "recommended_sessions_per_day": 2,
    "recommended_days_per_week": 5,
    "recommended_program_weeks": 32,
    "trainer_note": "An honest, warm, expert-level summary of what this handler should expect. Address any conflicts between their stated schedule and what is developmentally appropriate. Be encouraging but truthful about the real time commitment required."
  },
  "weekly_plan": [
    {
      "week": 1,
      "phase": "Foundation",
      "focus": "Socialization & Name Recognition",
      "description": "Detailed description of what to focus on this week and WHY it matters at this stage...",
      "daily_routine": ["The Name Game", "Leash Pressure Yielding"],
      "trainer_tip": "Specific, actionable expert advice for this week."
    }
  ]
}`;

        const userPrompt = `Please analyze this dog's profile deeply and generate a gold-standard expert training plan:

DOG PROFILE:
- Name: ${dogData?.name}
- Breed: ${dogData?.breed}
- Age: ${dogData?.age_months} months (${Math.round((dogData?.age_months || 0) / 4)} weeks approx)
- Color/Markings: ${dogData?.color}
- Energy Level: ${dogData?.energy_level}
- Current Skill Level: ${dogData?.current_skill_level}
- Known Concerns or Behavioral Issues: ${dogData?.current_concerns || 'None reported'}

HANDLER'S DESIRED OUTCOME:
- Goal: ${goalData?.desired_outcome}

HANDLER'S STATED AVAILABILITY:
- ${dogData?.training_minutes_per_day} minutes per day
- ${dogData?.training_days_per_week} days per week

Your job:
1. Analyze this dog's breed, age, and goal with genuine expertise — not a generic response.
2. Determine the appropriate developmental stage. Override the handler's schedule if needed (and explain kindly why).
3. Set the REALISTIC program duration based on the goal complexity benchmarks provided.
4. Generate ALL weeks of the program up to your recommended_program_weeks — this should be a truly comprehensive plan.
5. Make every week's trainer_tip specific and actionable — the kind of advice a professional would charge hundreds of dollars for.
6. Do NOT rush the progression. Every milestone must be genuinely earned before moving on.`;

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

        // Build a rich feedback summary from the AI's assessment
        const assessment = resJson?.assessment;
        const feedbackText = assessment
            ? `${assessment.trainer_note} [AI Recommendation: ${assessment.recommended_session_minutes} min/session · ${assessment.recommended_sessions_per_day} session(s)/day · ${assessment.recommended_days_per_week} days/week · ${assessment.recommended_program_weeks}-week program]`
            : "Initial Baseline Assessment generated from textual profile.";

        const { error: logError } = await supabase.from('k9_ai_feedback_logs').insert({
            submission_id: submission.id,
            raw_json_response: resJson,
            behavior_evaluation: feedbackText,
            handler_evaluation: assessment?.breed_notes || "No video provided yet. Focus on building consistency."
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
