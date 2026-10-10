import { useMemo } from 'react';
import type { CausalEvent } from '@/types';
import { GitBranch, ArrowRight, Circle } from 'lucide-react';

interface CausalGraphProps {
  events: CausalEvent[];
}

export function CausalGraph({ events }: CausalGraphProps) {
  const maxOffset = useMemo(() => Math.max(...events.map((e) => e.ts_offset), 1), [events]);

  return (
    <div className="atlas-card p-4">
      <div className="flex items-center gap-2 mb-4">
        <GitBranch className="w-4 h-4 text-cyan-400" />
        <h3 className="text-sm font-semibold text-atlas-text">Causal Event Chain</h3>
      </div>

      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-px bg-gradient-to-b from-cyan-500/50 via-amber-500/50 to-emerald-500/50" />

        <div className="space-y-1">
          {events.map((event, idx) => {
            const confidenceColor =
              event.confidence > 0.85 ? 'text-emerald-400' :
              event.confidence > 0.6 ? 'text-amber-400' :
              'text-red-400';

            const dotColor =
              event.confidence > 0.85 ? 'bg-emerald-500' :
              event.confidence > 0.6 ? 'bg-amber-500' :
              'bg-red-500';

            return (
              <div key={idx} className="flex items-start gap-3 py-2.5 group">
                <div className={`w-3 h-3 rounded-full ${dotColor} mt-1 z-10 shrink-0 ring-4 ring-atlas-bg-secondary transition-transform group-hover:scale-125`} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-atlas-text font-mono">
                      {event.event}
                    </span>
                    <span className="text-xs text-atlas-text-secondary">
                      +{event.ts_offset}s
                    </span>
                    <span className={`text-xs font-mono ${confidenceColor}`}>
                      {(event.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  <p className="text-xs text-atlas-text-secondary mt-1">{event.detail}</p>
                  <p className="text-xs text-cyan-400/70 mt-0.5 font-mono">{event.node}</p>
                </div>

                {idx < events.length - 1 && (
                  <ArrowRight className="w-3 h-3 text-atlas-text-secondary mt-2 shrink-0 opacity-30" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-atlas-border/30 flex items-center justify-between text-xs">
        <span className="text-atlas-text-secondary">Total chain duration: {maxOffset}s</span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-atlas-text-secondary">
            <Circle className="w-2 h-2 fill-emerald-500 text-emerald-500" /> High confidence
          </span>
          <span className="flex items-center gap-1 text-atlas-text-secondary">
            <Circle className="w-2 h-2 fill-amber-500 text-amber-500" /> Medium
          </span>
          <span className="flex items-center gap-1 text-atlas-text-secondary">
            <Circle className="w-2 h-2 fill-red-500 text-red-500" /> Low
          </span>
        </div>
      </div>
    </div>
  );
}
