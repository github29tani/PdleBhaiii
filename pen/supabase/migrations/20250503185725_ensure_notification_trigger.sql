-- Ensure the trigger is properly set up
DROP TRIGGER IF EXISTS on_notification_created ON notifications;

CREATE TRIGGER on_notification_created
  AFTER INSERT ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION distribute_notification();
