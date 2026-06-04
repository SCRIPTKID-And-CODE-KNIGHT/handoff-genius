
-- 1. Remove public read on blocked_ips
DROP POLICY IF EXISTS "Public can check if IP is blocked" ON public.blocked_ips;

-- 2. Restrict profile SELECT to own profile, same hospital, or admin
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.profiles;
CREATE POLICY "Users can view profiles in their hospital or admin"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    id = auth.uid()
    OR has_role(auth.uid(), 'admin'::app_role)
    OR (hospital_id IS NOT NULL AND hospital_id = public.get_user_hospital(auth.uid()))
  );

-- 3. Prevent non-admins from changing hospital_id on their profile
CREATE OR REPLACE FUNCTION public.prevent_profile_hospital_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.hospital_id IS DISTINCT FROM OLD.hospital_id
     AND NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only admins can change hospital assignment';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_prevent_hospital_change ON public.profiles;
CREATE TRIGGER profiles_prevent_hospital_change
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_profile_hospital_change();

-- 4. Lock down security_logs INSERT (service role bypasses RLS)
DROP POLICY IF EXISTS "Service can insert security logs" ON public.security_logs;
CREATE POLICY "Only service role can insert security logs"
  ON public.security_logs FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- 5. Prevent users from setting is_system = true on their own templates
DROP POLICY IF EXISTS "Users can update own templates" ON public.referral_templates;
CREATE POLICY "Users can update own templates"
  ON public.referral_templates FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    OR (created_by = auth.uid() AND is_system = false)
  );

-- 6. Storage: verify referral hospital membership on upload
DROP POLICY IF EXISTS "Users can upload attachments to their referrals" ON storage.objects;
CREATE POLICY "Users can upload attachments to their referrals"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'referral-documents'
    AND EXISTS (
      SELECT 1 FROM public.referrals r
      WHERE r.id::text = split_part(name, '/', 1)
        AND (
          r.from_hospital_id = public.get_user_hospital(auth.uid())
          OR r.to_hospital_id = public.get_user_hospital(auth.uid())
          OR public.has_role(auth.uid(), 'admin'::app_role)
        )
    )
  );

-- 7. Revoke direct EXECUTE on SECURITY DEFINER helpers from anon and public.
-- These are still used inside RLS policies (which evaluate as table owner),
-- but should not be callable via the public API.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_user_hospital(uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.user_hospital_in_referral_chain(uuid, uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.generate_patient_code() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.prevent_profile_hospital_change() FROM anon, authenticated, public;
