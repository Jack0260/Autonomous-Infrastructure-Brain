import type { EdgeNode, LiveTelemetry, NodeType, Sector } from '@/types';

interface NodeConfig {
  max_temp: number;
  max_vibration: number;
  max_power: number;
}

interface SimNode {
  id: string;
  name: string;
  sector: Sector;
  type: NodeType;
  config: NodeConfig;
  baseTemp: number;
  baseVibration: number;
  basePower: number;
  baseSound: number;
  faultActive: boolean;
  faultType: string | null;
  faultIntensity: number;
}

class EdgeSimulator {
  private nodes: SimNode[] = [];
  private listeners: ((telemetry: LiveTelemetry[]) => void)[] = [];
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private tickCount = 0;

  initialize(dbNodes: EdgeNode[]): void {
    this.nodes = dbNodes.map((n) => {
      const config = n.config as unknown as NodeConfig;
      const baseTemp = this.getBaseTemp(n.type);
      const baseVibration = this.getBaseVibration(n.type);
      const basePower = this.getBasePower(n.type, config);
      const baseSound = this.getBaseSound(n.type);
      return {
        id: n.id,
        name: n.name,
        sector: n.sector,
        type: n.type,
        config,
        baseTemp,
        baseVibration,
        basePower,
        baseSound,
        faultActive: false,
        faultType: null,
        faultIntensity: 0,
      };
    });
  }

  private getBaseTemp(type: NodeType): number {
    const temps: Record<NodeType, number> = {
      server: 68,
      motor: 55,
      transformer: 48,
      pump: 42,
      compressor: 35,
      sensor: 28,
    };
    return temps[type] + (Math.random() - 0.5) * 4;
  }

  private getBaseVibration(type: NodeType): number {
    const vibes: Record<NodeType, number> = {
      server: 0.8,
      motor: 2.5,
      transformer: 0.3,
      pump: 1.2,
      compressor: 1.0,
      sensor: 0.1,
    };
    return vibes[type] + (Math.random() - 0.5) * 0.3;
  }

  private getBasePower(type: NodeType, config: NodeConfig): number {
    const maxPower = config.max_power || 1000;
    return maxPower * (0.4 + Math.random() * 0.3);
  }

  private getBaseSound(type: NodeType): number {
    const sounds: Record<NodeType, number> = {
      server: 65,
      motor: 72,
      transformer: 55,
      pump: 60,
      compressor: 78,
      sensor: 30,
    };
    return sounds[type] + (Math.random() - 0.5) * 5;
  }

  injectFault(nodeId: string, faultType: string, intensity: number): void {
    const node = this.nodes.find((n) => n.id === nodeId);
    if (!node) return;
    node.faultActive = true;
    node.faultType = faultType;
    node.faultIntensity = intensity;
  }

  clearFault(nodeId: string): void {
    const node = this.nodes.find((n) => n.id === nodeId);
    if (!node) return;
    node.faultActive = false;
    node.faultType = null;
    node.faultIntensity = 0;
  }

  start(intervalMs: number = 2000): void {
    if (this.intervalId) return;
    this.intervalId = setInterval(() => this.tick(), intervalMs);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  subscribe(listener: (telemetry: LiveTelemetry[]) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private tick(): void {
    this.tickCount++;
    const readings: LiveTelemetry[] = this.nodes.map((node) => {
      const noise = (Math.random() - 0.5) * 2;
      let temp = node.baseTemp + noise;
      let vibration = node.baseVibration + noise * 0.3;
      let power = node.basePower + noise * 50;
      let sound = node.baseSound + noise * 2;

      if (node.faultActive && node.faultType) {
        const fi = node.faultIntensity;
        if (node.faultType === 'temperature_spike') temp += 20 * fi;
        if (node.faultType === 'vibration_surge') vibration += 3 * fi;
        if (node.faultType === 'power_loss') power *= 1 - 0.6 * fi;
        if (node.faultType === 'acoustic_noise') sound += 20 * fi;
        if (node.faultType === 'network_partition') {
          temp += 5 * fi;
          power *= 0.8;
        }
      }

      const maxTemp = node.config.max_temp || 80;
      const maxVib = node.config.max_vibration || 5;
      const tempAnomaly = temp > maxTemp * 0.9 ? (temp - maxTemp * 0.9) / (maxTemp * 0.1) : 0;
      const vibAnomaly = vibration > maxVib * 0.8 ? (vibration - maxVib * 0.8) / (maxVib * 0.2) : 0;
      const rawAnomaly = Math.max(tempAnomaly, vibAnomaly);
      const anomalyScore = Math.min(1, rawAnomaly);
      const isAnomalous = anomalyScore > 0.6;

      const swarmTotal = 5 + Math.floor(Math.random() * 3);
      const swarmVotes = isAnomalous
        ? Math.ceil(swarmTotal * (0.7 + Math.random() * 0.25))
        : Math.floor(swarmTotal * Math.random() * 0.3);

      return {
        nodeId: node.id,
        nodeName: node.name,
        sector: node.sector,
        type: node.type,
        temperature: Math.round(temp * 10) / 10,
        vibration: Math.round(vibration * 100) / 100,
        power: Math.round(power),
        sound: Math.round(sound),
        anomalyScore: Math.round(anomalyScore * 100) / 100,
        isAnomalous,
        swarmVotes,
        swarmTotal,
        timestamp: Date.now(),
      };
    });

    this.listeners.forEach((fn) => fn(readings));
  }

  getNodes(): SimNode[] {
    return [...this.nodes];
  }

  getTickCount(): number {
    return this.tickCount;
  }
}

export const edgeSimulator = new EdgeSimulator();
