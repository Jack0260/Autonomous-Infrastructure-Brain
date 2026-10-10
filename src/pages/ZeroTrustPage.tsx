import type { EdgeNode } from '@/types';
import { AttestationPanel } from '@/components/zero-trust/AttestationPanel';
import { ShieldCheck } from 'lucide-react';

interface ZeroTrustPageProps {
  nodes: EdgeNode[];
}

export function ZeroTrustPage({ nodes }: ZeroTrustPageProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-atlas-text">Zero-Trust Fabric</h1>
          <p className="text-sm text-atlas-text-secondary">Device attestation, signed events, and identity verification</p>
        </div>
      </div>

      <AttestationPanel nodes={nodes} />
    </div>
  );
}
