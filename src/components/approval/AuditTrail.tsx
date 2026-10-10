import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { AuditEntry } from '@/types';
import { ScrollText, Shield } from 'lucide-react';

export function AuditTrail() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEntries = async () => {
      const { data, error } = await supabase
        .from('audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Failed to load audit log:', error.message);
        return;
      }
      if (data) setEntries(data as AuditEntry[]);
    };
    fetchEntries().finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="atlas-card p-8 text-center text-sm text-atlas-text-secondary">Loading audit trail...</div>;
  }

  if (entries.length === 0) {
    return (
      <div className="atlas-card p-8 text-center">
        <ScrollText className="w-8 h-8 text-atlas-text-secondary mx-auto mb-3" />
        <p className="text-sm text-atlas-text-secondary">No audit entries yet</p>
      </div>
    );
  }

  return (
    <div className="atlas-card p-4">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-4 h-4 text-cyan-400" />
        <h3 className="text-sm font-semibold text-atlas-text">Immutable Audit Trail</h3>
      </div>
      <div className="space-y-2 max-h-[500px] overflow-y-auto scrollbar-thin">
        {entries.map((entry) => (
          <div key={entry.id} className="flex items-start gap-3 py-2 border-b border-atlas-border/30 last:border-0">
            <div className="w-2 h-2 rounded-full bg-cyan-500 mt-1.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-medium text-atlas-text capitalize">{entry.action}</span>
                <span className="text-xs text-atlas-text-secondary font-mono">{entry.entity_type}</span>
                <span className="text-xs text-atlas-text-secondary">by {entry.actor}</span>
              </div>
              {entry.metadata && Object.keys(entry.metadata).length > 0 && (
                <p className="text-xs text-atlas-text-secondary mt-0.5 font-mono truncate">
                  {JSON.stringify(entry.metadata)}
                </p>
              )}
              <p className="text-xs text-atlas-text-secondary mt-0.5">
                {new Date(entry.created_at).toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
