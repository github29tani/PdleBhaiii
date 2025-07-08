-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  reported_id UUID NOT NULL REFERENCES profiles(id),
  type TEXT NOT NULL CHECK (type IN ('note', 'user', 'comment')),
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create withdrawals table
CREATE TABLE IF NOT EXISTS withdrawals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  payment_method TEXT NOT NULL,
  payment_details TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create function to get monthly user growth
CREATE OR REPLACE FUNCTION get_monthly_user_growth()
RETURNS TABLE (month DATE, count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    DATE_TRUNC('month', created_at)::DATE,
    COUNT(*)
  FROM profiles
  WHERE created_at >= NOW() - INTERVAL '6 months'
  GROUP BY DATE_TRUNC('month', created_at)
  ORDER BY DATE_TRUNC('month', created_at);
END;
$$ LANGUAGE plpgsql;

-- Create function to get monthly note uploads
CREATE OR REPLACE FUNCTION get_monthly_note_uploads()
RETURNS TABLE (month DATE, count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    DATE_TRUNC('month', created_at)::DATE,
    COUNT(*)
  FROM notes
  WHERE created_at >= NOW() - INTERVAL '6 months'
  GROUP BY DATE_TRUNC('month', created_at)
  ORDER BY DATE_TRUNC('month', created_at);
END;
$$ LANGUAGE plpgsql;

-- Create function to get monthly ad views
CREATE OR REPLACE FUNCTION get_monthly_ad_views()
RETURNS TABLE (month DATE, count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    DATE_TRUNC('month', created_at)::DATE,
    COUNT(*)
  FROM ad_views
  WHERE created_at >= NOW() - INTERVAL '6 months'
  GROUP BY DATE_TRUNC('month', created_at)
  ORDER BY DATE_TRUNC('month', created_at);
END;
$$ LANGUAGE plpgsql;

-- Create function to get monthly earnings
CREATE OR REPLACE FUNCTION get_monthly_earnings()
RETURNS TABLE (month DATE, total DECIMAL) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    DATE_TRUNC('month', created_at)::DATE,
    SUM(amount)
  FROM earnings
  WHERE created_at >= NOW() - INTERVAL '6 months'
  GROUP BY DATE_TRUNC('month', created_at)
  ORDER BY DATE_TRUNC('month', created_at);
END;
$$ LANGUAGE plpgsql;

-- Create function to get top subjects
CREATE OR REPLACE FUNCTION get_top_subjects()
RETURNS TABLE (subject TEXT, count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    subject,
    COUNT(*)
  FROM notes
  GROUP BY subject
  ORDER BY COUNT(*) DESC
  LIMIT 5;
END;
$$ LANGUAGE plpgsql;

-- Add RLS policies
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;

-- Users can create reports
CREATE POLICY "Users can create reports"
  ON reports
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- Admin can read all reports
CREATE POLICY "Admin can read reports"
  ON reports
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admin can update reports
CREATE POLICY "Admin can update reports"
  ON reports
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admin can read all withdrawals
CREATE POLICY "Admin can read withdrawals"
  ON withdrawals
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admin can update withdrawals
CREATE POLICY "Admin can update withdrawals"
  ON withdrawals
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Insert some sample data
INSERT INTO reports (user_id, reported_id, type, reason)
SELECT 
  (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1),
  (SELECT id FROM profiles WHERE role != 'admin' ORDER BY RANDOM() LIMIT 1),
  type,
  reason
FROM (
  VALUES 
    ('note', 'Inappropriate content'),
    ('user', 'Spam'),
    ('comment', 'Harassment'),
    ('note', 'Copyright violation'),
    ('user', 'Fake account')
) AS sample_reports(type, reason);

INSERT INTO withdrawals (user_id, amount, payment_method, payment_details)
SELECT 
  (SELECT id FROM profiles WHERE role != 'admin' ORDER BY RANDOM() LIMIT 1),
  amount,
  payment_method,
  payment_details
FROM (
  VALUES 
    (1000.00, 'UPI', 'upi@okaxis'),
    (500.00, 'Bank Transfer', 'AC: 1234567890, IFSC: SBIN0001234'),
    (2000.00, 'PayPal', 'user@example.com'),
    (1500.00, 'UPI', 'user@paytm'),
    (750.00, 'Bank Transfer', 'AC: 0987654321, IFSC: HDFC0004321')
) AS sample_withdrawals(amount, payment_method, payment_details);
