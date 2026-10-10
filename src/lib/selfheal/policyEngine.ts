import type { Policy, LiveTelemetry, ActionType, Severity } from '@/types';

interface PolicyMatch {
  policy: Policy;
  matched: boolean;
  action: ActionType;
  riskLevel: Severity;
}

export function evaluatePolicies(
  reading: LiveTelemetry,
  policies: Policy[]
): PolicyMatch | null {
  const enabled = policies
    .filter((p) => p.enabled)
    .sort((a, b) => a.priority - b.priority);

  for (const policy of enabled) {
    const cond = policy.conditions;
    if (cond.node_type && cond.node_type !== reading.type) continue;

    let value: number | undefined;
    switch (cond.metric) {
      case 'temperature': value = reading.temperature; break;
      case 'vibration': value = reading.vibration; break;
      case 'power': value = reading.power; break;
      case 'sound': value = reading.sound; break;
    }

    if (value === undefined) continue;

    let matched = false;
    switch (cond.operator) {
      case '>': matched = value > cond.threshold; break;
      case '<': matched = value < cond.threshold; break;
      case '>=': matched = value >= cond.threshold; break;
      case '<=': matched = value <= cond.threshold; break;
      case '==': matched = value === cond.threshold; break;
    }

    if (matched) {
      const riskLevel: Severity = cond.severity || inferRiskLevel(reading, policy);
      return {
        policy,
        matched: true,
        action: policy.action.type,
        riskLevel,
      };
    }
  }

  return null;
}

function inferRiskLevel(reading: LiveTelemetry, policy: Policy): Severity {
  if (reading.anomalyScore > 0.9 || policy.priority <= 5) return 'critical';
  if (reading.anomalyScore > 0.75 || policy.priority <= 20) return 'high';
  if (reading.anomalyScore > 0.6) return 'medium';
  return 'low';
}

export function buildActionParams(
  actionType: ActionType,
  reading: LiveTelemetry
): Record<string, unknown> {
  switch (actionType) {
    case 'throttle':
      return { level: 0.7, target: 'cpu', nodeId: reading.nodeId };
    case 'isolate':
      return { grace_period: 30, nodeId: reading.nodeId };
    case 'failover':
      return { backup_node: 'auto', nodeId: reading.nodeId };
    case 'restart':
      return { delay: 5, nodeId: reading.nodeId };
    case 'shutdown':
      return { immediate: true, nodeId: reading.nodeId };
    case 'notify':
      return { channel: 'ops-console', priority: 'high', nodeId: reading.nodeId };
    default:
      return {};
  }
}
