-- Tai Chi App Schema

-- Drop existing tables if they exist (useful for iterative development)
-- DROP TABLE IF EXISTS public.tai_chi_progress;
-- DROP TABLE IF EXISTS public.tai_chi_plans;
-- DROP TABLE IF EXISTS public.tai_chi_profiles;

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.tai_chi_profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    medical_conditions TEXT[] DEFAULT '{}',
    physical_abilities TEXT,
    daily_time_commitment INTEGER DEFAULT 15, -- in minutes
    sessions_per_day INTEGER DEFAULT 1, -- how many sessions of this duration
    goal_1_month TEXT,
    goal_2_month TEXT,
    goal_6_month TEXT,
    goal_1_year TEXT,
    current_weight DECIMAL(5,2), -- optionally link this to a separate weight table later
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for profiles
ALTER TABLE public.tai_chi_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" 
ON public.tai_chi_profiles FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.tai_chi_profiles FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.tai_chi_profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 2. Plans Table
CREATE TABLE IF NOT EXISTS public.tai_chi_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.tai_chi_profiles(user_id) ON DELETE CASCADE,
    plan_data JSONB NOT NULL, -- The AI-generated plan structure
    start_date DATE DEFAULT CURRENT_DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for plans
ALTER TABLE public.tai_chi_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own plans" 
ON public.tai_chi_plans FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own plans" 
ON public.tai_chi_plans FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own plans" 
ON public.tai_chi_plans FOR UPDATE 
USING (auth.uid() = user_id);

-- 3. Progress / Activity Log Table
CREATE TABLE IF NOT EXISTS public.tai_chi_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.tai_chi_profiles(user_id) ON DELETE CASCADE,
    plan_id UUID REFERENCES public.tai_chi_plans(id) ON DELETE CASCADE,
    date DATE DEFAULT CURRENT_DATE,
    completed_exercises JSONB, -- Array of specific exercises completed
    duration_minutes INTEGER,
    perceived_exertion INTEGER CHECK (perceived_exertion BETWEEN 1 AND 10), -- RPE scale 1-10
    feedback_notes TEXT,
    weight_entry DECIMAL(5,2), -- Optional daily weight check-in
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for progress
ALTER TABLE public.tai_chi_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own progress" 
ON public.tai_chi_progress FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress" 
ON public.tai_chi_progress FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress" 
ON public.tai_chi_progress FOR UPDATE 
USING (auth.uid() = user_id);

-- 4. Tai Chi Visuals Cache
CREATE TABLE IF NOT EXISTS public.tai_chi_visuals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    exercise_name TEXT NOT NULL UNIQUE,
    video_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.tai_chi_visuals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated read access for tai chi visuals" ON public.tai_chi_visuals FOR SELECT USING (auth.role() = 'authenticated');

-- 5. Storage Buckets Migration (Manual Reminder)
-- Make sure to create the 'tai_chi_videos' bucket in Supabase Dashboard 
-- and make it Public so the frontend can read the videos!
