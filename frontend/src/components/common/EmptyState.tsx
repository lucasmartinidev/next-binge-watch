import { Inbox } from 'lucide-react';

type EmptyStateProps = {
  title: string;
  description: string;
};

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div role="status" aria-live="polite" className="ds-hud-panel flex flex-col items-center justify-center rounded-hud border-dashed px-6 py-10 text-center backdrop-blur-md">
      <Inbox className="mb-3 h-8 w-8 text-ds-accent" aria-hidden="true" />
      <h2 className="font-display text-base font-semibold text-ds-text">{title}</h2>
      <p className="mt-1 max-w-md text-sm text-ds-muted">{description}</p>
    </div>
  );
}
