import {
  LayoutDashboard,
  Boxes,
  Activity,
  GitBranch,
  Zap,
  ShieldCheck,
  UserPlus,
  ScrollText,
} from 'lucide-react';
import type { ComponentType } from 'react';

export interface NavItem {
  id: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  description: string;
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, description: 'System-wide health and KPIs' },
  { id: 'twin', label: 'Digital Twin', icon: Boxes, description: '3D real-time infrastructure mirror' },
  { id: 'ops', label: 'Ops Console', icon: Activity, description: 'Incidents, approvals, audit trail' },
  { id: 'causal', label: 'Causal Explorer', icon: GitBranch, description: 'Event graphs and explainability' },
  { id: 'chaos', label: 'Chaos Lab', icon: Zap, description: 'Fault injection and blast radius' },
  { id: 'zerotrust', label: 'Zero-Trust', icon: ShieldCheck, description: 'Attestation and security posture' },
  { id: 'onboarding', label: 'FDE Onboarding', icon: UserPlus, description: 'Customer onboarding wizard' },
  { id: 'audit', label: 'Audit Trail', icon: ScrollText, description: 'Immutable audit log' },
];
