-- 031_officer_biodata.sql
-- Extending the profiles table with UPSC-specific fields for the "Officer Service Record"

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS target_year integer,
ADD COLUMN IF NOT EXISTS optional_subject text,
ADD COLUMN IF NOT EXISTS attempt_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS hometown_state text,
ADD COLUMN IF NOT EXISTS service_preference text,
ADD COLUMN IF NOT EXISTS officer_status text DEFAULT 'Aspirant';

-- Comment for clarity
COMMENT ON COLUMN public.profiles.officer_status IS 'User status: Aspirant, Candidate, Officer, etc.';
