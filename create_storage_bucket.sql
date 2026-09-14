-- ==============================================================================
-- SpaceIQ: Supabase Storage Bucket Setup Script
-- Run this in your Supabase SQL Editor to create the 'space-planner-media' bucket
-- ==============================================================================

-- 1. Create the dedicated public bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'space-planner-media',
    'space-planner-media',
    true,
    12582912, -- 12MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 12582912,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

-- 2. Allow public / anonymous and authenticated users to upload
DROP POLICY IF EXISTS "Allow public uploads to space-planner-media" ON storage.objects;
CREATE POLICY "Allow public uploads to space-planner-media"
    ON storage.objects FOR INSERT
    TO anon, authenticated, service_role
    WITH CHECK (bucket_id = 'space-planner-media');

-- 3. Allow public / anonymous reading of photos
DROP POLICY IF EXISTS "Allow public read of space-planner-media" ON storage.objects;
CREATE POLICY "Allow public read of space-planner-media"
    ON storage.objects FOR SELECT
    TO anon, authenticated, service_role
    USING (bucket_id = 'space-planner-media');

-- 4. Allow service_role full management
DROP POLICY IF EXISTS "Allow service role all on space-planner-media" ON storage.objects;
CREATE POLICY "Allow service role all on space-planner-media"
    ON storage.objects FOR ALL
    TO service_role
    USING (bucket_id = 'space-planner-media');
