import type { ListMembershipRepository, StoredCustomListPerson } from '../data/listMembershipRepository';
import type { UserListRepository } from '../data/userListRepository';
import type { WatchlistRepository } from '../data/watchlistRepository';
import { InMemoryListMembershipRepository } from './inMemoryListMembershipRepository';
import { InMemoryUserListRepository } from './inMemoryUserListRepository';

export function createInMemoryListRepositories(watchlistRepo: WatchlistRepository): {
  userListRepo: UserListRepository;
  membershipRepo: ListMembershipRepository;
} {
  const seriesLinks = new Map<number, Set<string>>();
  const peopleLinks = new Map<string, StoredCustomListPerson>();
  const userListRepo = new InMemoryUserListRepository(watchlistRepo, seriesLinks, peopleLinks);
  const membershipRepo = new InMemoryListMembershipRepository({ watchlistRepo, userListRepo, seriesLinks, peopleLinks });
  return {
    userListRepo: userListRepo as unknown as UserListRepository,
    membershipRepo: membershipRepo as unknown as ListMembershipRepository,
  };
}
