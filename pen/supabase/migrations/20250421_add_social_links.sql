-- Add social media links to profiles table
ALTER TABLE profiles
ADD COLUMN twitter_url text,
ADD COLUMN linkedin_url text,
ADD COLUMN instagram_url text,
ADD COLUMN github_url text,
ADD COLUMN website_url text;
