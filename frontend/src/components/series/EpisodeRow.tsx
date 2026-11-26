import type { EpisodeItem } from '@/types/series';

type EpisodeRowProps = {
  episode: EpisodeItem;
  onToggle: (episodeId: number, watched: boolean) => void;
};

export function EpisodeRow({ episode, onToggle }: EpisodeRowProps) {
  const code = `S${String(episode.season).padStart(2, '0')}E${String(episode.number).padStart(2, '0')}`;
  return (
    <li className="flex items-start gap-3 rounded-lg border border-ds-border bg-ds-elevated/70 px-3.5 py-2.5 transition hover:border-ds-accent/50">
      <input
        type="checkbox"
        id={`ep-${episode.id}`}
        checked={episode.watched}
        onChange={(e) => onToggle(episode.id, e.target.checked)}
        aria-label={`${code} ${episode.name}`}
        className="mt-1 h-4 w-4 rounded border-ds-border accent-ds-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-accent"
      />
      <label htmlFor={`ep-${episode.id}`} className="flex-1 cursor-pointer space-y-0.5">
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm font-medium text-ds-text">
          <span><span className="font-mono text-ds-accent">{code}</span> · {episode.name}</span>
          {episode.airdate && <span className="font-mono text-xs text-ds-muted">{episode.airdate}</span>}
        </div>
        {episode.summary && <p className="text-xs leading-relaxed text-ds-muted">{episode.summary}</p>}
      </label>
    </li>
  );
}
