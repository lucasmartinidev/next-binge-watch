import { ExternalLink, ListChecks } from 'lucide-react';
import { MediaImage } from '@/components/common/MediaImage';
import { HudPanel } from '@/components/ds/HudPanel';
import { NeonButton } from '@/components/ds/NeonButton';
import { ListMembershipBadges } from '@/components/lists/ListMembershipBadges';
import { useI18n } from '@/hooks/useI18n';
import type { PersonProfile } from '@/types/person';
import { PersonBioList } from './PersonBioList';

export function PersonHeader({ person, onManageLists }: { person: PersonProfile; onManageLists?: () => void }) {
  const { t } = useI18n();
  return (
    <HudPanel as="section" genreTheme="person" className="flex flex-col gap-6 p-6 shadow-neon sm:flex-row">
      <MediaImage src={person.imageUrl} alt={person.name} variant="person" className="h-64 w-44 shrink-0 self-center border-ds-accent/50 sm:self-start" />
      <div className="flex-1 space-y-4">
        <h1 className="font-display text-3xl font-bold tracking-tight text-ds-text sm:text-4xl">{person.name}</h1>
        <ListMembershipBadges lists={person.lists} />
        <PersonBioList person={person} />
        <div className="flex flex-wrap items-center gap-3">
          {onManageLists ? (
            <NeonButton variant="secondary" onClick={onManageLists}>
              <ListChecks className="h-4 w-4" aria-hidden="true" />
              <span>{t('listManageAction')}</span>
            </NeonButton>
          ) : null}
          <a href={person.tvmazeUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded text-sm font-semibold text-ds-accent underline underline-offset-4 hover:brightness-125 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-accent">
            <span>{t('seriesViewOnTvmaze')}</span>
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </div>
      </div>
    </HudPanel>
  );
}
