import type { MouseEvent, ReactNode } from 'react';

type NeonButtonVariant = 'primary' | 'secondary' | 'danger';

type NeonButtonProps = {
  children: ReactNode;
  variant?: NeonButtonVariant;
  type?: 'button' | 'submit';
  disabled?: boolean;
  ariaLabel?: string;
  ariaPressed?: boolean;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  className?: string;
};

const VARIANT_STYLES: Record<NeonButtonVariant, string> = {
  primary: 'bg-ds-accent text-ds-ink font-semibold shadow-neon hover:brightness-110',
  secondary: 'border border-ds-border bg-ds-elevated text-ds-text hover:border-ds-accent/70 hover:text-ds-accent',
  danger: 'border border-ds-danger/50 bg-ds-danger/10 text-ds-danger hover:bg-ds-danger/20',
};

export function NeonButton({
  children, variant = 'primary', type = 'button', disabled = false,
  ariaLabel, ariaPressed, onClick, className = '',
}: NeonButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-pressed={ariaPressed}
      onClick={onClick}
      className={`min-h-[40px] inline-flex items-center justify-center gap-1.5 rounded-control px-4 py-2 text-sm transition active:scale-[0.98] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ds-void ${VARIANT_STYLES[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
