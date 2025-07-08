-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON notification_recipients;
DROP POLICY IF EXISTS "Admins can view all notifications" ON notification_recipients;
DROP POLICY IF EXISTS "Admins can create notification recipients" ON notification_recipients;
DROP POLICY IF EXISTS "Users can update their own notification read status" ON notification_recipients;
DROP POLICY IF EXISTS "Users can view notifications" ON notifications;
DROP POLICY IF EXISTS "Admins can manage notifications" ON notifications;

-- Enable RLS on both tables
ALTER TABLE notification_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Notification Recipients Policies
CREATE POLICY "Users can view their own notifications"
ON notification_recipients
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all notifications"
ON notification_recipients
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can create notification recipients"
ON notification_recipients
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Users can update their own notification read status"
ON notification_recipients
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Notifications Table Policies
CREATE POLICY "Users can view notifications"
ON notifications
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM notification_recipients
    WHERE notification_recipients.notification_id = notifications.id
    AND notification_recipients.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage notifications"
ON notifications
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);
