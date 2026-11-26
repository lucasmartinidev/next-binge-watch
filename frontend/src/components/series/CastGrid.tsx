import { useI18n } from '@/hooks/useI18n';
import type { CastMember } from '@/types/series';
import { PersonCreditCard } from './PersonCreditCard';

export function CastGrid({ cast }: { cast: CastMember[] }) {
  const { t } = useI18n();
  return (
    <section aria-labelledby="cast-heading" className="space-y-3">
      <h2 id="cast-heading" className="text-lg font-bold text-foreground">{t('seriesCastHeading')}</h2>
      {cast.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('seriesNoCast')}</p>
      ) : (
        <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {cast.map((member) => (
            <li key={`${member.personId}-${member.characterName}`}>
              <PersonCreditCard personId={member.personId} name={member.name} imageUrl={member.imageUrl} roleLabel={member.characterName} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
