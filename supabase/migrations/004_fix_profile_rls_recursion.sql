-- Fix infinite recursion in profiles RLS.
--
-- The original "admin read all profiles" policy queried public.profiles
-- inside its own USING clause. Any SELECT/UPDATE on the table re-entered
-- the policy evaluator and Postgres aborted with:
--   "infinite recursion detected in policy for relation profiles"
--
-- Fix: extract the admin check into a SECURITY DEFINER function so it runs
-- with the function owner's privileges and bypasses RLS on the read.

DROP POLICY IF EXISTS "admin read all profiles" ON public.profiles;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

CREATE POLICY "admin read all profiles"
  ON public.profiles
  FOR SELECT
  USING (public.is_admin());
