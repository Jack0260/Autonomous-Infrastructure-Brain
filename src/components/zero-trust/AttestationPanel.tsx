import type { EdgeNode } from '@/types';
import { ShieldCheck, ShieldAlert, KeyRound, Fingerprint, CheckCircle, XCircle } from 'lucide-react';

interface AttestationPanelProps {
  nodes: EdgeNode[];
}

export function AttestationPanel({ nodes }: AttestationPanelProps) {
  const attested = nodes.filter((n) => n.attested);
  const unattested = nodes.filter((n) => !n.attested);
  const attestationRate = nodes.length > 0 ? (attested.length / nodes.length) * 100 : 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="atlas-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span className="text-sm font-medium text-atlas-text">Attested Nodes</span>
          </div>
          <p className="text-2xl font-bold text-emerald-400">{attested.length}</p>
          <p className="text-xs text-atlas-text-secondary mt-1">
            {attestationRate.toFixed(1)}% of fleet
          </p>
        </div>

        <div className="atlas-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            <span className="text-sm font-medium text-atlas-text">Unattested</span>
          </div>
          <p className="text-2xl font-bold text-amber-400">{unattested.length}</p>
          <p className="text-xs text-atlas-text-secondary mt-1">Requires enrollment</p>
        </div>

        <div className="atlas-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <KeyRound className="w-5 h-5 text-cyan-400" />
            <span className="text-sm font-medium text-atlas-text">Signing Keys</span>
          </div>
          <p className="text-2xl font-bold text-cyan-400">{attested.length}</p>
          <p className="text-xs text-atlas-text-secondary mt-1">Active cryptographic keys</p>
        </div>
      </div>

      <div className="atlas-card p-4">
        <div className="flex items-center gap-2 mb-4">
          <Fingerprint className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-atlas-text">Node Identity Registry</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-atlas-border/30 text-xs text-atlas-text-secondary">
                <th className="text-left py-2 px-3 font-medium">Node</th>
                <th className="text-left py-2 px-3 font-medium">Sector</th>
                <th className="text-left py-2 px-3 font-medium">Status</th>
                <th className="text-left py-2 px-3 font-medium">Key ID</th>
                <th className="text-left py-2 px-3 font-medium">Attested</th>
              </tr>
            </thead>
            <tbody>
              {nodes.map((node) => (
                <tr key={node.id} className="border-b border-atlas-border/20 hover:bg-atlas-bg-tertiary/30 transition-colors">
                  <td className="py-2 px-3 font-mono text-xs text-atlas-text">{node.name}</td>
                  <td className="py-2 px-3 text-xs text-atlas-text-secondary capitalize">{node.sector}</td>
                  <td className="py-2 px-3 text-xs capitalize">
                    <span className={
                      node.status === 'online' ? 'text-emerald-400' :
                      node.status === 'degraded' ? 'text-amber-400' :
                      'text-red-400'
                    }>
                      {node.status}
                    </span>
                  </td>
                  <td className="py-2 px-3 font-mono text-xs text-cyan-400">
                    {node.signing_key_id || '-'}
                  </td>
                  <td className="py-2 px-3">
                    {node.attested ? (
                      <span className="flex items-center gap-1 text-xs text-emerald-400">
                        <CheckCircle className="w-3.5 h-3.5" /> Verified
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-amber-400">
                        <XCircle className="w-3.5 h-3.5" /> Pending
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="atlas-card p-4">
        <h3 className="text-sm font-semibold text-atlas-text mb-3">Zero-Trust Protocol</h3>
        <div className="space-y-2.5">
          <ProtocolStep
            num={1}
            title="Device Enrollment"
            desc="Each edge node registers a signing key with the ATLAS control plane during provisioning."
            status="active"
          />
          <ProtocolStep
            num={2}
            title="Challenge-Response Attestation"
            desc="Control plane issues a random challenge; node signs it with its private key to prove identity."
            status="active"
          />
          <ProtocolStep
            num={3}
            title="Event Signing"
            desc="All telemetry and anomaly events are cryptographically signed by the originating node."
            status="active"
          />
          <ProtocolStep
            num={4}
            title="Signature Verification"
            desc="Consumers verify event signatures before acting on data, preventing spoofed telemetry injection."
            status="active"
          />
        </div>
      </div>
    </div>
  );
}

function ProtocolStep({ num, title, desc, status }: { num: number; title: string; desc: string; status: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-7 h-7 rounded-full bg-cyan-500/10 flex items-center justify-center text-xs font-bold text-cyan-400 shrink-0">
        {num}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-atlas-text">{title}</p>
          <span className="text-xs text-emerald-400 capitalize">{status}</span>
        </div>
        <p className="text-xs text-atlas-text-secondary mt-0.5">{desc}</p>
      </div>
    </div>
  );
}
