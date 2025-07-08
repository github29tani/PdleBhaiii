-- Add missing columns to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS class text,
ADD COLUMN IF NOT EXISTS board text,
ADD COLUMN IF NOT EXISTS languages text[] DEFAULT '{}';
