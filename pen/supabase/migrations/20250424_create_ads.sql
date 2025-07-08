-- Create ads table if it doesn't exist
CREATE TABLE IF NOT EXISTS ads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    target_url TEXT NOT NULL,
    placement TEXT NOT NULL CHECK (placement IN ('banner', 'interstitial')),
    subject TEXT,
    class TEXT,
    cpc DECIMAL(10,4),  -- Cost per click
    cpm DECIMAL(10,4),  -- Cost per thousand impressions
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create ad_impressions table if it doesn't exist
CREATE TABLE IF NOT EXISTS ad_impressions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ad_id UUID REFERENCES ads(id),
    user_id UUID REFERENCES auth.users(id),
    note_id UUID REFERENCES notes(id),
    impression_type TEXT CHECK (impression_type IN ('view', 'click')),
    revenue DECIMAL(10,4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS get_relevant_ads;

-- Function to get relevant ads
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
    SELECT *
    FROM ads
    WHERE status = 'active'
    AND placement = p_placement
    AND (
        p_subject IS NULL
        OR target_subjects = '{}'
        OR p_subject = ANY(target_subjects)
    )
    AND (
        p_class IS NULL
        OR target_classes = '{}'
        OR p_class = ANY(target_classes)
    )
    AND (
        start_date IS NULL
        OR start_date <= CURRENT_TIMESTAMP
    )
    AND (
        end_date IS NULL
        OR end_date >= CURRENT_TIMESTAMP
    )
    ORDER BY RANDOM()
    LIMIT p_limit;
END;
$$;

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS record_ad_impression;

-- Function to record ad impressions
CREATE OR REPLACE FUNCTION record_ad_impression(
    p_ad_id UUID,
    p_impression_type TEXT,
    p_note_id UUID DEFAULT NULL,
    p_revenue DECIMAL DEFAULT 0
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
BEGIN
    v_user_id := auth.uid();
    
    INSERT INTO ad_impressions (
        ad_id,
        user_id,
        note_id,
        impression_type,
        revenue
    ) VALUES (
        p_ad_id,
        v_user_id,
        p_note_id,
        p_impression_type,
        p_revenue
    );
END;
$$;

-- Insert test ads if they don't exist
INSERT INTO ads (title, description, target_url, placement, target_subjects, target_classes, status) VALUES
('Premium Study Materials', 'Access high-quality study materials for all subjects', 'https://example.com/study-materials', 'banner', '{}', '{}', 'active'),
('Online Tutoring', 'Get help from expert tutors 24/7', 'https://example.com/tutoring', 'banner', '{}', '{}', 'active'),
('Math Practice Tests', 'Comprehensive math practice tests', 'https://example.com/math-tests', 'interstitial', '{Mathematics}', '{}', 'active');

-- Create RLS policies
-- Enable RLS if not already enabled
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'ads' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE ads ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'ad_impressions' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE ad_impressions ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

DROP POLICY IF EXISTS "Allow read access to active ads" ON ads;
CREATE POLICY "Allow read access to active ads" ON ads
    FOR SELECT TO authenticated
    USING (status = 'active');

DROP POLICY IF EXISTS "Allow insert on ad_impressions" ON ad_impressions;
CREATE POLICY "Allow insert on ad_impressions" ON ad_impressions
    FOR INSERT TO authenticated
    WITH CHECK (true);
