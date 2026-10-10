import { OnboardingWizard } from '@/components/fde/OnboardingWizard';
import { UserPlus } from 'lucide-react';

export function OnboardingPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
          <UserPlus className="w-5 h-5 text-cyan-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-atlas-text">FDE Onboarding</h1>
          <p className="text-sm text-atlas-text-secondary">Provision new customers and generate SDK credentials</p>
        </div>
      </div>

      <OnboardingWizard />
    </div>
  );
}
