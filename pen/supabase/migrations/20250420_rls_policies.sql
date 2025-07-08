-- Enable RLS for notes
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- Policy for viewing notes (public access)
CREATE POLICY "Anyone can view notes"
ON public.notes
FOR SELECT
USING (true);

-- Policy for creating notes
CREATE POLICY "Authenticated users can create notes"
ON public.notes
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = uploader_id);

-- Policy for updating notes
CREATE POLICY "Users can update own notes"
ON public.notes
FOR UPDATE
TO authenticated
USING (auth.uid() = uploader_id);

-- Enable RLS for earning transactions
ALTER TABLE earning_transactions ENABLE ROW LEVEL SECURITY;

-- Policy for inserting earning transactions
CREATE POLICY "Users can insert their own earning transactions"
ON earning_transactions
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
);

-- Policy for viewing earning transactions
CREATE POLICY "Users can view their own earning transactions"
ON earning_transactions
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
);

-- Policy for updating earning transactions
CREATE POLICY "Users can update their own earning transactions"
ON earning_transactions
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id
);

