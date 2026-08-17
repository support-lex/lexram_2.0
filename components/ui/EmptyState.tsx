import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    action?: {
        label: string;
        onClick: () => void;
    };
    actionLabel?: string;
    onAction?: () => void;
}

export default function EmptyState({ icon: Icon, title, description, action, actionLabel, onAction }: EmptyStateProps) {
    const handleAction = action?.onClick || onAction;
    const label = action?.label || actionLabel;
    return (
        <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
            <div className="w-16 h-16 bg-[var(--bg-primary)] rounded-2xl flex items-center justify-center mb-6">
                <Icon className="w-8 h-8 text-[var(--text-muted)]" />
            </div>
            <h3 className="font-sans text-lg font-bold text-[var(--text-primary)] mb-2">{title}</h3>
            <p className="font-sans text-sm text-[var(--text-secondary)] max-w-sm mb-6">{description}</p>
            {label && handleAction && (
                <button
                    onClick={handleAction}
                    className="bg-[var(--bg-sidebar)] text-[var(--text-on-sidebar)] px-5 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity shadow-sm"
                >
                    {label}
                </button>
            )}
        </div>
    );
}
