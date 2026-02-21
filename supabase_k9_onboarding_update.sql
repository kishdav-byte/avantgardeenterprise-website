-- Update k9_dogs table with new onboarding fields
ALTER TABLE public.k9_dogs 
ADD COLUMN IF NOT EXISTS birth_date DATE,
ADD COLUMN IF NOT EXISTS training_minutes_per_day INTEGER,
ADD COLUMN IF NOT EXISTS training_days_per_week INTEGER,
ADD COLUMN IF NOT EXISTS current_concerns TEXT,
ADD COLUMN IF NOT EXISTS current_skill_level TEXT,
ADD COLUMN IF NOT EXISTS color TEXT,
ADD COLUMN IF NOT EXISTS akc_registration TEXT;

-- Goal table is already perfectly suited for the desired outcome, but we can make sure it can handle the assessment data if needed.
