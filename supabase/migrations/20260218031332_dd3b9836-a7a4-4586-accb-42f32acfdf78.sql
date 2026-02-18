
-- Add UPDATE policy for ad_platform_connections
CREATE POLICY "Users can update own data"
ON public.ad_platform_connections
FOR UPDATE
USING (auth.uid() = user_id);

-- Add DELETE policy for ad_platform_connections
CREATE POLICY "Users can delete own data"
ON public.ad_platform_connections
FOR DELETE
USING (auth.uid() = user_id);
