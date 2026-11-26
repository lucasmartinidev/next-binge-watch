import { useI18n } from '@/hooks/useI18n';
import type { CrewMember } from '@/types/series';
import { PersonCreditCard } from './PersonCreditCard';

export function CrewGrid({ crew }: { crew: CrewMember[] | null }) {
  const { t } = useI18n();
  if (crew === null) {
    return null;
  }
  return (
    <section aria-labelledby="crew-heading" className="space-y-3">
      <h2 id="crew-heading" className="text-lg font-bold text-foreground">{t('seriesCrewHeading')}</h2>
      {crew.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('seriesNoCrew')}</p>
      ) : (
        <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {crew.map((member) => (
            <li key={`${member.personId}-${member.role}`}>
              <PersonCreditCard personId={member.personId} name={member.name} imageUrl={member.imageUrl} roleLabel={member.role} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
