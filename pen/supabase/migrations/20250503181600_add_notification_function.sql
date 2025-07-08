-- Create a function to handle notification creation with proper permissions
CREATE OR REPLACE FUNCTION public.admin_create_notification(
  p_title TEXT,
  p_message TEXT,
  p_user_id UUID
) RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  -- Insert the notification
  INSERT INTO public.notifications (title, message, sender_id, created_at)
  VALUES (p_title, p_message, NULL, NOW())
  RETURNING id INTO v_notification_id;

  -- Create the notification recipient
  INSERT INTO public.notification_recipients (notification_id, user_id)
  VALUES (v_notification_id, p_user_id);

  RETURN jsonb_build_object(
    'notification_id', v_notification_id,
    'user_id', p_user_id
  );
END;
$$;
