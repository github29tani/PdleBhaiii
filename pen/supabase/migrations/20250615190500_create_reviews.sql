-- Create reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    note_id UUID NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    user_avatar TEXT,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    images TEXT[] DEFAULT '{}'::TEXT[],
    is_helpful BOOLEAN DEFAULT false,
    helpful_count INTEGER DEFAULT 0,
    reported BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_reviews_note_id ON public.reviews(note_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews(created_at);

-- Create function to update updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at on row update
CREATE TRIGGER update_reviews_updated_at
BEFORE UPDATE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create policy for public read access
CREATE POLICY "Enable read access for all users"
ON public.reviews
FOR SELECT
TO authenticated, anon
USING (true);

-- Create policy for authenticated users to insert their own reviews
CREATE POLICY "Enable insert for authenticated users"
ON public.reviews
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Create policy for users to update their own reviews
CREATE POLICY "Enable update for review owners"
ON public.reviews
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Create policy for users to delete their own reviews
CREATE POLICY "Enable delete for review owners"
ON public.reviews
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Create policy for admin to perform all actions
CREATE POLICY "Enable all for admin"
ON public.reviews
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Create function to get average rating for a note
CREATE OR REPLACE FUNCTION public.get_note_average_rating(note_id_param UUID)
RETURNS TABLE (
    average_rating NUMERIC(3,2),
    total_reviews BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ROUND(AVG(r.rating)::numeric, 2) as average_rating,
        COUNT(*) as total_reviews
    FROM 
        public.reviews r
    WHERE 
        r.note_id = note_id_param
    GROUP BY 
        r.note_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- Create function to update note's average rating
CREATE OR REPLACE FUNCTION public.update_note_rating()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the note's average rating when reviews are inserted, updated, or deleted
    UPDATE public.notes n
    SET 
        average_rating = r.average_rating,
        review_count = r.total_reviews
    FROM 
        public.get_note_average_rating(COALESCE(NEW.note_id, OLD.note_id)) r
    WHERE 
        n.id = COALESCE(NEW.note_id, OLD.note_id);
        
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update note ratings after review operations
CREATE TRIGGER update_note_rating_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_note_rating();

-- Create function to check if user has already reviewed a note
CREATE OR REPLACE FUNCTION public.has_user_reviewed(note_id_param UUID, user_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
    review_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 
        FROM public.reviews 
        WHERE note_id = note_id_param 
        AND user_id = user_id_param
    ) INTO review_exists;
    
    RETURN review_exists;
END;
$$ LANGUAGE plpgsql STABLE;
