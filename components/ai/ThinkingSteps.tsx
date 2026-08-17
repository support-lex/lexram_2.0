import { CheckCircle2, Circle, Loader2 } from 'lucide-react';

export interface ThinkingStep {
  label: string;
  detail?: string;
}

interface ThinkingStepsProps {
  steps: ThinkingStep[];
  isActive: boolean;
  onComplete?: () => void;
  currentStepIndex: number;
}

export default function ThinkingSteps({ steps, isActive, currentStepIndex }: ThinkingStepsProps) {
  if (!isActive) return null;

  return (
    <div className="bg-[var(--surface-glass)] backdrop-blur-xl border border-[var(--surface-glass-border)] rounded-2xl p-6 shadow-sm mb-6 animate-in fade-in duration-500">
      <h3 className="text-sm font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin text-[var(--accent)]" />
        AI is thinking...
      </h3>
      <div className="space-y-4">
        {steps.map((step, index) => {
          const isComplete = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;
          const isPending = index > currentStepIndex;

          return (
            <div key={index} className={`flex items-start gap-3 transition-opacity duration-300 ${isPending ? 'opacity-40' : 'opacity-100'}`}>
              <div className="mt-0.5 shrink-0">
                {isComplete ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                ) : isCurrent ? (
                  <div className="w-4 h-4 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
                ) : (
                  <Circle className="w-4 h-4 text-[var(--text-muted)]" />
                )}
              </div>
              <div>
                <p className={`text-sm font-medium ${isCurrent ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
                  {step.label}
                </p>
                {step.detail && (isComplete || isCurrent) && (
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">{step.detail}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
