import { useState } from 'react';
import type { Incident, EdgeNode } from '@/types';
import { CausalGraph } from '@/components/causal/CausalGraph';
import { NarrativeExplainer } from '@/components/causal/NarrativeExplainer';
import { IncidentPanel } from '@/components/ops-console/IncidentPanel';
import { buildCausalChain } from '@/lib/causal/causalChain';
import type { LiveTelemetry } from '@/types';
import { GitBranch, AlertCircle } from 'lucide-react';

interface CausalExplorerPageProps {
  incidents: Incident[];
  nodes: EdgeNode[];
  telemetry: LiveTelemetry[];
}

export function CausalExplorerPage({ incidents, nodes, telemetry }: CausalExplorerPageProps) {
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(incidents[0] || null);

  const causalResult = selectedIncident
    ? (() => {
        const node = selectedIncident.node_id ? nodes.find((n) => n.id === selectedIncident.node_id) : null;
        const reading = node ? telemetry.find((t) => t.nodeId === node.id) : null;
        const lastEvent = selectedIncident.causal_chain[selectedIncident.causal_chain.length - 1];

        if (reading && node) {
          const live = buildCausalChain(
            reading,
            'detected_anomaly',
            true,
            4,
            5,
            null,
            selectedIncident.action_taken
          );
          return {
            events: selectedIncident.causal_chain.length > 0 ? selectedIncident.causal_chain : live.events,
            narrative: selectedIncident.description || live.narrative,
            rootCause: live.rootCause,
            confidence: lastEvent?.confidence || live.confidence,
          };
        }

        return {
          events: selectedIncident.causal_chain,
          narrative: selectedIncident.description || 'No narrative available.',
          rootCause: 'See causal chain for details.',
          confidence: lastEvent?.confidence || 0.85,
        };
      })()
    : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
          <GitBranch className="w-5 h-5 text-cyan-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-atlas-text">Causal Explorer</h1>
          <p className="text-sm text-atlas-text-secondary">Event graphs, root cause analysis, and explainability narratives</p>
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

        <div className="lg:col-span-2 space-y-4">
          {selectedIncident && causalResult ? (
            <>
              <div className="atlas-card p-4">
                <h2 className="text-sm font-semibold text-atlas-text mb-1">{selectedIncident.title}</h2>
                <p className="text-xs text-atlas-text-secondary">
                  Created {new Date(selectedIncident.created_at).toLocaleString()}
                  {selectedIncident.resolved_at && ` - Resolved ${new Date(selectedIncident.resolved_at).toLocaleString()}`}
                </p>
              </div>

              <CausalGraph events={causalResult.events} />
              <NarrativeExplainer
                narrative={causalResult.narrative}
                rootCause={causalResult.rootCause}
                confidence={causalResult.confidence}
              />
            </>
          ) : (
            <div className="atlas-card p-8 text-center">
              <AlertCircle className="w-8 h-8 text-atlas-text-secondary mx-auto mb-3" />
              <p className="text-sm text-atlas-text-secondary">Select an incident to view its causal chain</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
