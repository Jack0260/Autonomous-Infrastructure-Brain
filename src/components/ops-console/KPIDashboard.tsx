import { useState, useMemo } from 'react';
import {
  AreaChart, Area, BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadialBarChart, RadialBar, PolarAngleAxis,
} from 'recharts';
import type { Incident, EdgeNode, LiveTelemetry } from '@/types';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { computeKPIs, computeMetricsSummary } from '@/lib/observability/metrics';
import type { Approval } from '@/types';
import { TrendingDown, Clock, DollarSign, Leaf, Server, AlertTriangle, CheckCircle } from 'lucide-react';

interface KPIDashboardProps {
  incidents: Incident[];
  nodes: EdgeNode[];
  approvals: Approval[];
  telemetry: LiveTelemetry[];
}

export function KPIDashboard({ incidents, nodes, approvals, telemetry }: KPIDashboardProps) {
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d'>('24h');

  const kpis = useMemo(() => computeKPIs(incidents, nodes, approvals), [incidents, nodes, approvals]);
  const summary = useMemo(() => computeMetricsSummary(nodes, incidents, approvals), [nodes, incidents, approvals]);

  const healthGaugeData = [{ name: 'health', value: summary.systemHealth, fill: summary.systemHealth > 80 ? '#10b981' : summary.systemHealth > 60 ? '#f59e0b' : '#ef4444' }];

  const incidentTrendData = useMemo(() => {
    const buckets: Record<string, { time: string; critical: number; high: number; medium: number }> = {};
    const now = Date.now();
    const hours = timeRange === '1h' ? 1 : timeRange === '24h' ? 24 : 168;
    const interval = timeRange === '7d' ? 24 : 1;

    for (let i = hours; i >= 0; i -= interval) {
      const ts = new Date(now - i * 3600 * 1000);
      const label = timeRange === '7d'
        ? ts.toLocaleDateString('en-US', { weekday: 'short' })
        : ts.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      buckets[label] = { time: label, critical: 0, high: 0, medium: 0 };
    }

    incidents.forEach((inc) => {
      const incTime = new Date(inc.created_at).getTime();
      const diffHours = (now - incTime) / 3600000;
      if (diffHours <= hours) {
        const ts = new Date(incTime);
        const label = timeRange === '7d'
          ? ts.toLocaleDateString('en-US', { weekday: 'short' })
          : ts.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        if (buckets[label]) {
          if (inc.severity === 'critical') buckets[label].critical++;
          else if (inc.severity === 'high') buckets[label].high++;
          else buckets[label].medium++;
        }
      }
    });

    return Object.values(buckets);
  }, [incidents, timeRange]);

  const telemetryChartData = useMemo(() => {
    if (telemetry.length === 0) return [];
    const anomalous = telemetry.filter((t) => t.isAnomalous).length;
    const healthy = telemetry.length - anomalous;
    const avgAnomaly = telemetry.reduce((s, t) => s + t.anomalyScore, 0) / telemetry.length;
    return [
      { name: 'Healthy', count: healthy },
      { name: 'Anomalous', count: anomalous },
      { name: 'Avg Score', count: Math.round(avgAnomaly * 100) },
    ];
  }, [telemetry]);

  const nodeHealthData = useMemo(() => {
    return nodes.slice(0, 12).map((n) => ({
      name: n.name.split('-').pop() || n.name,
      health: Math.round(n.health_score),
      sector: n.sector,
    }));
  }, [nodes]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-atlas-text">Key Performance Indicators</h2>
        <div className="flex gap-1 atlas-card p-1">
          {(['1h', '24h', '7d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                timeRange === range ? 'bg-cyan-500/20 text-cyan-400' : 'text-atlas-text-secondary hover:text-atlas-text'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          icon={Clock}
          label="MTTR"
          value={`${kpis.mttr}s`}
          subValue={`${kpis.mttrReduction}% reduction`}
          color="cyan"
          trend="down"
        />
        <KPICard
          icon={TrendingDown}
          label="False Positive Rate"
          value={`${kpis.falsePositiveRate}%`}
          subValue={`${kpis.falsePositiveReduction}% reduction (swarm)`}
          color="emerald"
          trend="down"
        />
        <KPICard
          icon={DollarSign}
          label="Cost Saved"
          value={`$${(kpis.costSaved / 1000).toFixed(0)}k`}
          subValue="Preventive actions"
          color="amber"
          trend="up"
        />
        <KPICard
          icon={Leaf}
          label="Carbon Saved"
          value={`${kpis.carbonSaved}t`}
          subValue="CO2 equivalent"
          color="emerald"
          trend="up"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="atlas-card p-4 lg:col-span-2">
          <h3 className="text-sm font-medium text-atlas-text mb-3">Incident Trends</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={incidentTrendData}>
              <defs>
                <linearGradient id="critGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="highGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
              <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: '#e2e8f0' }}
              />
              <Area type="monotone" dataKey="critical" stackId="1" stroke="#ef4444" fill="url(#critGrad)" name="Critical" />
              <Area type="monotone" dataKey="high" stackId="1" stroke="#f59e0b" fill="url(#highGrad)" name="High" />
              <Area type="monotone" dataKey="medium" stackId="1" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.1} name="Medium" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="atlas-card p-4">
          <h3 className="text-sm font-medium text-atlas-text mb-3">System Health</h3>
          <ResponsiveContainer width="100%" height={220}>
            <RadialBarChart innerRadius="65%" outerRadius="95%" data={healthGaugeData} startAngle={90} endAngle={-270}>
              <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
              <RadialBar background={{ fill: '#1e293b' }} dataKey="value" cornerRadius={8} />
              <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" fill="#e2e8f0" fontSize="28" fontWeight="700">
                {summary.systemHealth.toFixed(1)}%
              </text>
            </RadialBarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="atlas-card p-4">
          <h3 className="text-sm font-medium text-atlas-text mb-3">Live Telemetry Summary</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={telemetryChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: '#e2e8f0' }}
              />
              <Bar dataKey="count" fill="#22d3ee" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="atlas-card p-4 lg:col-span-2">
          <h3 className="text-sm font-medium text-atlas-text mb-3">Node Health Scores</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={nodeHealthData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} horizontal={false} />
              <XAxis type="number" domain={[0, 100]} stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} width={70} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: '#e2e8f0' }}
              />
              <Bar dataKey="health" radius={[0, 4, 4, 0]}>
                {nodeHealthData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.health > 80 ? '#10b981' : entry.health > 60 ? '#f59e0b' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Server} label="Nodes Online" value={`${summary.nodesOnline}/${summary.nodesOnline + summary.nodesDegraded + summary.nodesOffline}`} color="emerald" />
        <StatCard icon={AlertTriangle} label="Active Incidents" value={String(summary.activeIncidents)} color={summary.activeIncidents > 0 ? 'red' : 'emerald'} />
        <StatCard icon={CheckCircle} label="Pending Approvals" value={String(summary.pendingApprovals)} color={summary.pendingApprovals > 0 ? 'amber' : 'emerald'} />
        <StatCard icon={TrendingDown} label="Swarm Consensus" value={`${summary.swarmConsensusRate}%`} color="cyan" />
      </div>
    </div>
  );
}

