import type { EdgeNode, LiveTelemetry, Incident, Approval } from '@/types';
import { KPIDashboard } from '@/components/ops-console/KPIDashboard';
import { NodeGrid } from '@/components/ops-console/NodeGrid';
import { IncidentPanel } from '@/components/ops-console/IncidentPanel';
import { Activity, Boxes } from 'lucide-react';

interface OverviewPageProps {
  nodes: EdgeNode[];
  telemetry: LiveTelemetry[];
  incidents: Incident[];
  approvals: Approval[];
  onNodeSelect: (nodeId: string) => void;
  onIncidentSelect: (incident: Incident) => void;
}

export function OverviewPage({ nodes, telemetry, incidents, approvals, onNodeSelect, onIncidentSelect }: OverviewPageProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
          <Activity className="w-5 h-5 text-cyan-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-atlas-text">System Overview</h1>
          <p className="text-sm text-atlas-text-secondary">Real-time infrastructure health, KPIs, and active incidents</p>
        </div>
      </div>

      <KPIDashboard incidents={incidents} nodes={nodes} approvals={approvals} telemetry={telemetry} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Boxes className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-semibold text-atlas-text">Edge Node Grid</h2>
          </div>
          <NodeGrid nodes={nodes} telemetry={telemetry} onSelect={onNodeSelect} />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-semibold text-atlas-text">Recent Incidents</h2>
          </div>
          <IncidentPanel incidents={incidents.slice(0, 10)} nodes={nodes} onSelect={onIncidentSelect} />
        </div>
      </div>
    </div>
  );
}
