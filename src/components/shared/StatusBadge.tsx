import type { NodeStatus, Severity, IncidentStatus, ApprovalStatus } from '@/types';

const STATUS_COLORS: Record<string, string> = {
  online: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  offline: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  degraded: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  isolated: 'bg-red-500/20 text-red-400 border-red-500/30',
  maintenance: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  low: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  medium: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  critical: 'bg-red-500/20 text-red-400 border-red-500/30',
  active: 'bg-red-500/20 text-red-400 border-red-500/30',
  investigating: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  healing: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  resolved: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  dismissed: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  pending: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  approved: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
  executed: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  failed: 'bg-red-500/20 text-red-400 border-red-500/30',
};

interface StatusBadgeProps {
  status: NodeStatus | Severity | IncidentStatus | ApprovalStatus | string;
  label?: string;
  pulse?: boolean;
}

export function StatusBadge({ status, label, pulse }: StatusBadgeProps) {
  const colorClass = STATUS_COLORS[status] || 'bg-slate-500/20 text-slate-400 border-slate-500/30';
  const displayLabel = label || status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClass} ${pulse ? 'animate-pulse' : ''}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${pulse ? 'animate-pulse' : ''}`}
        style={{ backgroundColor: 'currentColor' }}
      />
      {displayLabel}
    </span>
  );
}
