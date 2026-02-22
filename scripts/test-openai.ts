import OpenAI from "openai";
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function main() {
    const systemInstruction = `You are Pawgress AI... (truncated for brevity)
=== STRICT JSON RESPONSE SCHEMA ===
{
  "assessment": {
    "breed_notes": "...",
    "age_stage": "...",
    "goal_complexity": "...",
    "recommended_session_minutes": 20,
    "recommended_sessions_per_day": 2,
    "recommended_days_per_week": 5,
    "recommended_program_weeks": 32,
    "trainer_note": "..."
  },
  "weekly_plan": [
    {
      "week": 1,
      "phase": "Foundation",
      "focus": "...",
      "description": "...",
      "daily_routine": ["Sit", "Stay"],
      "trainer_tip": "..."
    }
  ]
}`;

    const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
            { role: "system", content: systemInstruction },
            { role: "user", content: "Dog: Sample" }
        ],
        response_format: { type: "json_object" },
    });

    console.log(completion.choices[0].message.content);
}
main();
