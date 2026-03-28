import OpenAI from "openai";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const apiKey = process.env.OPENAI_API_KEY || '';
const openai = new OpenAI({ apiKey });

async function testGeneration() {
    const profile = {
        medical_conditions: ["Arthritis", "Knee Issues"],
        physical_abilities: "Stiff joints but okay balance",
        daily_time_commitment: 15,
        sessions_per_day: 2,
        goal_1_month: "Improve flexibility",
        goal_2_month: "N/A",
        goal_6_month: "N/A",
        goal_1_year: "N/A"
    };

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
- Medical Conditions: ${profile.medical_conditions.join(', ')}
- Physical Abilities: ${profile.physical_abilities}
- Daily Time Commitment: ${profile.sessions_per_day} session(s) per day, ${profile.daily_time_commitment} mins per session
- 1 Month Goal: ${profile.goal_1_month}
- 2 Month Goal: ${profile.goal_2_month}
- 6 Month Goal: ${profile.goal_6_month}
- 1 Year Goal: ${profile.goal_1_year}

Please generate their first week of the structural plan. Return ONLY JSON.`;

    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            response_format: { type: "json_object" },
            messages: [
                { role: "system", content: systemInstruction },
                { role: "user", content: prompt }
            ]
        });

        const resJsonRaw = completion.choices[0].message.content || "{}";
        console.log("RAW RESPONSE:");
        console.log(resJsonRaw);

        let planData;
        try {
            planData = JSON.parse(resJsonRaw);

            if (!Array.isArray(planData)) {
                const possibleArray = Object.values(planData).find(v => Array.isArray(v));
                if (possibleArray) {
                    planData = possibleArray;
                } else {
                    throw new Error("AI did not return a valid array of days");
                }
            }
            console.log("\n✅ CLEAN PARSE SUCCESS!");
        } catch (e1) {
            console.error("\n❌ FAILED TO PARSE JSON COMPLETELY.");
        }

        console.log("FINAL PARSED DATA:");
        console.dir(planData, { depth: null });

    } catch (e) {
        console.error("Fatal Error:", e);
    }
}

testGeneration();
