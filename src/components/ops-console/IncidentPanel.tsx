import { useMemo } from 'react';
import type { Incident, EdgeNode } from '@/types';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { AlertTriangle, ChevronRight, Clock } from 'lucide-react';

interface IncidentPanelProps {
  incidents: Incident[];
  nodes: EdgeNode[];
  onSelect: (incident: Incident) => void;
  selectedId?: string | null;
}

export function IncidentPanel({ incidents, nodes, onSelect, selectedId }: IncidentPanelProps) {
  const nodeMap = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);
  const sorted = useMemo(() => {
    const statusOrder: Record<string, number> = { active: 0, investigating: 1, healing: 2, resolved: 3, dismissed: 4 };
    return [...incidents].sort((a, b) => {
      const sa = statusOrder[a.status] ?? 5;
      const sb = statusOrder[b.status] ?? 5;
      if (sa !== sb) return sa - sb;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [incidents]);

  if (sorted.length === 0) {
    return (
      <div className="atlas-card p-8 text-center">
        <AlertTriangle className="w-8 h-8 text-atlas-text-secondary mx-auto mb-3" />
        <p className="text-sm text-atlas-text-secondary">No incidents recorded</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-[600px] overflow-y-auto scrollbar-thin">
      {sorted.map((inc) => {
        const node = inc.node_id ? nodeMap.get(inc.node_id) : null;
        const isActive = inc.status === 'active' || inc.status === 'investigating' || inc.status === 'healing';
        const isSelected = selectedId === inc.id;

        return (
          <button
            key={inc.id}
            onClick={() => onSelect(inc)}
            className={`w-full text-left atlas-card p-3 hover:border-cyan-500/30 transition-all duration-200 ${
              isSelected ? 'border-cyan-500/40 bg-cyan-500/5' : ''
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <StatusBadge status={inc.severity} pulse={isActive && inc.severity === 'critical'} />
                  <StatusBadge status={inc.status} />
                </div>
                <p className="text-sm font-medium text-atlas-text truncate">{inc.title}</p>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-atlas-text-secondary">
                  {node && <span className="font-mono">{node.name}</span>}
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {timeAgo(inc.created_at)}
                  </span>
                  {inc.mttr_seconds && (
                    <span className="text-emerald-400">MTTR: {inc.mttr_seconds}s</span>
                  )}
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-atlas-text-secondary shrink-0 mt-1" />
            </div>
          </button>
        );
      })}
    </div>
  );
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
