-- Drop the existing restrictive policy on n8n_settings
DROP POLICY IF EXISTS "Allow all operations for service role" ON public.n8n_settings;

-- Create a new permissive policy for anon and authenticated users
CREATE POLICY "Public access for n8n_settings"
ON public.n8n_settings
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);
