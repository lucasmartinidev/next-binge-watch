import { useI18n } from '@/hooks/useI18n';
import type { PersonSeriesCredit } from '@/types/person';
import { SeriesCreditCard } from './SeriesCreditCard';

type PersonCreditsListProps = {
  heading: string;
  credits: PersonSeriesCredit[] | null;
};

export function PersonCreditsList({ heading, credits }: PersonCreditsListProps) {
  const { t } = useI18n();
  if (credits === null) {
    return null;
  }
  return (
    <section aria-label={heading} className="space-y-3">
      <h2 className="text-lg font-bold text-foreground">{heading}</h2>
      {credits.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('personNoCredits')}</p>
      ) : (
        <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {credits.map((credit) => (
            <li key={`${credit.creditType}-${credit.seriesId}-${credit.role}`}>
              <SeriesCreditCard credit={credit} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
