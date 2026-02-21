-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Table: k9_dogs
CREATE TABLE IF NOT EXISTS public.k9_dogs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users,
    name TEXT NOT NULL,
    breed TEXT NOT NULL,
    age_months INTEGER NOT NULL,
    energy_level TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.k9_dogs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own dogs" ON public.k9_dogs
    FOR ALL USING (auth.uid() = user_id);

-- Table: k9_training_goals
CREATE TABLE IF NOT EXISTS public.k9_training_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dog_id UUID NOT NULL REFERENCES public.k9_dogs(id) ON DELETE CASCADE,
    desired_outcome TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.k9_training_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their dog goals" ON public.k9_training_goals
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.k9_dogs d WHERE d.id = dog_id AND d.user_id = auth.uid()
        )
    );

-- Table: k9_video_submissions
CREATE TABLE IF NOT EXISTS public.k9_video_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users,
    dog_id UUID NOT NULL REFERENCES public.k9_dogs(id) ON DELETE CASCADE,
    goal_id UUID NOT NULL REFERENCES public.k9_training_goals(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'uploaded',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.k9_video_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their video submissions" ON public.k9_video_submissions
    FOR ALL USING (auth.uid() = user_id);

-- Table: k9_ai_feedback_logs
CREATE TABLE IF NOT EXISTS public.k9_ai_feedback_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID NOT NULL REFERENCES public.k9_video_submissions(id) ON DELETE CASCADE,
    raw_json_response JSONB NOT NULL,
    behavior_evaluation TEXT,
    handler_evaluation TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.k9_ai_feedback_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their ai feedback logs" ON public.k9_ai_feedback_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.k9_video_submissions s WHERE s.id = submission_id AND s.user_id = auth.uid()
        )
    );

-- Table: k9_daily_checkins
CREATE TABLE IF NOT EXISTS public.k9_daily_checkins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users,
    dog_id UUID NOT NULL REFERENCES public.k9_dogs(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    completed_drills JSONB NOT NULL DEFAULT '[]'::jsonb,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, dog_id, date)
);
ALTER TABLE public.k9_daily_checkins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their daily checkins" ON public.k9_daily_checkins
    FOR ALL USING (auth.uid() = user_id);

-- Table: k9_scrapbook_entries
CREATE TABLE IF NOT EXISTS public.k9_scrapbook_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users,
    dog_id UUID NOT NULL REFERENCES public.k9_dogs(id) ON DELETE CASCADE,
    goal_id UUID NOT NULL REFERENCES public.k9_training_goals(id) ON DELETE CASCADE,
    media_path TEXT NOT NULL,
    caption TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.k9_scrapbook_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their scrapbook entries" ON public.k9_scrapbook_entries
    FOR ALL USING (auth.uid() = user_id);

-- Table: k9_usage_limits
CREATE TABLE IF NOT EXISTS public.k9_usage_limits (
    user_id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    tier TEXT NOT NULL DEFAULT 'free',
    monthly_video_limit INTEGER NOT NULL DEFAULT 3,
    api_calls_this_month INTEGER NOT NULL DEFAULT 0,
    current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    current_period_end TIMESTAMPTZ NOT NULL DEFAULT NOW() + interval '1 month'
);
ALTER TABLE public.k9_usage_limits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their usage limits" ON public.k9_usage_limits
    FOR SELECT USING (auth.uid() = user_id);

-- Storage bucket for videos
INSERT INTO storage.buckets (id, name, public) VALUES ('k9-videos', 'k9-videos', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for k9-videos
CREATE POLICY "Users can upload their own videos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'k9-videos' AND 
    (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can select their own videos"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'k9-videos' AND 
    (storage.foldername(name))[1] = auth.uid()::text
);

-- RPC for securely incrementing API usage limit
CREATE OR REPLACE FUNCTION increment_k9_api_usage(user_id_param UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.k9_usage_limits
    SET api_calls_this_month = api_calls_this_month + 1
    WHERE user_id = user_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

