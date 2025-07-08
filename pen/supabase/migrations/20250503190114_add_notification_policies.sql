-- Add policies for editing and deleting notifications
CREATE POLICY "Admins can update notifications"
  ON notifications
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete notifications"
  ON notifications
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Also delete notification_recipients when notification is deleted
CREATE OR REPLACE FUNCTION handle_notification_delete()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM notification_recipients
  WHERE notification_id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_notification_delete
  BEFORE DELETE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION handle_notification_delete();
