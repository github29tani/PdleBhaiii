-- Remove array columns from profiles table
ALTER TABLE public.profiles
DROP COLUMN IF EXISTS qualifications,
DROP COLUMN IF EXISTS experience;
