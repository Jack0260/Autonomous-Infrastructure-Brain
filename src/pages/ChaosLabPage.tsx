import type { EdgeNode, LiveTelemetry } from '@/types';
import { FaultInjector } from '@/components/chaos-lab/FaultInjector';
import { DigitalTwinScene } from '@/components/digital-twin/DigitalTwinScene';
import { Zap } from 'lucide-react';

interface ChaosLabPageProps {
  nodes: EdgeNode[];
  telemetry: LiveTelemetry[];
}

export function ChaosLabPage({ nodes, telemetry }: ChaosLabPageProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
          <Zap className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-atlas-text">Chaos Lab</h1>
          <p className="text-sm text-atlas-text-secondary">Inject faults and observe blast radius in real-time</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <FaultInjector
          nodes={nodes}
          telemetry={telemetry}
          onInject={() => {}}
        />

        <div className="atlas-card overflow-hidden" style={{ minHeight: '500px' }}>
          <div className="p-3 border-b border-atlas-border/30">
            <h3 className="text-sm font-semibold text-atlas-text">Live Twin View</h3>
            <p className="text-xs text-atlas-text-secondary">Watch fault propagation across the infrastructure</p>
          </div>
          <div style={{ height: '460px' }}>
            <DigitalTwinScene nodes={nodes} telemetry={telemetry} />
          </div>
        </div>
      </div>
    </div>
  );
}
