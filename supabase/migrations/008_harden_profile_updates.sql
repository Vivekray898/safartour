-- Safar Tours CRM — prevent staff self-promotion through profile updates
--
-- The live Auth/RLS foundation currently allows a user to update their own
-- profile row. Its WITH CHECK clause also permits changing role or active,
-- which would let a staff member promote or reactivate themselves. This
-- migration preserves self-service name/phone edits while making role and
-- active changes admin-only.

CREATE OR REPLACE FUNCTION public.can_update_profile(
  target_id uuid,
  target_role text,
  target_active integer
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_admin()
    OR (
      target_id = auth.uid()
      AND target_role = (
        SELECT p.role FROM public.profiles p WHERE p.id = auth.uid()
      )
      AND target_active = (
        SELECT p.active FROM public.profiles p WHERE p.id = auth.uid()
      )
    );
$$;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles: update own, admin updates all" ON public.profiles;
CREATE POLICY "profiles: update own, admin updates all" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.is_admin())
  WITH CHECK (public.can_update_profile(id, role, active));
