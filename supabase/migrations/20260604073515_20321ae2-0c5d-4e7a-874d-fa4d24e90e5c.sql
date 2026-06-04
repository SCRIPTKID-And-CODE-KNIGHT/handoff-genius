
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS forward_count integer NOT NULL DEFAULT 0;

CREATE TABLE public.referral_forwards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_id uuid NOT NULL REFERENCES public.referrals(id) ON DELETE CASCADE,
  from_hospital_id uuid NOT NULL REFERENCES public.hospitals(id),
  to_hospital_id uuid NOT NULL REFERENCES public.hospitals(id),
  forwarded_by uuid NOT NULL REFERENCES auth.users(id),
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_referral_forwards_referral ON public.referral_forwards(referral_id);
CREATE INDEX idx_referral_forwards_to ON public.referral_forwards(to_hospital_id);
CREATE INDEX idx_referral_forwards_from ON public.referral_forwards(from_hospital_id);

GRANT SELECT, INSERT ON public.referral_forwards TO authenticated;
GRANT ALL ON public.referral_forwards TO service_role;

ALTER TABLE public.referral_forwards ENABLE ROW LEVEL SECURITY;

-- Helper: is the user's hospital in the forwarding chain of this referral?
CREATE OR REPLACE FUNCTION public.user_hospital_in_referral_chain(_referral_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.referral_forwards f
    WHERE f.referral_id = _referral_id
      AND (f.from_hospital_id = public.get_user_hospital(_user_id)
           OR f.to_hospital_id = public.get_user_hospital(_user_id))
  )
$$;

-- Policies on referral_forwards
CREATE POLICY "View forwards in chain or admin"
ON public.referral_forwards FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR from_hospital_id = public.get_user_hospital(auth.uid())
  OR to_hospital_id = public.get_user_hospital(auth.uid())
);

CREATE POLICY "Current holder can forward"
ON public.referral_forwards FOR INSERT TO authenticated
WITH CHECK (
  forwarded_by = auth.uid()
  AND from_hospital_id = public.get_user_hospital(auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.referrals r
    WHERE r.id = referral_id
      AND r.to_hospital_id = public.get_user_hospital(auth.uid())
      AND r.status IN ('pending', 'accepted')
      AND r.forward_count < 3
  )
  AND to_hospital_id <> from_hospital_id
  AND NOT EXISTS (
    SELECT 1 FROM public.referral_forwards prev
    WHERE prev.referral_id = referral_id
      AND (prev.from_hospital_id = referral_forwards.to_hospital_id
           OR prev.to_hospital_id = referral_forwards.to_hospital_id)
  )
);

-- Extend referrals SELECT policy to include hospitals in the forwarding chain
DROP POLICY IF EXISTS "Doctors can view referrals from/to their hospital" ON public.referrals;
CREATE POLICY "Doctors can view referrals from/to their hospital or in chain"
ON public.referrals FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR from_hospital_id = public.get_user_hospital(auth.uid())
  OR to_hospital_id = public.get_user_hospital(auth.uid())
  OR public.user_hospital_in_referral_chain(id, auth.uid())
);
