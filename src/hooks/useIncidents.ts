import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { Incident } from '@/types';

export function useIncidents() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchIncidents = useCallback(async () => {
    const { data, error } = await supabase
      .from('incidents')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to load incidents:', error.message);
      return;
    }

    if (data) setIncidents(data as Incident[]);
  }, []);

  useEffect(() => {
    fetchIncidents().finally(() => setLoading(false));

    const channel = supabase
      .channel('incidents-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'incidents' },
        () => fetchIncidents()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchIncidents]);

  return { incidents, loading, refetch: fetchIncidents };
}
