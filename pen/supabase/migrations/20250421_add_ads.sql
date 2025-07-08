-- Drop everything in the correct order
DROP FUNCTION IF EXISTS get_relevant_ads(text, text, text, integer);
DROP TABLE IF EXISTS ad_impressions CASCADE;
DROP TABLE IF EXISTS ads CASCADE;

-- Create users table if it doesn't exist (for local development)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    name TEXT,
    role TEXT DEFAULT 'user'
);

-- Create notes table if it doesn't exist (for local development)
CREATE TABLE IF NOT EXISTS notes (
    id UUID PRIMARY KEY,
    title TEXT,
    subject TEXT,
    class TEXT
);

-- Create ads table
CREATE TABLE IF NOT EXISTS ads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    target_url TEXT,
    placement TEXT NOT NULL, -- 'banner', 'interstitial', 'native'
    status TEXT DEFAULT 'active', -- 'active', 'inactive', 'archived'
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    target_subjects TEXT[] DEFAULT '{}', -- Array of subjects to target
    target_classes TEXT[] DEFAULT '{}', -- Array of classes to target
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ad_impressions table
CREATE TABLE IF NOT EXISTS ad_impressions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ad_id UUID REFERENCES ads(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    note_id UUID REFERENCES notes(id) ON DELETE SET NULL,
    impression_type TEXT NOT NULL, -- 'view', 'click'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_impressions ENABLE ROW LEVEL SECURITY;

-- Policies for ads
DROP POLICY IF EXISTS "Allow public read access to active ads" ON ads;
CREATE POLICY "Allow public read access to active ads" ON ads
    FOR SELECT USING (status = 'active');

DROP POLICY IF EXISTS "Allow admin insert" ON ads;
CREATE POLICY "Allow admin insert" ON ads
    FOR INSERT WITH CHECK (EXISTS (
        SELECT 1 FROM users
        WHERE users.id = current_user::uuid
        AND users.role = 'admin'
    ));

DROP POLICY IF EXISTS "Allow admin update" ON ads;
CREATE POLICY "Allow admin update" ON ads
    FOR UPDATE USING (EXISTS (
        SELECT 1 FROM users
        WHERE users.id = current_user::uuid
        AND users.role = 'admin'
    ));

-- Policies for ad_impressions
DROP POLICY IF EXISTS "Allow all users to create impressions" ON ad_impressions;
CREATE POLICY "Allow all users to create impressions" ON ad_impressions
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow users to view their own impressions" ON ad_impressions;
CREATE POLICY "Allow users to view their own impressions" ON ad_impressions
    FOR SELECT USING (user_id = current_user::uuid);

DROP POLICY IF EXISTS "Allow admin view all impressions" ON ad_impressions;
CREATE POLICY "Allow admin view all impressions" ON ad_impressions
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM users
        WHERE users.id = current_user::uuid
        AND users.role = 'admin'
    ));

-- Functions
DROP FUNCTION IF EXISTS get_relevant_ads;
CREATE OR REPLACE FUNCTION get_relevant_ads(
    p_placement TEXT,
    p_subject TEXT DEFAULT NULL,
    p_class TEXT DEFAULT NULL,
    p_limit INTEGER DEFAULT 1
)
RETURNS SETOF ads
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH filtered_ads AS (
        SELECT a.*
        FROM ads a
        WHERE a.status = 'active'
        AND a.placement = p_placement
        AND (
            p_subject IS NULL
            OR a.target_subjects = '{}'
            OR p_subject = ANY(a.target_subjects)
        )
        AND (
            p_class IS NULL
            OR a.target_classes = '{}'
            OR p_class = ANY(a.target_classes)
        )
        AND (
            a.start_date IS NULL
            OR a.start_date <= CURRENT_TIMESTAMP
        )
        AND (
            a.end_date IS NULL
            OR a.end_date >= CURRENT_TIMESTAMP
        )
    )
    SELECT *
    FROM filtered_ads
    ORDER BY RANDOM()
    LIMIT p_limit;
END;
$$;
