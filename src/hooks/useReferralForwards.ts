import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface ReferralForward {
  id: string;
  referral_id: string;
  from_hospital_id: string;
  to_hospital_id: string;
  forwarded_by: string;
  reason: string;
  created_at: string;
  fromHospitalName?: string;
  toHospitalName?: string;
  forwardedByName?: string;
}

export const useReferralForwards = (referralId?: string) => {
  const { currentUser } = useAuth();
  const [forwards, setForwards] = useState<ReferralForward[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchForwards = useCallback(async () => {
    if (!referralId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('referral_forwards')
        .select('*')
        .eq('referral_id', referralId)
        .order('created_at', { ascending: true });
      if (error) throw error;

      const hospitalIds = Array.from(
        new Set((data || []).flatMap(f => [f.from_hospital_id, f.to_hospital_id]))
      );
      const userIds = Array.from(new Set((data || []).map(f => f.forwarded_by)));

      const [{ data: hospitals }, { data: profiles }] = await Promise.all([
        hospitalIds.length
          ? supabase.from('hospitals').select('id, name').in('id', hospitalIds)
          : Promise.resolve({ data: [] as { id: string; name: string }[] }),
        userIds.length
          ? supabase.from('profiles').select('id, full_name').in('id', userIds)
          : Promise.resolve({ data: [] as { id: string; full_name: string }[] }),
      ]);

      const hMap = new Map((hospitals || []).map(h => [h.id, h.name]));
      const pMap = new Map((profiles || []).map(p => [p.id, p.full_name]));

      setForwards(
        (data || []).map(f => ({
          ...f,
          fromHospitalName: hMap.get(f.from_hospital_id) || 'Unknown',
          toHospitalName: hMap.get(f.to_hospital_id) || 'Unknown',
          forwardedByName: pMap.get(f.forwarded_by) || 'Unknown',
        }))
      );
    } catch (err) {
      console.error('Error loading forwards:', err);
    } finally {
      setLoading(false);
    }
  }, [referralId]);

  useEffect(() => {
    fetchForwards();
  }, [fetchForwards]);

  const forwardReferral = async (toHospitalId: string, reason: string) => {
    if (!referralId || !currentUser?.hospital_id) {
      toast.error('Missing hospital context');
      return false;
    }
    if (!reason.trim()) {
      toast.error('Please provide a reason for forwarding');
      return false;
    }
    setSubmitting(true);
    try {
      const { error: insertError } = await supabase.from('referral_forwards').insert({
        referral_id: referralId,
        from_hospital_id: currentUser.hospital_id,
        to_hospital_id: toHospitalId,
        forwarded_by: currentUser.id,
        reason,
      });
      if (insertError) throw insertError;

      // Update the referral itself: change current holder, bump counter, reset to pending
      const { data: current, error: fetchErr } = await supabase
        .from('referrals')
        .select('forward_count')
        .eq('id', referralId)
        .single();
      if (fetchErr) throw fetchErr;

      const { error: updateError } = await supabase
        .from('referrals')
        .update({
          to_hospital_id: toHospitalId,
          status: 'pending',
          assigned_doctor_id: null,
          forward_count: (current?.forward_count || 0) + 1,
        })
        .eq('id', referralId);
      if (updateError) throw updateError;

      await supabase.from('referral_activity_logs').insert({
        referral_id: referralId,
        action: 'Referral forwarded',
        performed_by: currentUser.id,
        details: reason,
      });

      toast.success('Referral forwarded successfully');
      await fetchForwards();
      return true;
    } catch (err: any) {
      console.error('Forward error:', err);
      toast.error(err?.message || 'Failed to forward referral');
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  return { forwards, loading, submitting, forwardReferral, refetch: fetchForwards };
};
