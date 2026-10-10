import { useState } from 'react';
import type { EdgeNode, LiveTelemetry, Incident, Approval } from '@/types';
import { IncidentPanel } from '@/components/ops-console/IncidentPanel';
import { ApprovalQueue } from '@/components/approval/ApprovalQueue';
import { AuditTrail } from '@/components/approval/AuditTrail';
import { Activity } from 'lucide-react';

interface OpsConsolePageProps {
  nodes: EdgeNode[];
  telemetry: LiveTelemetry[];
  incidents: Incident[];
  approvals: Approval[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

export function OpsConsolePage({ nodes, incidents, approvals, onApprove, onReject }: OpsConsolePageProps) {
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
          <Activity className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-atlas-text">Operations Console</h1>
          <p className="text-sm text-atlas-text-secondary">Incidents, approval workflow, and audit trail</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div>
          <h2 className="text-sm font-semibold text-atlas-text mb-3">Incidents</h2>
          <IncidentPanel
            incidents={incidents}
            nodes={nodes}
            onSelect={setSelectedIncident}
            selectedId={selectedIncident?.id}
          />
        </div>

        <div>
          <h2 className="text-sm font-semibold text-atlas-text mb-3">Approval Workflow</h2>
          <ApprovalQueue
            approvals={approvals}
            incidents={incidents}
            nodes={nodes}
            onApprove={onApprove}
            onReject={onReject}
          />
        </div>

        <div>
          <h2 className="text-sm font-semibold text-atlas-text mb-3">Audit Trail</h2>
          <AuditTrail />
        </div>
      </div>
    </div>
  );
}