const COLOR_MAP: Record<string, string> = {
  cyan: '#22d3ee',
  emerald: '#10b981',
  amber: '#f59e0b',
  red: '#ef4444',
};

function KPICard({ icon: Icon, label, value, subValue, color, trend }: {
  icon: typeof Clock;
  label: string;
  value: string;
  subValue: string;
  color: string;
  trend: 'up' | 'down';
}) {
  const c = COLOR_MAP[color] || '#22d3ee';
  return (
    <div className="atlas-card p-4">
      <div className="flex items-center justify-between mb-2">
        <Icon className="w-5 h-5" style={{ color: c }} />
        <span className={`text-xs ${trend === 'down' ? 'text-emerald-400' : 'text-cyan-400'}`}>
          {trend === 'down' ? '-' : '+'}
        </span>
      </div>
      <p className="text-2xl font-bold text-atlas-text">{value}</p>
      <p className="text-xs text-atlas-text-secondary mt-1">{label}</p>
      <p className="text-xs mt-1" style={{ color: c }}>{subValue}</p>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: {
  icon: typeof Server;
  label: string;
  value: string;
  color: string;
}) {
  const c = COLOR_MAP[color] || '#22d3ee';
  return (
    <div className="atlas-card p-3 flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${c}20` }}>
        <Icon className="w-4 h-4" style={{ color: c }} />
      </div>
      <div>
        <p className="text-lg font-bold text-atlas-text">{value}</p>
        <p className="text-xs text-atlas-text-secondary">{label}</p>
      </div>
    </div>
  );
}
