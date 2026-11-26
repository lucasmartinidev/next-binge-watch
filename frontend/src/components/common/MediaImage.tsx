import { Film, User } from 'lucide-react';

type MediaImageProps = {
  src: string | null;
  alt: string;
  variant: 'series' | 'person';
  className?: string;
};

export function MediaImage({ src, alt, variant, className = 'h-48 w-36' }: MediaImageProps) {
  if (src) {
    return <img src={src} alt={alt} className={`rounded-lg border border-ds-border object-cover bg-ds-elevated ${className}`} loading="lazy" />;
  }
  const Icon = variant === 'person' ? User : Film;
  return (
    <div role="img" aria-label={alt} className={`flex items-center justify-center rounded-lg border border-ds-border bg-ds-elevated text-ds-muted ${className}`}>
      <Icon className="h-8 w-8" aria-hidden="true" />
    </div>
  );
}
