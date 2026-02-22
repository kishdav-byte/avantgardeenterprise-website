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

        const { data: pastLogs } = await supabase
            .from('k9_training_logs')
            .select('drill_name, score, notes')
            .eq('dog_id', dogId)
            .order('created_at', { ascending: false })
            .limit(20);

        let pastPerformanceStr = "No previous training logs available.";
        if (pastLogs && pastLogs.length > 0) {
            pastPerformanceStr = pastLogs.map(l => `- Drill: ${l.drill_name} | Score: ${l.score}/5 | Notes: ${l.notes || 'None'}`).join('\n');
        }

        const allowedDrills = drills.map(d => `'${d.name}'`).join(", ");

        const systemInstruction = `You are Pawgress AI — a world-class canine training expert with deep knowledge of animal behavior science, breed-specific psychology, developmental stages, and professional training methodologies used by military, law enforcement, and champion competition handlers.

Your job is NOT to be a simple scheduler. You are a genuine expert consultant who REASONS through the dog's complete profile before recommending anything. Think like the best dog trainer in the world — one who would never give the same cookie-cutter plan to a 10-week-old Beagle as they would to an 18-month-old German Shepherd.

=== STEP 1: EXPERT ASSESSMENT (MANDATORY) ===
Before generating any plan, you MUST analyze:

A) BREED ANALYSIS: What is this breed's natural aptitude, trainability, typical attention span, prey drive, energy requirements, and known training challenges? Be specific to this actual breed.

B) NEW PUPPIES vs ADULTS — STRICT RULES:
   - Under 4 months (under 16 weeks): DO NOT assign complex obedience (Heel, Advanced retrieve). The plan MUST focus heavily on House Training, crate acclimation, name recognition, bite inhibition, and tactile socialization. A puppy's brain cannot handle advanced pressure.
   - 4-8 months (16-32 weeks): Early adolescence. Begin structural obedience and yielding to leash pressure.
   - CRITICAL: YOU MUST OVERRIDE the user's stated session length if it is developmentally inappropriate. A 3-month-old puppy cannot do 30-minute sessions. Give them 5-10 minute micro-sessions. Explain this kindly in the trainer_note.

C) SPECIFIC PROFILES — GOLD STANDARD INTEGRATION:
   - If the user selects "House Training" or mentions bathroom issues: You MUST map the initial weeks heavily around "House Training: Scheduled Intervals", "House Training: Crate Acclimation", and "House Training: The Bell Game".
   - If the user selects "Hunting Dog": You MUST structure the long-term plan using gold-standard retriever/pointer fundamentals, including "Hunting: Scent Tracking Intro", "Hunting: Steadiness", "Hunting: Soft-Mouth Retrieve", and eventually "Hunting: Gunfire Desensitization" and "Hunting: Blind Retrieve Line Drill".

D) GOAL COMPLEXITY TIMELINES:
   - House Training / Puppy Basics: 4-8 weeks
   - Family Companion (basic manners): 12-24 weeks
   - Hunting Dog (marks, steadiness, scent): 24-48 weeks
   - Protection/Service Dog: 52-104 weeks

E) RECOMMENDED SCHEDULE: You MUST recommend:
   - How many minutes per session
   - How many sessions per day
   - How many days per week
   - The total program duration in weeks

=== STEP 2: GENERATE THE WEEKLY PLAN ===
Generate a complete weekly_plan for ALL weeks.

DRILL RULES:
1. ONLY use drills from this exact list: [${allowedDrills}]
2. DO NOT BE OVERLY REPETITIVE: While consistency is good, repeating exactly the same 2 drills for an entire month is boring. Provide a varied but consistent mix of 3-5 distinct drills per day.
3. PROGRESSION AND THE "THREE Ds": It is true that real training requires weeks of repetition to reach fluency. However, for the user experience, you MUST clearly explain HOW the drill gets harder each week (increasing Distance, Duration, or Distraction). Do not just copy-paste "Sit & Stay" for 3 weeks without explaining in the 'description' or 'trainer_tip' how this week is harder than last week.
4. PACING & FAST-TRACKING: This plan is a baseline. You must explicitly tell the handler (in the trainer_note and in some trainer_tips) that if the dog masters the skill early, they SHOULD accelerate to the next week's difficulty. Similarly, if they have extra time, encourage them to add additional short, low-stress training sessions throughout the day.
5. If they need multiple things (like generic obedience PLUS house training), layer them together. For example: ["House Training: Scheduled Intervals", "The Name Game", "Sit & Stay"].
6. Each week MUST have a unique trainer_tip — specific, expert-level insight.

=== STRICT JSON RESPONSE SCHEMA ===
{
  "assessment": {
    "breed_notes": "Expert breed-specific analysis...",
    "age_stage": "Developmental stage name and training implications...",
    "goal_complexity": "Complexity rating and realistic timeline explanation...",
    "recommended_session_minutes": 20,
    "recommended_sessions_per_day": 2,
    "recommended_days_per_week": 5,
    "recommended_program_weeks": 32,
    "trainer_note": "Honest, warm summary. Correct their schedule expectations if inappropriate. Explicitly empower them to fast-track if the dog is excelling or add sessions if they have the time."
  },
  "weekly_plan": [
    {
      "week": 1,
      "phase": "Foundation",
      "focus": "...",
      "description": "...",
      "daily_routine": ["Drill 1", "Drill 2", "Drill 3"],
      "trainer_tip": "..."
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

PREVIOUS TRAINING PERFORMANCE LOGS:
${pastPerformanceStr}

Your job:
1. Analyze this dog's profile and create a highly customized plan.
2. If "House Training" is requested or the dog is a puppy, MAKE IT A PRIORITY.
3. If "Hunting Dog" is requested, map a true field dog progression.
4. Don't be repetitive. Explain the 3 D's progression.
5. Encourage pacing flexibility (they can go faster if the dog is crushing it).
6. ADAPT TO LOGS: If you see previous logs with high scores (4-5), immediately advance the difficulty of those drills in this new plan. If you see low scores (1-2), regress the difficulty, simplify the drill, and provide encouraging notes.
7. Generate the entire timeline up to recommended_program_weeks.`;

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
