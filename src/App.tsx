import { useState, useCallback, Suspense, lazy } from 'react';
import type { Incident } from '@/types';
import { useEdgeTelemetry } from '@/hooks/useEdgeTelemetry';
import { useIncidents } from '@/hooks/useIncidents';
import { useApprovals } from '@/hooks/useApprovals';
import { Sidebar } from '@/components/shared/Sidebar';
import { OverviewPage } from '@/pages/OverviewPage';
import { OpsConsolePage } from '@/pages/OpsConsolePage';
import { CausalExplorerPage } from '@/pages/CausalExplorerPage';
import { ZeroTrustPage } from '@/pages/ZeroTrustPage';
import { OnboardingPage } from '@/pages/OnboardingPage';
import { AuditPage } from '@/pages/AuditPage';

const DigitalTwinPage = lazy(() => import('@/pages/DigitalTwinPage').then((m) => ({ default: m.DigitalTwinPage })));
const ChaosLabPage = lazy(() => import('@/pages/ChaosLabPage').then((m) => ({ default: m.ChaosLabPage })));

function PageLoader() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-10 h-10 rounded-full border-2 border-cyan-500/30 border-t-cyan-400 animate-spin" />
    </div>
  );
}

function App() {
  const [activePage, setActivePage] = useState('overview');
  const { nodes, telemetry, loading } = useEdgeTelemetry();
  const { incidents } = useIncidents();
  const { approvals, updateApproval } = useApprovals();

  const pendingApprovals = approvals.filter((a) => a.status === 'pending').length;
  const activeIncidents = incidents.filter(
    (i) => i.status === 'active' || i.status === 'investigating' || i.status === 'healing'
  ).length;

  const handleApprove = useCallback(
    (id: string) => updateApproval(id, 'approved', 'operator'),
    [updateApproval]
  );
  const handleReject = useCallback(
    (id: string) => updateApproval(id, 'rejected', 'operator'),
    [updateApproval]
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-atlas-bg-primary">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-2 border-cyan-500/30 border-t-cyan-400 animate-spin mx-auto mb-4" />
          <p className="text-sm text-atlas-text-secondary">Initializing ATLAS infrastructure brain...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-atlas-bg-primary">
      <Sidebar
        activePage={activePage}
        onNavigate={setActivePage}
        pendingApprovals={pendingApprovals}
        activeIncidents={activeIncidents}
      />
      <main className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="p-6 max-w-7xl mx-auto">
          {activePage === 'overview' && (
            <OverviewPage
              nodes={nodes}
              telemetry={telemetry}
              incidents={incidents}
              approvals={approvals}
              onNodeSelect={() => setActivePage('twin')}
              onIncidentSelect={() => setActivePage('causal')}
            />
          )}
          {activePage === 'twin' && (
            <Suspense fallback={<PageLoader />}>
              <DigitalTwinPage nodes={nodes} telemetry={telemetry} />
            </Suspense>
          )}
          {activePage === 'ops' && (
            <OpsConsolePage
              nodes={nodes}
              telemetry={telemetry}
              incidents={incidents}
              approvals={approvals}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          )}
          {activePage === 'causal' && (
            <CausalExplorerPage incidents={incidents} nodes={nodes} telemetry={telemetry} />
          )}
          {activePage === 'chaos' && (
            <Suspense fallback={<PageLoader />}>
              <ChaosLabPage nodes={nodes} telemetry={telemetry} />
            </Suspense>
          )}
          {activePage === 'zerotrust' && (
            <ZeroTrustPage nodes={nodes} />
          )}
          {activePage === 'onboarding' && <OnboardingPage />}
          {activePage === 'audit' && <AuditPage />}
        </div>
      </main>
    </div>
  );
}

export default App;
