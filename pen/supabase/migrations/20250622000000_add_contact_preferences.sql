-- Create enum type for contact methods
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'contact_method') THEN
    CREATE TYPE contact_method AS ENUM ('chat', 'whatsapp', 'call');
  END IF;
END
$$;

-- Add contact preference columns to book_listings
ALTER TABLE public.book_listings 
ADD COLUMN IF NOT EXISTS contact_methods contact_method[] DEFAULT '{chat}'::contact_method[],
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;

-- Add comments for new columns
COMMENT ON COLUMN public.book_listings.contact_methods IS 'Array of preferred contact methods';
COMMENT ON COLUMN public.book_listings.phone_number IS 'Optional phone number for contact';
COMMENT ON COLUMN public.book_listings.whatsapp_number IS 'Optional WhatsApp number (can be different from phone)';

-- Update RLS policies if needed (no changes to existing policies)
-- The existing policies will automatically apply to the new columns

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_book_listings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_trigger 
    WHERE tgname = 'update_book_listings_updated_at'
  ) THEN
    CREATE TRIGGER update_book_listings_updated_at
    BEFORE UPDATE ON public.book_listings
    FOR EACH ROW
    EXECUTE FUNCTION update_book_listings_updated_at();
  END IF;
END
$$;
