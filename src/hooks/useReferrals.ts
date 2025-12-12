import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Referral, ActivityLog } from '@/types/referral';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type ReferralRow = Database['public']['Tables']['referrals']['Row'];
type ActivityLogRow = Database['public']['Tables']['referral_activity_logs']['Row'];

// Transform database row to Referral type
const transformReferral = (
  row: ReferralRow & {
    from_hospital?: { name: string } | null;
    to_hospital?: { name: string } | null;
    creator?: { full_name: string } | null;
    assigned_doctor?: { full_name: string } | null;
  },
  activityLogs: ActivityLogRow[] = []
): Referral => {
  return {
    id: row.id,
    patientCode: row.patient_code || undefined,
    patient: {
      id: row.patient_medical_id || '',
      name: row.patient_name,
      age: row.patient_age,
      contact: row.patient_contact || '',
      medicalId: row.patient_medical_id || '',
    },
    medicalSummary: row.medical_summary,
    reasonForReferral: row.reason,
    urgency: row.urgency,
    status: row.status,
    fromHospitalId: row.from_hospital_id,
    fromHospitalName: row.from_hospital?.name || 'Unknown Hospital',
    fromDoctorId: row.created_by,
    fromDoctorName: row.creator?.full_name || 'Unknown Doctor',
    toHospitalId: row.to_hospital_id,
    toHospitalName: row.to_hospital?.name || 'Unknown Hospital',
    assignedDoctorId: row.assigned_doctor_id || undefined,
    assignedDoctorName: row.assigned_doctor?.full_name || undefined,
    specialty: 'General', // Could be stored separately
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    completedAt: row.status === 'completed' ? new Date(row.updated_at) : undefined,
    rejectionReason: row.rejection_reason || undefined,
    activityLog: activityLogs.map(log => ({
      id: log.id,
      referralId: log.referral_id,
      timestamp: new Date(log.created_at),
      action: log.action,
      performedBy: log.performed_by || 'System',
      details: log.details || undefined,
    })),
  };
};

