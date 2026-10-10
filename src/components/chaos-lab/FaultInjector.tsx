import { useState } from 'react';
import type { EdgeNode, LiveTelemetry } from '@/types';
import { edgeSimulator } from '@/lib/edge/simulator';
import { Zap, Thermometer, Vibrate, Volume2, Power, Network, Activity, Radio } from 'lucide-react';
import type { ComponentType, CSSProperties } from 'react';

interface FaultInjectorProps {
  nodes: EdgeNode[];
  telemetry: LiveTelemetry[];
  onInject: (nodeId: string, faultType: string, intensity: number) => void;
}

const FAULT_TYPES: { type: string; label: string; icon: ComponentType<{ className?: string; style?: CSSProperties }>; color: string }[] = [
  { type: 'temperature_spike', label: 'Temperature Spike', icon: Thermometer, color: '#ef4444' },
  { type: 'vibration_surge', label: 'Vibration Surge', icon: Vibrate, color: '#f59e0b' },
  { type: 'power_loss', label: 'Power Loss', icon: Power, color: '#22d3ee' },
  { type: 'acoustic_noise', label: 'Acoustic Noise', icon: Volume2, color: '#a78bfa' },
  { type: 'network_partition', label: 'Network Partition', icon: Network, color: '#10b981' },
];

export function FaultInjector({ nodes, telemetry, onInject }: FaultInjectorProps) {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [selectedFault, setSelectedFault] = useState<string>('temperature_spike');
  const [intensity, setIntensity] = useState(0.7);
  const [activeFaults, setActiveFaults] = useState<Map<string, { type: string; intensity: number }>>(new Map());

  const handleInject = () => {
    if (!selectedNode) return;
    edgeSimulator.injectFault(selectedNode, selectedFault, intensity);
    onInject(selectedNode, selectedFault, intensity);
    setActiveFaults((prev) => new Map(prev.set(selectedNode, { type: selectedFault, intensity })));
  };

  const handleClear = (nodeId: string) => {
    edgeSimulator.clearFault(nodeId);
    setActiveFaults((prev) => {
      const next = new Map(prev);
      next.delete(nodeId);
      return next;
    });
  };

  const telMap = new Map(telemetry.map((t) => [t.nodeId, t]));

  return (
    <div className="space-y-4">
      <div className="atlas-card p-4">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-atlas-text">Fault Injection Console</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-atlas-text-secondary mb-2 block">Target Node</label>
            <select
              value={selectedNode || ''}
              onChange={(e) => setSelectedNode(e.target.value)}
              className="atlas-input w-full text-sm"
            >
              <option value="">Select a node...</option>
              {nodes.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.name} ({n.type}, {n.sector})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-atlas-text-secondary mb-2 block">Fault Type</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {FAULT_TYPES.map((fault) => {
                const Icon = fault.icon;
                const isSelected = selectedFault === fault.type;
                return (
                  <button
                    key={fault.type}
                    onClick={() => setSelectedFault(fault.type)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                      isSelected
                        ? 'border-amber-500/40 bg-amber-500/10 text-amber-400'
                        : 'border-atlas-border/30 text-atlas-text-secondary hover:text-atlas-text hover:border-atlas-border'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" style={{ color: isSelected ? fault.color : undefined }} />
                    {fault.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-xs text-atlas-text-secondary mb-2 block">
              Intensity: {Math.round(intensity * 100)}%
            </label>
            <input
              type="range"
              min={0.1}
              max={1}
              step={0.1}
              value={intensity}
              onChange={(e) => setIntensity(parseFloat(e.target.value))}
              className="w-full accent-amber-500"
            />
          </div>

          <button
            onClick={handleInject}
            disabled={!selectedNode}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-amber-500/20 text-amber-400 text-sm font-medium hover:bg-amber-500/30 transition-colors border border-amber-500/30 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Zap className="w-4 h-4" />
            Inject Fault
          </button>
        </div>
      </div>

      {activeFaults.size > 0 && (
        <div className="atlas-card p-4">
          <h3 className="text-sm font-semibold text-atlas-text mb-3">Active Faults</h3>
          <div className="space-y-2">
            {Array.from(activeFaults.entries()).map(([nodeId, fault]) => {
              const node = nodes.find((n) => n.id === nodeId);
              const reading = telMap.get(nodeId);
              return (
                <div key={nodeId} className="flex items-center justify-between p-2.5 rounded-lg bg-red-500/5 border border-red-500/20">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-red-400 animate-pulse" />
                    <div>
                      <p className="text-xs font-medium text-atlas-text">{node?.name || nodeId}</p>
                      <p className="text-xs text-atlas-text-secondary capitalize">
                        {fault.type.replace('_', ' ')} - {Math.round(fault.intensity * 100)}%
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {reading && (
                      <span className={`text-xs font-mono ${reading.isAnomalous ? 'text-red-400' : 'text-emerald-400'}`}>
                        {(reading.anomalyScore * 100).toFixed(0)}%
                      </span>
                    )}
                    <button
                      onClick={() => handleClear(nodeId)}
                      className="text-xs text-atlas-text-secondary hover:text-red-400 transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="atlas-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Radio className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-atlas-text">Blast Radius Analysis</h3>
        </div>
        <p className="text-xs text-atlas-text-secondary mb-3">
          Nodes in the same sector as the faulted node are considered within blast radius. Swarm consensus will engage neighbors to validate anomaly propagation.
        </p>
        <div className="grid grid-cols-3 gap-2">
          {['datacenter', 'factory', 'powergrid'].map((sector) => {
            const sectorNodes = nodes.filter((n) => n.sector === sector);
            const sectorReadings = sectorNodes
              .map((n) => telMap.get(n.id))
              .filter((r): r is LiveTelemetry => r !== undefined);
            const anomalousCount = sectorReadings.filter((r) => r.isAnomalous).length;
            const hasFault = Array.from(activeFaults.keys()).some((id) =>
              nodes.find((n) => n.id === id)?.sector === sector
            );

            return (
              <div
                key={sector}
                className={`p-3 rounded-lg border transition-all ${
                  hasFault
                    ? 'border-red-500/30 bg-red-500/5'
                    : 'border-atlas-border/30'
                }`}
              >
                <p className="text-xs font-medium text-atlas-text capitalize mb-1">{sector}</p>
                <p className="text-lg font-bold text-atlas-text">{sectorNodes.length}</p>
                <p className="text-xs text-atlas-text-secondary">nodes</p>
                {anomalousCount > 0 && (
                  <p className="text-xs text-red-400 mt-1">{anomalousCount} anomalous</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
