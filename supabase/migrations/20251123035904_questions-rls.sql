DROP POLICY IF EXISTS "Public can read questions" ON public.questions;

DROP POLICY IF EXISTS "Authenticated users can read questions" ON public.questions;

-- Policy using the logging function
CREATE POLICY "Authenticated users can read questions" ON public.questions FOR
SELECT
    TO authenticated USING (true);