export const useReferrals = () => {
  const { currentUser } = useAuth();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReferrals = async () => {
    if (!currentUser) {
      setReferrals([]);
      setLoading(false);
      return;
    }

    try {
      // Fetch referrals
      const { data: referralsData, error: referralsError } = await supabase
        .from('referrals')
        .select('*')
        .order('created_at', { ascending: false });

      if (referralsError) throw referralsError;

      if (!referralsData || referralsData.length === 0) {
        setReferrals([]);
        setLoading(false);
        return;
      }

      // Fetch hospitals for names
      const hospitalIds = [...new Set([
        ...referralsData.map(r => r.from_hospital_id),
        ...referralsData.map(r => r.to_hospital_id)
      ])];
      
      const { data: hospitalsData } = await supabase
        .from('hospitals')
        .select('id, name')
        .in('id', hospitalIds);

      const hospitalMap = new Map(hospitalsData?.map(h => [h.id, h.name]) || []);

      // Fetch profiles for doctor names
      const doctorIds = [...new Set([
        ...referralsData.map(r => r.created_by),
        ...referralsData.filter(r => r.assigned_doctor_id).map(r => r.assigned_doctor_id!)
      ])];

      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', doctorIds);

      const profileMap = new Map(profilesData?.map(p => [p.id, p.full_name]) || []);

      // Fetch activity logs for all referrals
      const referralIds = referralsData.map(r => r.id);
      const { data: logsData } = await supabase
        .from('referral_activity_logs')
        .select('*')
        .in('referral_id', referralIds)
        .order('created_at', { ascending: true });

      // Get performer names for logs
      const logPerformerIds = [...new Set(logsData?.filter(l => l.performed_by).map(l => l.performed_by!) || [])];
      const { data: logProfilesData } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', logPerformerIds);

      const logProfileMap = new Map(logProfilesData?.map(p => [p.id, p.full_name]) || []);

      const logsMap = new Map<string, ActivityLog[]>();
      logsData?.forEach(log => {
        const logs = logsMap.get(log.referral_id) || [];
        logs.push({
          id: log.id,
          referralId: log.referral_id,
          timestamp: new Date(log.created_at),
          action: log.action,
          performedBy: log.performed_by ? (logProfileMap.get(log.performed_by) || 'Unknown') : 'System',
          details: log.details || undefined,
        });
        logsMap.set(log.referral_id, logs);
      });

      // Transform referrals
      const transformedReferrals: Referral[] = referralsData.map(row => ({
        id: row.id,
        patientCode: row.patient_code || undefined,
        patient: {
          id: row.patient_medical_id || '',
          name: row.patient_name,
          age: row.patient_age,
          contact: row.patient_contact || '',
          medicalId: row.patient_medical_id || '',
        },
        medicalSummary: row.medical_summary,
        reasonForReferral: row.reason,
        urgency: row.urgency,
        status: row.status,
        fromHospitalId: row.from_hospital_id,
        fromHospitalName: hospitalMap.get(row.from_hospital_id) || 'Unknown Hospital',
        fromDoctorId: row.created_by,
        fromDoctorName: profileMap.get(row.created_by) || 'Unknown Doctor',
        toHospitalId: row.to_hospital_id,
        toHospitalName: hospitalMap.get(row.to_hospital_id) || 'Unknown Hospital',
        assignedDoctorId: row.assigned_doctor_id || undefined,
        assignedDoctorName: row.assigned_doctor_id ? profileMap.get(row.assigned_doctor_id) : undefined,
        specialty: 'General',
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
        completedAt: row.status === 'completed' ? new Date(row.updated_at) : undefined,
        rejectionReason: row.rejection_reason || undefined,
        activityLog: logsMap.get(row.id) || [],
      }));

      setReferrals(transformedReferrals);
    } catch (error) {
      console.error('Error fetching referrals:', error);
      toast.error('Failed to load referrals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReferrals();
  }, [currentUser]);

  // Real-time subscription
  useEffect(() => {
    if (!currentUser) return;

    const channel = supabase
      .channel('referrals-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'referrals' },
        () => {
          fetchReferrals();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser]);

  const addReferral = async (referralData: {
    patientName: string;
    patientAge: number;
    patientContact: string;
    patientMedicalId: string;
    medicalSummary: string;
    reason: string;
    toHospitalId: string;
    urgency: 'emergency' | 'urgent' | 'routine';
  }) => {
    if (!currentUser?.hospital_id) {
      toast.error('You must be assigned to a hospital to create referrals');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('referrals')
        .insert({
          patient_name: referralData.patientName,
          patient_age: referralData.patientAge,
          patient_contact: referralData.patientContact,
          patient_medical_id: referralData.patientMedicalId,
          medical_summary: referralData.medicalSummary,
          reason: referralData.reason,
          from_hospital_id: currentUser.hospital_id,
          to_hospital_id: referralData.toHospitalId,
          created_by: currentUser.id,
          urgency: referralData.urgency,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      // Add activity log
      await supabase.from('referral_activity_logs').insert({
        referral_id: data.id,
        action: 'Referral Created',
        performed_by: currentUser.id,
      });

      toast.success('Referral created successfully!');
      await fetchReferrals();
      return data;
    } catch (error) {
      console.error('Error creating referral:', error);
      toast.error('Failed to create referral');
      return null;
    }
  };

  const updateReferralStatus = async (
    id: string,
    status: 'pending' | 'accepted' | 'in_treatment' | 'completed' | 'rejected' | 'more_info_requested',
    details?: string
  ) => {
    if (!currentUser) return false;

    try {
      const updateData: Record<string, unknown> = { status };
      if (status === 'rejected' && details) {
        updateData.rejection_reason = details;
      }
      if (status === 'completed') {
        // Generate patient code using database function
        const { data: codeData } = await supabase.rpc('generate_patient_code');
        updateData.patient_code = codeData;
      }
      if (status === 'accepted' || status === 'in_treatment') {
        updateData.assigned_doctor_id = currentUser.id;
      }

      const { error } = await supabase
        .from('referrals')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      // Add activity log
      await supabase.from('referral_activity_logs').insert({
        referral_id: id,
        action: `Status changed to ${status.replace('_', ' ')}`,
        performed_by: currentUser.id,
        details,
      });

      toast.success('Referral updated successfully');
      await fetchReferrals();
      return true;
    } catch (error) {
      console.error('Error updating referral:', error);
      toast.error('Failed to update referral');
      return false;
    }
  };

  const getReferralById = (id: string) => {
    return referrals.find(r => r.id === id);
  };

  const getReferralByCode = (code: string) => {
    return referrals.find(r => r.patientCode?.toLowerCase() === code.toLowerCase());
  };

  return {
    referrals,
    loading,
    addReferral,
    updateReferralStatus,
    getReferralById,
    getReferralByCode,
    refetch: fetchReferrals,
  };
};
