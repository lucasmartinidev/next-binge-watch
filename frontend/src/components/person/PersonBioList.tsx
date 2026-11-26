import { useI18n } from '@/hooks/useI18n';
import type { PersonProfile } from '@/types/person';

export function PersonBioList({ person }: { person: PersonProfile }) {
  const { t } = useI18n();
  const entries = [
    { label: t('personCountry'), value: person.country },
    { label: t('personBirthday'), value: person.birthday },
    { label: t('personDeathday'), value: person.deathday },
    { label: t('personGender'), value: person.gender },
  ].filter((entry) => entry.value !== null);
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
      {entries.map((entry) => (
        <div key={entry.label}>
          <dt className="font-mono text-xs font-medium uppercase tracking-wider text-ds-muted">{entry.label}</dt>
          <dd className="font-medium text-ds-text">{entry.value}</dd>
        </div>
      ))}
    </dl>
  );
}
