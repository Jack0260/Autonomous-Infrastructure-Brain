import type { CausalEvent, LiveTelemetry } from '@/types';

interface CausalChainResult {
  events: CausalEvent[];
  narrative: string;
  rootCause: string;
  confidence: number;
}

export function buildCausalChain(
  reading: LiveTelemetry,
  anomalyClassification: string,
  swarmConsensus: boolean,
  swarmVotes: number,
  swarmTotal: number,
  policyName: string | null,
  actionTaken: string | null
): CausalChainResult {
  const events: CausalEvent[] = [];
  let tsOffset = 0;

  const rootCauseMap: Record<string, string> = {
    thermal_anomaly: 'cooling system degradation or ambient heat influx',
    vibration_anomaly: 'mechanical wear in bearings or rotating components',
    acoustic_anomaly: 'abnormal pressure differentials or gas flow obstruction',
    normal: 'sensor calibration drift',
  };

  const rootCause = rootCauseMap[anomalyClassification] || 'unknown underlying condition';

  events.push({
    event: `${anomalyClassification}_detected`,
    node: reading.nodeName,
    ts_offset: tsOffset,
    detail: `Edge AI on ${reading.nodeName} classified reading as ${anomalyClassification}. Temp: ${reading.temperature}C, Vibration: ${reading.vibration}mm/s, Sound: ${reading.sound}dB`,
    confidence: 0.9,
  });
  tsOffset += 3;

  events.push({
    event: 'metric_deviation',
    node: reading.nodeName,
    ts_offset: tsOffset,
    detail: `Primary metric deviated from baseline. Anomaly score: ${reading.anomalyScore.toFixed(2)}`,
    confidence: 0.85,
  });
  tsOffset += 5;

  if (swarmConsensus) {
    events.push({
      event: 'swarm_consensus',
      node: reading.nodeName,
      ts_offset: tsOffset,
      detail: `${swarmVotes} of ${swarmTotal} neighboring nodes confirmed anomaly via bio-inspired voting protocol. False positive probability reduced.`,
      confidence: 0.88,
    });
    tsOffset += 4;
  } else if (swarmTotal > 0) {
    events.push({
      event: 'swarm_dissent',
      node: reading.nodeName,
      ts_offset: tsOffset,
      detail: `Swarm voting did not reach consensus (${swarmVotes}/${swarmTotal}). Alert escalated with reduced confidence.`,
      confidence: 0.55,
    });
    tsOffset += 4;
  }

  events.push({
    event: 'causal_inference',
    node: reading.nodeName,
    ts_offset: tsOffset,
    detail: `Causal graph: metric_deviation -> ${anomalyClassification} -> ${rootCause}. Inferred root cause with ${(0.8 + reading.anomalyScore * 0.15).toFixed(2)} confidence.`,
    confidence: 0.8 + reading.anomalyScore * 0.15,
  });
  tsOffset += 5;

  if (policyName) {
    events.push({
      event: 'policy_match',
      node: reading.nodeName,
      ts_offset: tsOffset,
      detail: `Self-heal engine matched policy: ${policyName}. Action queued for approval.`,
      confidence: 1.0,
    });
    tsOffset += 3;
  }

  if (actionTaken) {
    events.push({
      event: 'action_executed',
      node: reading.nodeName,
      ts_offset: tsOffset,
      detail: `Action executed: ${actionTaken}`,
      confidence: 1.0,
    });
  }

  const narrative = buildNarrative(reading, anomalyClassification, rootCause, swarmConsensus, swarmVotes, swarmTotal, policyName, actionTaken);
  const avgConfidence = events.reduce((sum, e) => sum + e.confidence, 0) / events.length;

  return { events, narrative, rootCause, confidence: Math.round(avgConfidence * 100) / 100 };
}

function buildNarrative(
  reading: LiveTelemetry,
  classification: string,
  rootCause: string,
  consensus: boolean,
  votes: number,
  total: number,
  policyName: string | null,
  action: string | null
): string {
  const parts: string[] = [];

  parts.push(
    `At ${new Date(reading.timestamp).toISOString()}, edge AI on node ${reading.nodeName} (${reading.sector}/${reading.type}) detected a ${classification.replace('_', ' ')}.`
  );

  parts.push(
    `The anomaly was driven by temperature=${reading.temperature}C, vibration=${reading.vibration}mm/s, sound=${reading.sound}dB, with an overall anomaly score of ${reading.anomalyScore.toFixed(2)}.`
  );

  if (consensus) {
    parts.push(
      `The swarm consensus protocol engaged: ${votes} of ${total} neighboring nodes confirmed the anomaly, significantly reducing the false-positive probability.`
    );
  } else if (total > 0) {
    parts.push(
      `Swarm consensus was not reached (${votes}/${total} votes), so the alert was escalated with reduced confidence.`
    );
  }

  parts.push(
    `Causal inference traced the root cause to ${rootCause}, with a causal chain confidence matching the anomaly score.`
  );

  if (policyName) {
    parts.push(`The self-heal engine matched policy "${policyName}" and queued a remediation action.`);
  }

  if (action) {
    parts.push(`The following action was taken: ${action}.`);
  }

  return parts.join(' ');
}
