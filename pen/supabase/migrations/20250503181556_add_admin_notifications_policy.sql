-- Add policy to allow admins to create notifications
CREATE POLICY "Allow admins to create notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

-- Add policy to allow admins to create notification recipients
CREATE POLICY "Allow admins to create notification recipients"
ON public.notification_recipients
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

-- Add policy to allow users to view their own notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.notification_recipients nr
    WHERE nr.notification_id = id
    AND nr.user_id = auth.uid()
  )
);

-- Add policy to allow users to view their own notification recipients
CREATE POLICY "Users can view their own notification recipients"
ON public.notification_recipients
FOR SELECT
TO authenticated
USING (user_id = auth.uid());
