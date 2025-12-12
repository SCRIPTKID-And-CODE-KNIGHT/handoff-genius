import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Hospital {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
}

export const useHospitals = () => {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHospitals = async () => {
    try {
      const { data, error } = await supabase
        .from('hospitals')
        .select('*')
        .order('name');

      if (error) throw error;
      setHospitals(data || []);
    } catch (error) {
      console.error('Error fetching hospitals:', error);
      toast.error('Failed to load hospitals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHospitals();
  }, []);

  const addHospital = async (hospitalData: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
  }) => {
    try {
      const { data, error } = await supabase
        .from('hospitals')
        .insert({
          name: hospitalData.name,
          address: hospitalData.address || null,
          phone: hospitalData.phone || null,
          email: hospitalData.email || null,
        })
        .select()
        .single();

      if (error) throw error;
      
      toast.success('Hospital added successfully!');
      await fetchHospitals();
      return data;
    } catch (error) {
      console.error('Error adding hospital:', error);
      toast.error('Failed to add hospital');
      return null;
    }
  };

  return {
    hospitals,
    loading,
    addHospital,
    refetch: fetchHospitals,
  };
};
