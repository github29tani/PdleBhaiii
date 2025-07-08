-- Add columns to notes table for reviews
ALTER TABLE public.notes 
ADD COLUMN IF NOT EXISTS average_rating NUMERIC(3,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;

-- Drop the existing trigger and function to recreate them
DROP TRIGGER IF EXISTS update_note_rating_trigger ON public.reviews;
DROP FUNCTION IF EXISTS public.update_note_rating();

-- Recreate the function with correct column names
CREATE OR REPLACE FUNCTION public.update_note_rating()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the note's average rating when reviews are inserted, updated, or deleted
    UPDATE public.notes n
    SET 
        average_rating = COALESCE(r.average_rating, 0),
        review_count = COALESCE(r.total_reviews, 0)
    FROM 
        public.get_note_average_rating(COALESCE(NEW.note_id, OLD.note_id)) r
    WHERE 
        n.id = COALESCE(NEW.note_id, OLD.note_id);
        
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER update_note_rating_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_note_rating();

-- Update existing notes with review data if any
WITH review_stats AS (
    SELECT 
        note_id,
        ROUND(AVG(rating)::numeric, 2) as avg_rating,
        COUNT(*) as total_reviews
    FROM 
        public.reviews
    GROUP BY 
        note_id
)
UPDATE public.notes n
SET 
    average_rating = COALESCE(r.avg_rating, 0),
    review_count = COALESCE(r.total_reviews, 0)
FROM 
    review_stats r
WHERE 
    n.id = r.note_id;
