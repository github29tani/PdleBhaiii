-- Drop existing policy
DROP POLICY IF EXISTS "Users can create reports" ON reports;

-- Create updated policy
CREATE POLICY "Users can create reports"
  ON reports
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND -- Ensure the user_id matches the authenticated user
    user_id != reported_id AND -- Prevent self-reporting
    EXISTS ( -- Ensure reported_id exists
      SELECT 1 FROM profiles 
      WHERE id = reported_id
    )
  );

-- Allow users to view their own reports
CREATE POLICY "Users can view their own reports"
  ON reports
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
