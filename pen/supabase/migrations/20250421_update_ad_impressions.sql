-- Drop the existing foreign key constraint
ALTER TABLE ad_impressions
DROP CONSTRAINT IF EXISTS ad_impressions_user_id_fkey;

-- Add the foreign key constraint back with ON DELETE SET NULL
ALTER TABLE ad_impressions
ADD CONSTRAINT ad_impressions_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE SET NULL;

-- Make user_id nullable
ALTER TABLE ad_impressions
ALTER COLUMN user_id DROP NOT NULL;
