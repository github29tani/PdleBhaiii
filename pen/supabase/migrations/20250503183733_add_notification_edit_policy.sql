-- Add columns for edit policy
ALTER TABLE notifications
ADD COLUMN editable boolean DEFAULT true,
ADD COLUMN edit_expires_at timestamp with time zone,
ADD COLUMN deleted_at timestamp with time zone;

-- Function to automatically set edit_expires_at
CREATE OR REPLACE FUNCTION set_notification_edit_expiry()
RETURNS TRIGGER AS $$
BEGIN
  -- Set edit expiry to 24 hours after sending
  NEW.edit_expires_at = NEW.sent_at + interval '24 hours';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to set edit expiry on notification creation
CREATE TRIGGER set_notification_edit_expiry_trigger
  BEFORE INSERT ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION set_notification_edit_expiry();

-- Function to check if notification is still editable
CREATE OR REPLACE FUNCTION is_notification_editable(notification_id uuid)
RETURNS boolean AS $$
DECLARE
  notification_record notifications;
BEGIN
  SELECT * INTO notification_record
  FROM notifications
  WHERE id = notification_id;

  RETURN (
    notification_record.editable = true AND
    notification_record.edit_expires_at > NOW() AND
    notification_record.deleted_at IS NULL
  );
END;
$$ LANGUAGE plpgsql;
