import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { UserPlus, Building2, Server, Settings, Key, Check, ArrowRight, ArrowLeft, Copy } from 'lucide-react';
import type { Sector, Customer } from '@/types';

const SECTORS: { id: Sector; label: string; desc: string }[] = [
  { id: 'datacenter', label: 'Data Center', desc: 'Server racks, cooling, power distribution' },
  { id: 'factory', label: 'Factory', desc: 'Motors, pumps, compressors, production lines' },
  { id: 'powergrid', label: 'Power Grid', desc: 'Transformers, sensors, substation equipment' },
];

const STEPS = ['Organization', 'Sectors', 'Node Count', 'Configuration', 'SDK & Activation'];

export function OnboardingWizard() {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [selectedSectors, setSelectedSectors] = useState<Sector[]>([]);
  const [nodeCount, setNodeCount] = useState(10);
  const [config, setConfig] = useState({
    alerting_enabled: true,
    auto_heal: true,
    swarm_voting: true,
    human_approval_required: true,
    carbon_tracking: true,
  });
  const [createdCustomer, setCreatedCustomer] = useState<Customer | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const toggleSector = (sector: Sector) => {
    setSelectedSectors((prev) =>
      prev.includes(sector) ? prev.filter((s) => s !== sector) : [...prev, sector]
    );
  };

  const canProceed = () => {
    if (step === 0) return name.trim() && industry.trim();
    if (step === 1) return selectedSectors.length > 0;
    if (step === 2) return nodeCount > 0;
    return true;
  };

  const handleFinish = async () => {
    setCreating(true);
    setError(null);

    const sdkKey = `atlas_sk_${Math.random().toString(36).substring(2, 12)}${Math.random().toString(36).substring(2, 12)}`;

    const { data, error: insertError } = await supabase
      .from('customers')
      .insert({
        name: name.trim(),
        industry: industry.trim(),
        node_count: nodeCount,
        sectors: selectedSectors,
        config: config,
        sdk_key: sdkKey,
        status: 'active',
      })
      .select()
      .single();

    if (insertError) {
      setError(insertError.message);
      setCreating(false);
      return;
    }

    setCreatedCustomer(data as unknown as Customer);
    setStep(4);
    setCreating(false);
  };

  const copyKey = () => {
    if (createdCustomer?.sdk_key) {
      navigator.clipboard.writeText(createdCustomer.sdk_key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const reset = () => {
    setStep(0);
    setName('');
    setIndustry('');
    setSelectedSectors([]);
    setNodeCount(10);
    setCreatedCustomer(null);
  };

  const stepIcons = [Building2, Server, Settings, Key, Check];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
          <UserPlus className="w-5 h-5 text-cyan-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-atlas-text">FDE Customer Onboarding</h2>
          <p className="text-sm text-atlas-text-secondary">Provision a new fleet on the ATLAS platform</p>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-6">
        {STEPS.map((label, idx) => {
          const Icon = stepIcons[idx];
          const isDone = idx < step;
          const isCurrent = idx === step;
          return (
            <div key={label} className="flex items-center flex-1">
              <div className={`flex items-center gap-2 ${isCurrent ? 'flex-1' : ''}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                  isDone ? 'bg-emerald-500/20 text-emerald-400' :
                  isCurrent ? 'bg-cyan-500/20 text-cyan-400 ring-2 ring-cyan-500/30' :
                  'bg-atlas-bg-tertiary text-atlas-text-secondary'
                }`}>
                  {isDone ? <Check className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                </div>
                <span className={`text-xs hidden sm:inline ${isCurrent ? 'text-atlas-text' : 'text-atlas-text-secondary'}`}>
                  {label}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div className={`h-px flex-1 mx-2 ${isDone ? 'bg-emerald-500/30' : 'bg-atlas-border/30'}`} />
              )}
            </div>
          );
        })}
      </div>

      <div className="atlas-card p-6">
        {step === 0 && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <label className="text-sm text-atlas-text-secondary mb-1.5 block">Organization Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Acme Industries"
                className="atlas-input w-full"
              />
            </div>
            <div>
              <label className="text-sm text-atlas-text-secondary mb-1.5 block">Industry</label>
              <input
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="Manufacturing, Energy, Cloud Services..."
                className="atlas-input w-full"
              />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-3 animate-fade-in">
            <p className="text-sm text-atlas-text-secondary mb-3">Select the infrastructure sectors to monitor:</p>
            {SECTORS.map((sector) => {
              const selected = selectedSectors.includes(sector.id);
              return (
                <button
                  key={sector.id}
                  onClick={() => toggleSector(sector.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    selected ? 'border-cyan-500/40 bg-cyan-500/5' : 'border-atlas-border/30 hover:border-atlas-border'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-atlas-text">{sector.label}</p>
                      <p className="text-xs text-atlas-text-secondary">{sector.desc}</p>
                    </div>
                    <div className={`w-5 h-5 rounded border ${selected ? 'bg-cyan-500/20 border-cyan-500/40' : 'border-atlas-border'}`}>
                      {selected && <Check className="w-3.5 h-3.5 text-cyan-400 mx-auto" />}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <label className="text-sm text-atlas-text-secondary mb-2 block">
                Expected Node Count: <span className="text-atlas-text font-bold">{nodeCount}</span>
              </label>
              <input
                type="range"
                min={5}
                max={100}
                step={5}
                value={nodeCount}
                onChange={(e) => setNodeCount(parseInt(e.target.value))}
                className="w-full accent-cyan-500"
              />
              <div className="flex justify-between text-xs text-atlas-text-secondary mt-1">
                <span>5 nodes</span>
                <span>100 nodes</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[10, 25, 50].map((n) => (
                <button
                  key={n}
                  onClick={() => setNodeCount(n)}
                  className={`py-2 rounded-lg text-sm border transition-colors ${
                    nodeCount === n ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-400' : 'border-atlas-border/30 text-atlas-text-secondary'
                  }`}
                >
                  {n} nodes
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3 animate-fade-in">
            <p className="text-sm text-atlas-text-secondary mb-3">Platform configuration:</p>
            {Object.entries(config).map(([key, value]) => (
              <label key={key} className="flex items-center justify-between p-3 rounded-lg border border-atlas-border/30 cursor-pointer hover:border-atlas-border transition-colors">
                <div>
                  <p className="text-sm font-medium text-atlas-text capitalize">
                    {key.replace(/_/g, ' ')}
                  </p>
                </div>
                <button
                  onClick={() => setConfig({ ...config, [key]: !value })}
                  className={`relative w-11 h-6 rounded-full transition-colors ${value ? 'bg-cyan-500' : 'bg-atlas-bg-tertiary'}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${value ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </label>
            ))}
          </div>
        )}

        {step === 4 && createdCustomer && (
          <div className="space-y-4 animate-fade-in text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto">
              <Check className="w-8 h-8 text-emerald-400" />
            </div>
            <h3 className="text-lg font-semibold text-atlas-text">Fleet Activated</h3>
            <p className="text-sm text-atlas-text-secondary">
              {createdCustomer.name} is now provisioned on ATLAS with {createdCustomer.node_count} nodes across {createdCustomer.sectors.length} sector(s).
            </p>

            <div className="text-left mt-4">
              <label className="text-xs text-atlas-text-secondary mb-1.5 block">SDK API Key</label>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={createdCustomer.sdk_key || ''}
                  className="atlas-input flex-1 font-mono text-xs"
                />
                <button
                  onClick={copyKey}
                  className="px-3 rounded-lg atlas-card text-atlas-text-secondary hover:text-cyan-400 transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="text-left mt-3 atlas-card p-3">
              <p className="text-xs text-atlas-text-secondary mb-1">Integration snippet:</p>
              <pre className="text-xs font-mono text-cyan-400 overflow-x-auto">
{`import { AtlasClient } from '@atlas/sdk';

const atlas = new AtlasClient({
  apiKey: '${createdCustomer.sdk_key}',
  sectors: ${JSON.stringify(createdCustomer.sectors)},
});

atlas.connect(); // starts telemetry stream`}
              </pre>
            </div>

            <button
              onClick={reset}
              className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors mt-2"
            >
              Onboard another customer
            </button>
          </div>
        )}

        {error && (
          <p className="text-sm text-red-400 mt-3">{error}</p>
        )}

        {step < 4 && (
          <div className="flex justify-between mt-6 pt-4 border-t border-atlas-border/30">
            <button
              onClick={() => setStep(Math.max(0, step - 1))}
              disabled={step === 0}
              className="flex items-center gap-1.5 px-4 py-2 text-sm text-atlas-text-secondary hover:text-atlas-text transition-colors disabled:opacity-40"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            {step < 3 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={!canProceed()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-500/20 text-cyan-400 text-sm font-medium hover:bg-cyan-500/30 transition-colors disabled:opacity-40"
              >
                Next <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleFinish}
                disabled={creating || !canProceed()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 text-sm font-medium hover:bg-emerald-500/30 transition-colors disabled:opacity-40"
              >
                {creating ? 'Provisioning...' : 'Activate Fleet'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
