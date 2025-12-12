import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Doctor {
  id: string;
  email: string;
  full_name: string;
  specialty: string | null;
  hospital_id: string | null;
  hospital_name?: string;
  role: 'doctor' | 'admin';
}

export const useDoctors = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDoctors = async () => {
    try {
      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name');

      if (profilesError) throw profilesError;

      // Fetch user roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Fetch hospitals
      const hospitalIds = [...new Set(profiles?.filter(p => p.hospital_id).map(p => p.hospital_id!) || [])];
      const { data: hospitals } = await supabase
        .from('hospitals')
        .select('id, name')
        .in('id', hospitalIds);

      const hospitalMap = new Map(hospitals?.map(h => [h.id, h.name]) || []);
      const roleMap = new Map(roles?.map(r => [r.user_id, r.role]) || []);

      const doctorsList: Doctor[] = (profiles || []).map(profile => ({
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        specialty: profile.specialty,
        hospital_id: profile.hospital_id,
        hospital_name: profile.hospital_id ? hospitalMap.get(profile.hospital_id) : undefined,
        role: roleMap.get(profile.id) || 'doctor',
      }));

      setDoctors(doctorsList);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      toast.error('Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const addDoctor = async (doctorData: {
    email: string;
    password: string;
    fullName: string;
    specialty?: string;
    hospitalId: string;
    role: 'doctor' | 'admin';
  }) => {
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: doctorData.email,
        password: doctorData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: doctorData.fullName,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create user');

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: doctorData.email,
          full_name: doctorData.fullName,
          specialty: doctorData.specialty || null,
          hospital_id: doctorData.hospitalId,
        });

      if (profileError) throw profileError;

      // Assign role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: authData.user.id,
          role: doctorData.role,
        });

      if (roleError) throw roleError;

      toast.success('Doctor added successfully!');
      await fetchDoctors();
      return authData.user;
    } catch (error: any) {
      console.error('Error adding doctor:', error);
      toast.error(error.message || 'Failed to add doctor');
      return null;
    }
  };

  return {
    doctors,
    loading,
    addDoctor,
    refetch: fetchDoctors,
  };
};
