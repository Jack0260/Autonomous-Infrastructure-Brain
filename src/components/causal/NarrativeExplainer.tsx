interface NarrativeExplainerProps {
  narrative: string;
  rootCause: string;
  confidence: number;
}

export function NarrativeExplainer({ narrative, rootCause, confidence }: NarrativeExplainerProps) {
  const confidenceColor =
    confidence > 0.85 ? 'text-emerald-400' :
    confidence > 0.6 ? 'text-amber-400' :
    'text-red-400';

  return (
    <div className="atlas-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-atlas-text">Causal Narrative</h3>
        <span className={`text-xs font-mono ${confidenceColor}`}>
          Chain confidence: {(confidence * 100).toFixed(0)}%
        </span>
      </div>

      <div className="mb-3 px-3 py-2 rounded-lg bg-cyan-500/5 border border-cyan-500/20">
        <p className="text-xs text-cyan-400 font-medium mb-0.5">Inferred Root Cause</p>
        <p className="text-sm text-atlas-text">{rootCause}</p>
      </div>

      <p className="text-sm text-atlas-text-secondary leading-relaxed">{narrative}</p>
    </div>
  );
}
