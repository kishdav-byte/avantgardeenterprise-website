-- ==============================================================================
-- SpaceIQ: Guest Micro-Audit & Admin Override Schema Migration
-- Run this in your Supabase SQL Editor to enable frictionless guest audits
-- ==============================================================================

-- 1. Allow user_id to be NULL for anonymous / guest micro-audits
ALTER TABLE public.space_audits 
    ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.space_audit_results 
    ALTER COLUMN user_id DROP NOT NULL;

-- 2. Add guest tracking and micro-audit classification columns to space_audits
ALTER TABLE public.space_audits 
    ADD COLUMN IF NOT EXISTS guest_fingerprint text,
    ADD COLUMN IF NOT EXISTS is_micro_audit boolean DEFAULT false;

-- 3. Create tracking table for guest IP and browser fingerprint usage
CREATE TABLE IF NOT EXISTS public.space_planner_guest_usage (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    fingerprint text NOT NULL,
    ip_hash text NOT NULL,
    audit_id uuid REFERENCES public.space_audits(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Unique index to prevent duplicate guest redemptions
CREATE INDEX IF NOT EXISTS idx_space_planner_guest_fingerprint 
    ON public.space_planner_guest_usage(fingerprint);

CREATE INDEX IF NOT EXISTS idx_space_planner_guest_ip 
    ON public.space_planner_guest_usage(ip_hash);

-- 4. Update Row-Level Security (RLS) for Guest Micro-Audits
ALTER TABLE public.space_planner_guest_usage ENABLE ROW LEVEL SECURITY;

-- Grants for authenticated and anonymous users
GRANT ALL ON TABLE public.space_planner_guest_usage TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE ON TABLE public.space_audits TO anon;
GRANT SELECT, INSERT ON TABLE public.space_audit_results TO anon;

-- Policy for guest usage tracking
DROP POLICY IF EXISTS "Allow anon read guest usage" ON public.space_planner_guest_usage;
CREATE POLICY "Allow anon read guest usage"
    ON public.space_planner_guest_usage FOR SELECT
    TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "Allow anon insert guest usage" ON public.space_planner_guest_usage;
CREATE POLICY "Allow anon insert guest usage"
    ON public.space_planner_guest_usage FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Policy to allow anonymous users to read guest audits
DROP POLICY IF EXISTS "Allow anon to read guest audits" ON public.space_audits;
CREATE POLICY "Allow anon to read guest audits"
    ON public.space_audits FOR SELECT
    TO anon
    USING (user_id IS NULL);

DROP POLICY IF EXISTS "Allow anon to insert guest audits" ON public.space_audits;
CREATE POLICY "Allow anon to insert guest audits"
    ON public.space_audits FOR INSERT
    TO anon
    WITH CHECK (user_id IS NULL);

-- Policy to allow anonymous users to read guest audit results
DROP POLICY IF EXISTS "Allow anon to read guest audit results" ON public.space_audit_results;
CREATE POLICY "Allow anon to read guest audit results"
    ON public.space_audit_results FOR SELECT
    TO anon
    USING (user_id IS NULL);

DROP POLICY IF EXISTS "Allow anon to insert guest audit results" ON public.space_audit_results;
CREATE POLICY "Allow anon to insert guest audit results"
    ON public.space_audit_results FOR INSERT
    TO anon
    WITH CHECK (user_id IS NULL);

-- 5. Storage policies for guest uploads in space-planner-media
DROP POLICY IF EXISTS "Allow anon uploads to space-planner-media" ON storage.objects;
CREATE POLICY "Allow anon uploads to space-planner-media"
    ON storage.objects FOR INSERT
    TO anon, authenticated
    WITH CHECK (bucket_id = 'space-planner-media');

DROP POLICY IF EXISTS "Allow public read of space-planner-media" ON storage.objects;
CREATE POLICY "Allow public read of space-planner-media"
    ON storage.objects FOR SELECT
    TO anon, authenticated
    USING (bucket_id = 'space-planner-media');
