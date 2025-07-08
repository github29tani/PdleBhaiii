-- Create earnings_history table for tracking all earnings
CREATE TABLE IF NOT EXISTS public.earnings_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('ad_revenue', 'support_tip', 'note_sale')),
    note_id UUID REFERENCES public.notes(id),
    from_user_id UUID REFERENCES auth.users(id), -- For support tips
    description TEXT,
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT positive_amount CHECK (amount > 0)
);

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS earnings_history_user_id_idx ON public.earnings_history(user_id);
CREATE INDEX IF NOT EXISTS earnings_history_type_idx ON public.earnings_history(type);
CREATE INDEX IF NOT EXISTS earnings_history_created_at_idx ON public.earnings_history(created_at);

-- Enable RLS
ALTER TABLE public.earnings_history ENABLE ROW LEVEL SECURITY;

-- Policy for viewing earnings history
CREATE POLICY "Users can view their own earnings history"
ON public.earnings_history
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Function to record earnings and update profile
CREATE OR REPLACE FUNCTION public.record_earning(
    p_user_id UUID,
    p_amount DECIMAL,
    p_type TEXT,
    p_note_id UUID DEFAULT NULL,
    p_from_user_id UUID DEFAULT NULL,
    p_description TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_earning_id UUID;
BEGIN
    -- Insert into earnings history
    INSERT INTO public.earnings_history (
        user_id,
        amount,
        type,
        note_id,
        from_user_id,
        description
    ) VALUES (
        p_user_id,
        p_amount,
        p_type,
        p_note_id,
        p_from_user_id,
        p_description
    )
    RETURNING id INTO v_earning_id;

    -- Update total earnings in profile
    UPDATE public.profiles
    SET 
        total_earnings = COALESCE(total_earnings, 0) + p_amount,
        updated_at = NOW(),
        support_count = CASE 
            WHEN p_type = 'support_tip' THEN COALESCE(support_count, 0) + 1
            ELSE COALESCE(support_count, 0)
        END
    WHERE id = p_user_id;

    RETURN v_earning_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get earnings summary
CREATE OR REPLACE FUNCTION public.get_earnings_summary(
    p_user_id UUID,
    p_start_date TIMESTAMPTZ DEFAULT NULL,
    p_end_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
    total_amount DECIMAL(10,2),
    earnings_by_type JSONB,
    transaction_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    WITH earnings_data AS (
        SELECT 
            SUM(amount) as total,
            COUNT(*) as count,
            jsonb_object_agg(
                type,
                (SELECT SUM(e2.amount)
                FROM public.earnings_history e2
                WHERE e2.type = e1.type
                AND e2.user_id = p_user_id
                AND (p_start_date IS NULL OR e2.created_at >= p_start_date)
                AND (p_end_date IS NULL OR e2.created_at <= p_end_date))
            ) as type_summary
        FROM public.earnings_history e1
        WHERE user_id = p_user_id
        AND (p_start_date IS NULL OR created_at >= p_start_date)
        AND (p_end_date IS NULL OR created_at <= p_end_date)
    )
    SELECT 
        COALESCE(total, 0),
        COALESCE(type_summary, '{}'::jsonb),
        COALESCE(count, 0)
    FROM earnings_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
