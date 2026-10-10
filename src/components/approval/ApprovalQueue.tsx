import { useMemo } from 'react';
import type { Approval, Incident, EdgeNode } from '@/types';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Check, X, Zap, Shield, Power, RefreshCw, Bell, AlertCircle } from 'lucide-react';
import type { ActionType } from '@/types';
import type { ComponentType } from 'react';

interface ApprovalQueueProps {
  approvals: Approval[];
  incidents: Incident[];
  nodes: EdgeNode[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

const ACTION_ICONS: Record<ActionType, ComponentType<{ className?: string }>> = {
  throttle: Zap,
  isolate: Shield,
  failover: Power,
  restart: RefreshCw,
  notify: Bell,
  shutdown: AlertCircle,
};

export function ApprovalQueue({ approvals, incidents, nodes, onApprove, onReject }: ApprovalQueueProps) {
  const incidentMap = useMemo(() => new Map(incidents.map((i) => [i.id, i])), [incidents]);
  const nodeMap = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);

  const pending = approvals.filter((a) => a.status === 'pending');
  const completed = approvals.filter((a) => a.status !== 'pending').slice(0, 10);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-atlas-text mb-3">
          Pending Actions {pending.length > 0 && `(${pending.length})`}
        </h3>
        {pending.length === 0 ? (
          <div className="atlas-card p-6 text-center">
            <Check className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
            <p className="text-sm text-atlas-text-secondary">No pending approvals</p>
          </div>
        ) : (
          <div className="space-y-2">
            {pending.map((approval) => {
              const incident = incidentMap.get(approval.incident_id);
              const node = incident?.node_id ? nodeMap.get(incident.node_id) : null;
              const Icon = ACTION_ICONS[approval.action_type] || Zap;

              return (
                <div key={approval.id} className="atlas-card p-4 animate-slide-in-right">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-atlas-text capitalize">
                          {approval.action_type}
                        </span>
                        <StatusBadge status={approval.risk_level} />
                      </div>
                      {incident && (
                        <p className="text-xs text-atlas-text-secondary truncate">{incident.title}</p>
                      )}
                      {node && (
                        <p className="text-xs font-mono text-cyan-400 mt-1">{node.name}</p>
                      )}
                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={() => onApprove(approval.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-medium hover:bg-emerald-500/30 transition-colors border border-emerald-500/30"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Approve
                        </button>
                        <button
                          onClick={() => onReject(approval.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-xs font-medium hover:bg-red-500/30 transition-colors border border-red-500/30"
                        >
                          <X className="w-3.5 h-3.5" />
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {completed.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-atlas-text mb-3">Recent Decisions</h3>
          <div className="space-y-1.5">
            {completed.map((approval) => {
              const incident = incidentMap.get(approval.incident_id);
              const Icon = ACTION_ICONS[approval.action_type] || Zap;
              return (
                <div key={approval.id} className="atlas-card p-2.5 flex items-center gap-3">
                  <Icon className="w-4 h-4 text-atlas-text-secondary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-medium text-atlas-text capitalize">{approval.action_type}</span>
                    {incident && <span className="text-xs text-atlas-text-secondary ml-2 truncate">{incident.title}</span>}
                  </div>
                  <StatusBadge status={approval.status} />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
