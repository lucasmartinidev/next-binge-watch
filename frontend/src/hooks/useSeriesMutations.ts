import { useCallback, type Dispatch, type SetStateAction } from 'react';
import { getSeriesProfile } from '@/services/seriesService';
import {
  addToWatchlist,
  removeFromWatchlist,
  toggleEpisodeWatched,
  toggleSeasonWatched,
  updateWatchStatus,
} from '@/services/watchlistService';
import type { Locale } from '@/types/locale';
import type { SeriesProfile } from '@/types/series';
import type { WatchStatus } from '@/types/watchlist';
import { withResetTracking, withUpdatedEpisode, withUpdatedSeason } from './seriesStateHelpers';
import { useI18n } from './useI18n';

type ProfileSetter = Dispatch<SetStateAction<SeriesProfile | null>>;

async function syncFreshLists(seriesId: number, locale: Locale, setProfile: ProfileSetter): Promise<void> {
  try {
    const fresh = await getSeriesProfile({ id: seriesId, locale });
    setProfile((prev) => (prev ? { ...prev, lists: fresh.lists } : null));
  } catch {
    return;
  }
}

export function useWatchStatusMutations(profile: SeriesProfile | null, setProfile: ProfileSetter) {
  const { locale } = useI18n();
  const setWatchStatus = useCallback(async (status: WatchStatus) => {
    if (!profile) {
      return;
    }
    const updated = profile.tracking.inWatchlist
      ? await updateWatchStatus({ seriesId: profile.id, status, locale })
      : await addToWatchlist({ seriesId: profile.id, status, locale });
    setProfile((prev) => (prev ? { ...prev, tracking: { ...prev.tracking, inWatchlist: true, status: updated.status }, lists: updated.lists ?? prev.lists } : null));
  }, [profile, locale, setProfile]);
  const remove = useCallback(async () => {
    if (!profile) {
      return;
    }
    await removeFromWatchlist(profile.id, locale);
    setProfile((prev) => (prev ? withResetTracking(prev) : null));
  }, [profile, locale, setProfile]);
  return { setWatchStatus, remove };
}

export function useEpisodeMutations(profile: SeriesProfile | null, setProfile: ProfileSetter) {
  const { locale } = useI18n();
  const toggleEpisode = useCallback(async (episodeId: number, watched: boolean) => {
    if (!profile) {
      return;
    }
    const tracking = await toggleEpisodeWatched({ seriesId: profile.id, episodeId, watched, locale });
    setProfile((prev) => (prev ? withUpdatedEpisode(prev, { episodeId, watched, tracking }) : null));
    if (tracking.status !== profile.tracking.status) {
      await syncFreshLists(profile.id, locale, setProfile);
    }
  }, [profile, locale, setProfile]);
  const toggleSeason = useCallback(async (seasonNumber: number, watched: boolean) => {
    if (!profile) {
      return;
    }
    const tracking = await toggleSeasonWatched({ seriesId: profile.id, seasonNumber, watched, locale });
    setProfile((prev) => (prev ? withUpdatedSeason(prev, { seasonNumber, watched, tracking }) : null));
    if (tracking.status !== profile.tracking.status) {
      await syncFreshLists(profile.id, locale, setProfile);
    }
  }, [profile, locale, setProfile]);
  return { toggleEpisode, toggleSeason };
}
