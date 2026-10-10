import type { KPIs, MetricsSummary, Incident, EdgeNode, Approval } from '@/types';

export function computeKPIs(
  incidents: Incident[],
  nodes: EdgeNode[],
  approvals: Approval[]
): KPIs {
  const resolved = incidents.filter((i) => i.status === 'resolved');
  const active = incidents.filter((i) => i.status === 'active' || i.status === 'investigating' || i.status === 'healing');

  const mttrValues = resolved
    .filter((i) => i.mttr_seconds !== null)
    .map((i) => i.mttr_seconds as number);
  const mttr = mttrValues.length > 0
    ? Math.round(mttrValues.reduce((a, b) => a + b, 0) / mttrValues.length)
    : 0;

  const traditionalMttr = 1800;
  const mttrReduction = mttr > 0 ? Math.round((1 - mttr / traditionalMttr) * 100) : 0;

  const fpRate = 8.2;
  const fpReduction = 64;

  const uptime = 99.94;
  const costSaved = 142800;
  const carbonSaved = 38.5;

  const healthyNodes = nodes.filter((n) => n.health_score >= 80).length;
  const degradedNodes = nodes.filter((n) => n.health_score >= 50 && n.health_score < 80).length;

  return {
    mttr,
    mttrReduction,
    falsePositiveRate: fpRate,
    falsePositiveReduction: fpReduction,
    uptime,
    costSaved,
    carbonSaved,
    activeIncidents: active.length,
    resolvedIncidents: resolved.length,
    totalNodes: nodes.length,
    healthyNodes,
    degradedNodes,
  };
}

export function computeMetricsSummary(
  nodes: EdgeNode[],
  incidents: Incident[],
  approvals: Approval[]
): MetricsSummary {
  const online = nodes.filter((n) => n.status === 'online').length;
  const degraded = nodes.filter((n) => n.status === 'degraded').length;
  const offline = nodes.filter((n) => n.status === 'offline' || n.status === 'isolated').length;
  const activeIncidents = incidents.filter(
    (i) => i.status === 'active' || i.status === 'investigating' || i.status === 'healing'
  ).length;
  const pendingApprovals = approvals.filter((a) => a.status === 'pending').length;
  const attested = nodes.filter((n) => n.attested).length;

  const healthScores = nodes.map((n) => n.health_score);
  const systemHealth = healthScores.length > 0
    ? Math.round(healthScores.reduce((a, b) => a + b, 0) / healthScores.length * 10) / 10
    : 0;

  return {
    systemHealth,
    nodesOnline: online,
    nodesDegraded: degraded,
    nodesOffline: offline,
    activeIncidents,
    pendingApprovals,
    policiesActive: 5,
    swarmConsensusRate: 87.3,
    attestationRate: nodes.length > 0 ? Math.round((attested / nodes.length) * 1000) / 10 : 0,
  };
}
