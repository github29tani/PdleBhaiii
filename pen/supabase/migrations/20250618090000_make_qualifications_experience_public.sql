-- Allow any authenticated user to read qualifications & experience of other users
-- This keeps INSERT/UPDATE/DELETE restricted to the owner, but adds a new
-- SELECT policy whose USING expression is `true`, effectively making the
-- rows publicly readable while still respecting RLS for write operations.

-- Qualifications -------------------------------------------------------------
ALTER TABLE public.user_qualifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read qualifications" ON public.user_qualifications;
CREATE POLICY "Public read qualifications"
    ON public.user_qualifications
    FOR SELECT
    USING (true);

-- Experience -----------------------------------------------------------------
ALTER TABLE public.user_experience ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read experience" ON public.user_experience;
CREATE POLICY "Public read experience"
    ON public.user_experience
    FOR SELECT
    USING (true);
