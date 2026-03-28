-- Migration: Upgrade Tai Chi Visuals from Images to Videos

-- 1. Create the caching table
CREATE TABLE IF NOT EXISTS public.tai_chi_visuals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    exercise_name TEXT NOT NULL UNIQUE,
    video_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Turn on RLS for the cache table
ALTER TABLE public.tai_chi_visuals ENABLE ROW LEVEL SECURITY;

-- Allow read access for authenticated users
CREATE POLICY "Allow authenticated read access for tai chi visuals" ON public.tai_chi_visuals FOR SELECT USING (auth.role() = 'authenticated');
-- Note: Insert is only done via the secure API route, so we don't need a public insert policy.

-- 2. Create the storage bucket for the videos (if it doesn't already exist)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('tai_chi_videos', 'tai_chi_videos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for tai_chi_videos bucket
-- Allow public access to read the videos
CREATE POLICY "Public video access" ON storage.objects FOR SELECT USING (bucket_id = 'tai_chi_videos');

-- Wait, normally inserts to storage need admin, but the API will use the service role or a signed URL.
-- To make this completely fail-safe without exposing the service key if we don't have to, we will assume 
-- the Supabase client created with the anon key from the API can insert if they are authenticated because of 
-- the API route handling it. Actually, for the API route to upload, we should enable authenticated uploads:
CREATE POLICY "Allow authenticated uploads" ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'tai_chi_videos' AND auth.role() = 'authenticated');
