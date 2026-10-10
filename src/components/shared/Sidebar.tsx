import { NAV_ITEMS } from './navItems';
import { ThemeToggle } from './ThemeToggle';
import { Brain, AlertTriangle } from 'lucide-react';

interface SidebarProps {
  activePage: string;
  onNavigate: (pageId: string) => void;
  pendingApprovals: number;
  activeIncidents: number;
}

export function Sidebar({ activePage, onNavigate, pendingApprovals, activeIncidents }: SidebarProps) {
  return (
    <aside className="w-64 shrink-0 h-screen sticky top-0 flex flex-col border-r border-atlas-border/50 bg-atlas-bg-secondary">
      <div className="px-4 py-5 flex items-center gap-3 border-b border-atlas-border/50">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center">
          <Brain className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-atlas-text tracking-wide">ATLAS</h1>
          <p className="text-xs text-atlas-text-secondary">Infrastructure Brain</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-thin py-3 px-2 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          const badge =
            item.id === 'ops' && activeIncidents > 0
              ? activeIncidents
              : item.id === 'ops' && pendingApprovals > 0
                ? pendingApprovals
                : null;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 group ${
                isActive
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                  : 'text-atlas-text-secondary hover:bg-atlas-bg-tertiary hover:text-atlas-text border border-transparent'
              }`}
              title={item.description}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-cyan-400' : ''}`} />
              <span className="flex-1 text-left font-medium">{item.label}</span>
              {badge !== null && (
                <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="px-3 py-3 border-t border-atlas-border/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-glow" />
          <span className="text-xs text-atlas-text-secondary">System Active</span>
        </div>
        <ThemeToggle />
      </div>
    </aside>
  );
}
