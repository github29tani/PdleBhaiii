-- Rename avatar column to avatar_url
ALTER TABLE public.profiles
RENAME COLUMN avatar TO avatar_url;
