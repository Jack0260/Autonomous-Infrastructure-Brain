import { useState } from 'react';
import type { EdgeNode, LiveTelemetry } from '@/types';
import { DigitalTwinScene } from '@/components/digital-twin/DigitalTwinScene';
import { NodeGrid } from '@/components/ops-console/NodeGrid';
import { Boxes } from 'lucide-react';

interface DigitalTwinPageProps {
  nodes: EdgeNode[];
  telemetry: LiveTelemetry[];
}

export function DigitalTwinPage({ nodes, telemetry }: DigitalTwinPageProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
          <Boxes className="w-5 h-5 text-cyan-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-atlas-text">Digital Twin</h1>
          <p className="text-sm text-atlas-text-secondary">3D real-time mirror of physical infrastructure</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 flex-1 min-h-0">
        <div className="lg:col-span-3 atlas-card overflow-hidden" style={{ minHeight: '500px' }}>
          <DigitalTwinScene
            nodes={nodes}
            telemetry={telemetry}
            onNodeClick={setSelectedNodeId}
            selectedNodeId={selectedNodeId}
          />
        </div>
        <div className="lg:col-span-1 overflow-y-auto scrollbar-thin">
          <h3 className="text-sm font-semibold text-atlas-text mb-3">Node Inspector</h3>
          <NodeGrid
            nodes={nodes}
            telemetry={telemetry}
            onSelect={setSelectedNodeId}
            selectedId={selectedNodeId}
          />
        </div>
      </div>
    </div>
  );
}
