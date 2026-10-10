// ============================================================
// ATLAS — Core Type System
// ============================================================

export type NodeStatus = 'online' | 'offline' | 'degraded' | 'isolated' | 'maintenance';
export type NodeType = 'server' | 'motor' | 'transformer' | 'pump' | 'compressor' | 'sensor';
export type Sector = 'datacenter' | 'factory' | 'powergrid';
export type Severity = 'low' | 'medium' | 'high' | 'critical';
export type IncidentStatus = 'active' | 'investigating' | 'healing' | 'resolved' | 'dismissed';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'executed' | 'failed';
export type ActionType = 'throttle' | 'isolate' | 'failover' | 'restart' | 'notify' | 'shutdown';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type CustomerStatus = 'onboarding' | 'active' | 'suspended' | 'churned';

export interface EdgeNode {
  id: string;
  name: string;
  type: NodeType;
  sector: Sector;
  location: string | null;
  status: NodeStatus;
  health_score: number;
  attested: boolean;
  signing_key_id: string | null;
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface TelemetryReading {
  id: number;
  node_id: string;
  temperature: number | null;
  vibration: number | null;
  power: number | null;
  sound: number | null;
  anomaly_score: number;
  is_anomalous: boolean;
  swarm_votes: number;
  swarm_total: number;
  ts: number;
}

export interface CausalEvent {
  event: string;
  node: string;
  ts_offset: number;
  detail: string;
  confidence: number;
}

export interface Incident {
  id: string;
  node_id: string | null;
  severity: Severity;
  status: IncidentStatus;
  title: string;
  description: string | null;
  causal_chain: CausalEvent[];
  action_taken: string | null;
  mttr_seconds: number | null;
  created_at: string;
  resolved_at: string | null;
}

export interface Approval {
  id: string;
  incident_id: string;
  action_type: ActionType;
  action_params: Record<string, unknown>;
  risk_level: RiskLevel;
  status: ApprovalStatus;
  decided_by: string | null;
  decided_at: string | null;
  execution_result: Record<string, unknown> | null;
  created_at: string;
}

export interface AuditEntry {
  id: number;
  entity_type: string;
  entity_id: string | null;
  action: string;
  actor: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface Policy {
  id: string;
  name: string;
  description: string | null;
  enabled: boolean;
  conditions: PolicyCondition;
  action: PolicyAction;
  priority: number;
  created_at: string;
  updated_at: string;
}

export interface PolicyCondition {
  metric: string;
  operator: '>' | '<' | '>=' | '<=' | '==';
  threshold: number;
  node_type?: NodeType;
  duration_seconds?: number;
  severity?: Severity;
}

export interface PolicyAction {
  type: ActionType;
  params: Record<string, unknown>;
}

export interface Customer {
  id: string;
  name: string;
  industry: string;
  node_count: number;
  sectors: Sector[];
  config: Record<string, unknown>;
  sdk_key: string | null;
  status: CustomerStatus;
  created_at: string;
  updated_at: string;
}

// ============================================================
// Simulation / Runtime Types
// ============================================================

export interface LiveTelemetry {
  nodeId: string;
  nodeName: string;
  sector: Sector;
  type: NodeType;
  temperature: number;
  vibration: number;
  power: number;
  sound: number;
  anomalyScore: number;
  isAnomalous: boolean;
  swarmVotes: number;
  swarmTotal: number;
  timestamp: number;
}

export interface SwarmVote {
  voterId: string;
  voterName: string;
  targetId: string;
  vote: boolean;
  confidence: number;
  reason: string;
}

export interface FaultInjection {
  id: string;
  nodeId: string;
  faultType: 'temperature_spike' | 'vibration_surge' | 'power_loss' | 'acoustic_noise' | 'network_partition';
  intensity: number;
  duration: number;
  blastRadius: string[];
  timestamp: number;
}

export interface KPIs {
  mttr: number;
  mttrReduction: number;
  falsePositiveRate: number;
  falsePositiveReduction: number;
  uptime: number;
  costSaved: number;
  carbonSaved: number;
  activeIncidents: number;
  resolvedIncidents: number;
  totalNodes: number;
  healthyNodes: number;
  degradedNodes: number;
}

export interface MetricsSummary {
  systemHealth: number;
  nodesOnline: number;
  nodesDegraded: number;
  nodesOffline: number;
  activeIncidents: number;
  pendingApprovals: number;
  policiesActive: number;
  swarmConsensusRate: number;
  attestationRate: number;
}

export interface NavigationItem {
  id: string;
  label: string;
  icon: string;
  description: string;
}
