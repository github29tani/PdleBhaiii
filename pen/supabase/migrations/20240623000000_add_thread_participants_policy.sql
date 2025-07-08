-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can insert thread participants" ON public.thread_participants;

-- Add insert policy for thread_participants table
CREATE POLICY "Users can insert thread participants"
ON public.thread_participants
FOR INSERT
WITH CHECK (
  -- Allow insert if the user is either:
  -- 1. The authenticated user adding themselves
  -- 2. The owner of the book listing adding the buyer
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM public.book_listings bl
    JOIN public.message_threads mt ON mt.book_listing_id = bl.id
    WHERE mt.id = thread_participants.thread_id
    AND bl.seller_id = auth.uid()
  )
);