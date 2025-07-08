-- Create a function to increment note stats atomically
-- Make sure total_earnings column exists in profiles
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'profiles' 
                   AND column_name = 'total_earnings') THEN
        ALTER TABLE public.profiles ADD COLUMN total_earnings DECIMAL(10,2) DEFAULT 0;
    END IF;
END $$;

CREATE OR REPLACE FUNCTION public.increment_note_stats(
    note_id UUID,
    download_increment INTEGER DEFAULT 0,
    ad_click_increment INTEGER DEFAULT 0,
    earning_increment DECIMAL DEFAULT 0
)
RETURNS VOID AS $$
DECLARE
    note_uploader_id UUID;
BEGIN
    -- Get the uploader_id first
    SELECT uploader_id INTO note_uploader_id
    FROM public.notes
    WHERE id = note_id;

    -- Update the note stats
    UPDATE public.notes
    SET 
        downloads = downloads + download_increment,
        ad_clicks = ad_clicks + ad_click_increment,
        earnings = earnings + earning_increment,
        updated_at = NOW()
    WHERE id = note_id;
  
    -- Create an earning transaction record
    -- Use the auth.uid() as the user_id to comply with RLS
    INSERT INTO public.earning_transactions (
        user_id,
        amount,
        type,
        note_id,
        status
    )
    VALUES (
        auth.uid(), -- Current user who watched the ad
        earning_increment,
        'ad_view',
        note_id,
        'completed'
    );

    -- Update profiles total earnings
    UPDATE public.profiles
    SET total_earnings = COALESCE(total_earnings, 0) + earning_increment
    WHERE id = note_uploader_id;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER;
