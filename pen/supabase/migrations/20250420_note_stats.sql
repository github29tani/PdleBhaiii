-- Add views, ad_clicks, and earnings columns to notes table
ALTER TABLE public.notes
ADD COLUMN views integer DEFAULT 0,
ADD COLUMN ad_clicks integer DEFAULT 0,
ADD COLUMN earnings decimal(10,2) DEFAULT 0;

-- Add new columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS verification_reason TEXT,
ADD COLUMN IF NOT EXISTS total_earnings DECIMAL DEFAULT 0,
ADD COLUMN IF NOT EXISTS support_upi TEXT,
ADD COLUMN IF NOT EXISTS support_count INTEGER DEFAULT 0;

-- Add indexes
CREATE INDEX IF NOT EXISTS profiles_username_idx ON public.profiles(username);
CREATE INDEX IF NOT EXISTS profiles_is_verified_idx ON public.profiles(is_verified);

-- Create wishlists table for bookmarked notes
CREATE TABLE public.wishlists (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) NOT NULL,
    note_id uuid REFERENCES public.notes(id) NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, note_id)
);

-- Add indexes for better query performance
CREATE INDEX wishlists_user_id_idx ON public.wishlists(user_id);
CREATE INDEX wishlists_note_id_idx ON public.wishlists(note_id);
CREATE INDEX notes_uploader_id_idx ON public.notes(uploader_id);
