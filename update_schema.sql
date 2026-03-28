-- Run this directly in the Supabase SQL Editor to add the new column without deleting your data
ALTER TABLE public.tai_chi_profiles ADD COLUMN IF NOT EXISTS sessions_per_day INTEGER DEFAULT 1;
