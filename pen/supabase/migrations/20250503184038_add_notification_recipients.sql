-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Admins can view all notifications" ON notifications;
DROP POLICY IF EXISTS "Users can view their own notifications" ON notification_recipients;
DROP POLICY IF EXISTS "Admins can view all notifications" ON notification_recipients;

-- Drop existing objects if they exist
DROP TRIGGER IF EXISTS distribute_notification_trigger ON notifications;
DROP FUNCTION IF EXISTS distribute_notification() CASCADE;
DROP TABLE IF EXISTS notification_recipients CASCADE;

-- Create notification_recipients table
CREATE TABLE notification_recipients (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  notification_id uuid REFERENCES notifications(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(notification_id, user_id)
);

-- Function to distribute notifications to matching users
CREATE OR REPLACE FUNCTION distribute_notification()
RETURNS TRIGGER AS $$
DECLARE
  target_classes text[];
  target_subjects text[];
  target_boards text[];
  target_languages text[];
BEGIN
  -- Extract arrays from jsonb
  target_classes := ARRAY(SELECT jsonb_array_elements_text(NEW.target->'classes'))::text[];
  target_subjects := ARRAY(SELECT jsonb_array_elements_text(NEW.target->'subjects'))::text[];
  target_boards := ARRAY(SELECT jsonb_array_elements_text(NEW.target->'boards'))::text[];
  target_languages := ARRAY(SELECT jsonb_array_elements_text(NEW.target->'languages'))::text[];

  -- Insert into notification_recipients for matching users
  INSERT INTO notification_recipients (notification_id, user_id)
  SELECT 
    NEW.id,
    p.id
  FROM profiles p
  WHERE 
    -- If no classes selected OR user's class matches
    (NEW.target->>'classes' IS NULL OR 
     NEW.target->'classes' = '[]'::jsonb OR
     p.current_class = ANY(target_classes))
    AND
    -- If no subjects selected OR user's subjects match
    (NEW.target->>'subjects' IS NULL OR 
     NEW.target->'subjects' = '[]'::jsonb OR
     p.preferred_subjects && target_subjects)
    AND
    -- If no boards selected OR user's board matches
    (NEW.target->>'boards' IS NULL OR 
     NEW.target->'boards' = '[]'::jsonb OR
     p.board = ANY(target_boards))
    AND
    -- If no languages selected OR user's languages match
    (NEW.target->>'languages' IS NULL OR 
     NEW.target->'languages' = '[]'::jsonb OR
     p.preferred_languages && target_languages);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to distribute notifications on insert
CREATE TRIGGER distribute_notification_trigger
  AFTER INSERT ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION distribute_notification();

-- Add policies for notification_recipients
ALTER TABLE notification_recipients ENABLE ROW LEVEL SECURITY;

-- Policy for users to view their own notifications
CREATE POLICY "Users can view their own notifications"
  ON notification_recipients
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy for admins to view all notifications
CREATE POLICY "Admins can view all notifications"
  ON notification_recipients
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
    )
  );
