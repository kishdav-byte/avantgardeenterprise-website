# K9 Training Module Architecture

## 1. Database Schema Extensions (Supabase)

We need to add the following tables to the existing PostgreSQL database to support the K9 Training Micro-SaaS. All tables will use Row Level Security (RLS) to ensure users can only access their own data.

### `k9_dogs`
Stores individual dog profiles and baseline details.
- `id`: UUID (Primary Key, Default: `uuid_generate_v4()`)
- `user_id`: UUID (References `auth.users`, Foreign Key)
- `name`: TEXT
- `breed`: TEXT
- `age_months`: INTEGER
- `energy_level`: TEXT (e.g., 'Low', 'Medium', 'High', 'Working')
- `created_at`: TIMESTAMPTZ

### `k9_training_goals`
Captures the highly specific training outcomes desired by the user.
- `id`: UUID (Primary Key)
- `dog_id`: UUID (References `k9_dogs`, Foreign Key)
- `desired_outcome`: TEXT (e.g., "Hunting dog and family companion that obeys commands and is well behaved around people.")
- `status`: TEXT (e.g., 'active', 'completed', 'paused')
- `created_at`: TIMESTAMPTZ

### `k9_video_submissions`
Tracks the processing state of user-uploaded videos.
- `id`: UUID (Primary Key)
- `user_id`: UUID (References `auth.users`, Foreign Key)
- `dog_id`: UUID (References `k9_dogs`, Foreign Key)
- `goal_id`: UUID (References `k9_training_goals`, Foreign Key)
- `storage_path`: TEXT (Path to the video file in the secure cloud bucket. Expiry/Auto-deletion rules will be governed by bucket policies)
- `status`: TEXT (e.g., 'uploaded', 'processing', 'analyzed', 'failed')
- `created_at`: TIMESTAMPTZ

### `k9_ai_feedback_logs`
Stores the outputs from the AI API.
- `id`: UUID (Primary Key)
- `submission_id`: UUID (References `k9_video_submissions`, Foreign Key)
- `raw_json_response`: JSONB (The exact, unaltered JSON received from the LLM)
- `behavior_evaluation`: TEXT
- `handler_evaluation`: TEXT
- `created_at`: TIMESTAMPTZ

### `k9_daily_checkins`
Powers the mobile-optimized compliance tracking form for the user.
- `id`: UUID (Primary Key)
- `user_id`: UUID (References `auth.users`, Foreign Key)
- `dog_id`: UUID (References `k9_dogs`, Foreign Key)
- `date`: DATE
- `completed_drills`: JSONB (Array of drill IDs completed that day)
- `notes`: TEXT (Optional user journal entry)
- `created_at`: TIMESTAMPTZ

### `k9_scrapbook_entries`
Stores user-uploaded photos, video clips, and notes throughout their dog's training journey. This content can be compiled into a 'Scrapbook summary' at the end of the 30-day period.
- `id`: UUID (Primary Key)
- `user_id`: UUID (References `auth.users`, Foreign Key)
- `dog_id`: UUID (References `k9_dogs`, Foreign Key)
- `goal_id`: UUID (References `k9_training_goals`, Foreign Key)
- `media_path`: TEXT (Path to the image/video snippet in cloud storage)
- `caption`: TEXT (User's memory note or caption)
- `created_at`: TIMESTAMPTZ

### `k9_usage_limits`
Handles tiered API usage logically per user month-to-month.
- `user_id`: UUID (Primary Key, References `auth.users`)
- `tier`: TEXT (e.g., 'free', 'pro', 'elite')
- `monthly_video_limit`: INTEGER
- `api_calls_this_month`: INTEGER (Default: 0)
- `current_period_start`: TIMESTAMPTZ
- `current_period_end`: TIMESTAMPTZ


---

## 2. API <-> Calendar UI Integration (JSON Contract)

The backend will strictly instruct the AI (Gemini/OpenAI) via a system prompt to return the response in the following structured JSON format. This standardized JSON will be saved into `k9_ai_feedback_logs.raw_json_response` and subsequently streamed to the frontend for UI parsing.

```json
{
  "evaluation": {
    "dog_behavior": "The 11-week-old lab puppy is highly energetic and responsive but exhibits distractibility towards the end of the clip, which is expected at this age.",
    "handler_technique": "Handler is overly repeating commands without waiting for response. Timing of praise is slightly delayed by 1-2 seconds."
  },
  "training_plan": {
    "duration_days": 30,
    "calendar": [
      {
        "day": 1,
        "focus_area": "Basic Engagement & Attention",
        "pacing_notes": "Keep sessions short to avoid burnout. Stop while the puppy is still engaged.",
        "success_criteria": "Puppy looks at you 80% of the time when name is called.",
        "drills": [
          {
            "id": "drill_1_1",
            "title": "Name Recognition Game",
            "description": "Say the puppy's name once in an upbeat tone. When he looks, immediately mark with 'Yes!' and reward.",
            "duration_minutes": 5,
            "category": "obedience"
          },
          {
            "id": "drill_1_2",
            "title": "Boundary Setting: Crate Acclimation",
            "description": "Toss high-value treats into the crate. Do not force the puppy in; let him explore and associate it with good things.",
            "duration_minutes": 10,
            "category": "boundary_setting"
          }
        ]
      }
      // ... Objects for Days 2 through 30 ...
    ]
  }
}
```

### Flow of Data:
1. User uploads `<video>.mp4` + select `dog` and `goal`.
2. Frontend requests Signed Upload URL from backend.
3. Video is uploaded to Bucket.
4. Backend triggers the AI Service Wrapper.
5. AI multimodal model analyzes video & goal context.
6. Backend parses AI response, validating the JSON schema above.
7. Valid JSON is committed to the database.
8. Frontend fetches `k9_ai_feedback_logs` for the submission and iterates over `training_plan.calendar` to construct the interactive 30-day UI.
