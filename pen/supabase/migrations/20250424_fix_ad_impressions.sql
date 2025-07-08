-- Add ad_unit_id column to ad_impressions if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'ad_impressions' 
        AND column_name = 'ad_unit_id'
    ) THEN
        ALTER TABLE ad_impressions 
        ADD COLUMN ad_unit_id text NOT NULL DEFAULT 'default';
    END IF;
END $$;
