-- Add is_banned column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_banned boolean DEFAULT false;

-- Create user_reports table
CREATE TABLE IF NOT EXISTS user_reports (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    reporter_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    reported_user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    reason text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    resolved boolean DEFAULT false,
    resolved_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
    resolved_at timestamp with time zone
);

-- Enable RLS on user_reports
ALTER TABLE user_reports ENABLE ROW LEVEL SECURITY;

-- Create function to get user reports count
CREATE OR REPLACE FUNCTION get_user_reports_count()
RETURNS TABLE (reported_user_id uuid, count bigint)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT ur.reported_user_id, COUNT(*)::bigint
  FROM user_reports ur
  WHERE ur.resolved = false
  GROUP BY ur.reported_user_id;
END;
$$;
