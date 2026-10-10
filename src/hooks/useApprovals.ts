import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { Approval } from '@/types';

export function useApprovals() {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchApprovals = useCallback(async () => {
    const { data, error } = await supabase
      .from('approvals')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to load approvals:', error.message);
      return;
    }

    if (data) setApprovals(data as Approval[]);
  }, []);

  useEffect(() => {
    fetchApprovals().finally(() => setLoading(false));
    const channel = supabase
      .channel('approvals-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'approvals' },
        () => fetchApprovals()
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchApprovals]);

  const updateApproval = useCallback(
    async (id: string, status: Approval['status'], decidedBy: string) => {
      const { error } = await supabase
        .from('approvals')
        .update({ status, decided_by: decidedBy, decided_at: new Date().toISOString() })
        .eq('id', id);
      if (error) console.error('Failed to update approval:', error.message);
      else fetchApprovals();
    },
    [fetchApprovals]
  );

  return { approvals, loading, refetch: fetchApprovals, updateApproval };
}
