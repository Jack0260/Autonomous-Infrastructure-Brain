import { AuditTrail } from '@/components/approval/AuditTrail';
import { ScrollText } from 'lucide-react';

export function AuditPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
          <ScrollText className="w-5 h-5 text-cyan-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-atlas-text">Audit Trail</h1>
          <p className="text-sm text-atlas-text-secondary">Immutable, append-only record of all system actions</p>
        </div>
      </div>

      <div className="max-w-3xl">
        <AuditTrail />
      </div>
    </div>
  );
}
