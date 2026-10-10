import type { LiveTelemetry, SwarmVote } from '@/types';

interface AnomalyResult {
  isAnomalous: boolean;
  score: number;
  classification: string;
  confidence: number;
}

const TYPE_THRESHOLDS: Record<string, { temp: number; vibration: number; sound: number }> = {
  server: { temp: 82, vibration: 1.8, sound: 75 },
  motor: { temp: 72, vibration: 4.0, sound: 80 },
  transformer: { temp: 60, vibration: 0.8, sound: 65 },
  pump: { temp: 65, vibration: 2.5, sound: 70 },
  compressor: { temp: 75, vibration: 2.0, sound: 85 },
  sensor: { temp: 45, vibration: 0.25, sound: 40 },
};

export function detectAnomaly(reading: LiveTelemetry): AnomalyResult {
  const thresholds = TYPE_THRESHOLDS[reading.type] || TYPE_THRESHOLDS.server;
  let score = 0;
  let classification = 'normal';
  let maxContributor = '';

  if (reading.temperature > thresholds.temp) {
    const tempScore = Math.min(1, (reading.temperature - thresholds.temp) / 15);
    if (tempScore > score) {
      score = tempScore;
      classification = 'thermal_anomaly';
      maxContributor = 'temperature';
    }
  }

  if (reading.vibration > thresholds.vibration) {
    const vibScore = Math.min(1, (reading.vibration - thresholds.vibration) / 2);
    if (vibScore > score) {
      score = vibScore;
      classification = 'vibration_anomaly';
      maxContributor = 'vibration';
    }
  }

  if (reading.sound > thresholds.sound) {
    const soundScore = Math.min(1, (reading.sound - thresholds.sound) / 15);
    if (soundScore > score) {
      score = soundScore;
      classification = 'acoustic_anomaly';
      maxContributor = 'sound';
    }
  }

  const isAnomalous = score > 0.6;
  const confidence = isAnomalous ? 0.7 + score * 0.25 : 1 - score * 0.5;

  void maxContributor;

  return {
    isAnomalous,
    score: Math.round(score * 100) / 100,
    classification,
    confidence: Math.round(confidence * 100) / 100,
  };
}

export function runSwarmConsensus(
  targetReading: LiveTelemetry,
  neighborReadings: LiveTelemetry[]
): { votes: SwarmVote[]; consensus: boolean; voteCount: number; totalVoters: number } {
  const votes: SwarmVote[] = [];
  const targetAnomaly = detectAnomaly(targetReading);

  if (!targetAnomaly.isAnomalous) {
    return { votes: [], consensus: false, voteCount: 0, totalVoters: neighborReadings.length };
  }

  for (const neighbor of neighborReadings) {
    if (neighbor.nodeId === targetReading.nodeId) continue;

    const neighborAnomaly = detectAnomaly(neighbor);
    const sameSector = neighbor.sector === targetReading.sector;
    const proximityWeight = sameSector ? 1.0 : 0.5;

    const neighborSeesElevation =
      neighbor.anomalyScore > 0.3 || neighborAnomaly.score > 0.3;

    const vote = neighborSeesElevation;
    const confidence = vote
      ? Math.round((0.6 + neighborAnomaly.score * 0.3) * proximityWeight * 100) / 100
      : 0.3;

    const reason = vote
      ? `Neighbor ${neighbor.nodeName} detected correlated elevation (score: ${neighbor.anomalyScore.toFixed(2)})`
      : `Neighbor ${neighbor.nodeName} shows no correlated signal`;

    votes.push({
      voterId: neighbor.nodeId,
      voterName: neighbor.nodeName,
      targetId: targetReading.nodeId,
      vote,
      confidence,
      reason,
    });
  }

  const voteCount = votes.filter((v) => v.vote).length;
  const totalVoters = votes.length;
  const consensus = totalVoters > 0 && voteCount / totalVoters >= 0.6;

  return { votes, consensus, voteCount, totalVoters };
}
