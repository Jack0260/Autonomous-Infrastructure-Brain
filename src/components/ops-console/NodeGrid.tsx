import { useMemo, useState } from 'react';
import type { EdgeNode, LiveTelemetry } from '@/types';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Search, Thermometer, Vibrate, Zap, Volume2 } from 'lucide-react';

interface NodeGridProps {
  nodes: EdgeNode[];
  telemetry: LiveTelemetry[];
  onSelect?: (nodeId: string) => void;
  selectedId?: string | null;
}

export function NodeGrid({ nodes, telemetry, onSelect, selectedId }: NodeGridProps) {
  const [search, setSearch] = useState('');
  const [filterSector, setFilterSector] = useState<string>('all');

  const telMap = useMemo(() => new Map(telemetry.map((t) => [t.nodeId, t])), [telemetry]);

  const filtered = useMemo(() => {
    return nodes.filter((n) => {
      if (filterSector !== 'all' && n.sector !== filterSector) return false;
      if (search && !n.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [nodes, search, filterSector]);

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-atlas-text-secondary" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search nodes..."
            className="atlas-input w-full pl-9"
          />
        </div>
        <div className="flex gap-1 atlas-card p-1">
          {['all', 'datacenter', 'factory', 'powergrid'].map((sector) => (
            <button
              key={sector}
              onClick={() => setFilterSector(sector)}
              className={`px-3 py-1 rounded text-xs font-medium capitalize transition-colors ${
                filterSector === sector ? 'bg-cyan-500/20 text-cyan-400' : 'text-atlas-text-secondary hover:text-atlas-text'
              }`}
            >
              {sector}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[600px] overflow-y-auto scrollbar-thin">
        {filtered.map((node) => {
          const reading = telMap.get(node.id);
          const isSelected = selectedId === node.id;

          return (
            <button
              key={node.id}
              onClick={() => onSelect?.(node.id)}
              className={`atlas-card p-3 text-left transition-all hover:border-cyan-500/30 ${
                isSelected ? 'border-cyan-500/40 bg-cyan-500/5' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-mono font-medium text-atlas-text">{node.name}</span>
                <StatusBadge status={node.status} pulse={node.status === 'degraded'} />
              </div>

              <div className="flex items-center gap-2 text-xs text-atlas-text-secondary mb-3">
                <span className="capitalize">{node.type}</span>
                <span>-</span>
                <span className="capitalize">{node.sector}</span>
              </div>

              {reading ? (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <Metric icon={Thermometer} label="Temp" value={`${reading.temperature}C`} color={reading.temperature > 80 ? 'text-red-400' : 'text-atlas-text-secondary'} />
                  <Metric icon={Vibrate} label="Vibration" value={`${reading.vibration}mm/s`} color={reading.vibration > 4 ? 'text-amber-400' : 'text-atlas-text-secondary'} />
                  <Metric icon={Zap} label="Power" value={`${reading.power}W`} color="text-atlas-text-secondary" />
                  <Metric icon={Volume2} label="Sound" value={`${reading.sound}dB`} color="text-atlas-text-secondary" />
                </div>
              ) : (
                <p className="text-xs text-atlas-text-secondary">No telemetry yet</p>
              )}

              {reading && (
                <div className="mt-2 pt-2 border-t border-atlas-border/30 flex items-center justify-between">
                  <span className="text-xs text-atlas-text-secondary">Anomaly Score</span>
                  <span className={`text-xs font-mono font-bold ${
                    reading.isAnomalous ? 'text-red-400' : 'text-emerald-400'
                  }`}>
                    {(reading.anomalyScore * 100).toFixed(0)}%
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Metric({ icon: Icon, label, value, color }: {
  icon: typeof Thermometer;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon className={`w-3 h-3 ${color}`} />
      <span className="text-atlas-text-secondary">{label}:</span>
      <span className={`font-mono ${color}`}>{value}</span>
    </div>
  );
}
