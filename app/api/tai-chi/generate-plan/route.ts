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
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Must be an admin
        const { data: client } = await supabase.from('clients').select('role').eq('id', user.id).single();
        if (client?.role !== 'admin') {
            return NextResponse.json({ error: "Forbidden: Admin only" }, { status: 403 });
        }

        const { profile } = await req.json();
        if (!profile) {
            return NextResponse.json({ error: "Profile data is required" }, { status: 400 });
        }

        const systemInstruction = `You are an expert, highly knowledgeable Tai Chi Master and physical therapist AI.
You are tasked with creating a highly personalized daily Tai Chi exercise plan for a user.
You must adhere strictly to their medical constraints, current physical abilities, and the daily time limit they have specified.
Your response MUST be ONLY valid JSON containing an object with a single key 'routine' which is an array of exactly 7 days, representing the user's weekly routine.

Each day object in the 'routine' array must have the following structure:
{
  "day": "Day 1",
  "focus": "Brief focus for the day (e.g., Balance and Breath)",
  "daily_routine": [
    {
      "name": "Name of Exercise/Stance",
      "duration": "e.g., 5 mins",
      "description": "Step by step instructions tailored to their abilities and constraints"
    }
  ]
}

Ensure the total duration of the daily_routine items approximately matches their daily_time_commitment limit (${profile.sessions_per_day} session(s) of ${profile.daily_time_commitment} mins each day).`;

        const prompt = `User Profile:
- Medical Conditions: ${profile.medical_conditions?.join(', ') || 'None'}
- Physical Abilities: ${profile.physical_abilities}
- Daily Time Commitment: ${profile.sessions_per_day} session(s) per day, ${profile.daily_time_commitment} mins per session
- 1 Month Goal: ${profile.goal_1_month}
- 2 Month Goal: ${profile.goal_2_month}
- 6 Month Goal: ${profile.goal_6_month}
- 1 Year Goal: ${profile.goal_1_year}

Please generate their first week of the structural plan. Return ONLY JSON.`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            response_format: { type: "json_object" },
            messages: [
                { role: "system", content: systemInstruction },
                { role: "user", content: prompt }
            ]
        });

        const resJsonRaw = completion.choices[0].message.content || "{}";
        let planData;
        try {
            planData = JSON.parse(resJsonRaw);

            // OpenAI response_format json_object often wraps arrays in an object key if we specify we want an array. 
            // We should ensure we extract the array if it wrapped it.
            if (!Array.isArray(planData)) {
                // If it returned { "plan": [...] } or { "routine": [...] }
                const possibleArray = Object.values(planData).find(v => Array.isArray(v));
                if (possibleArray) {
                    planData = possibleArray;
                } else {
                    throw new Error("AI did not return a valid array of days");
                }
            }
        } catch (e1) {
            console.error("Failed to parse OpenAI JSON:", resJsonRaw);
            throw new Error("AI returned invalid data format");
        }

        // Save the generated plan to Supabase
        // First invalidate any old active plans
        await supabase.from('tai_chi_plans').update({ is_active: false }).eq('user_id', user.id).eq('is_active', true);

        const { data: newPlan, error: insertError } = await supabase.from('tai_chi_plans').insert({
            user_id: user.id,
            plan_data: { week_1: planData, daily_routine: planData[0]?.daily_routine || [] }, // defaulting daily_routine to day 1 for the dashboard display
            is_active: true
        }).select().single();

        if (insertError) {
            console.error("Error saving plan:", insertError);
            return NextResponse.json({ error: "Failed to save plan to database" }, { status: 500 });
        }

        return NextResponse.json({ success: true, plan: newPlan });

    } catch (error: any) {
        console.error("Tai Chi Plan Generation Error:", error.message, error.stack);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
