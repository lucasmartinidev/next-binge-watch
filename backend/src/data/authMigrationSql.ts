export const OWNED_TABLES = [
  'watchlist_items',
  'watched_episodes',
  'user_lists',
  'custom_list_series',
  'custom_list_people',
  'user_preferences',
] as const;

export const LEGACY_DROP_SQL = `
  ALTER TABLE custom_list_series DROP CONSTRAINT IF EXISTS custom_list_series_list_id_fkey;
  ALTER TABLE custom_list_series DROP CONSTRAINT IF EXISTS custom_list_series_series_id_fkey;
  ALTER TABLE custom_list_people DROP CONSTRAINT IF EXISTS custom_list_people_list_id_fkey;
  ALTER TABLE watched_episodes DROP CONSTRAINT IF EXISTS watched_episodes_series_id_fkey;
  ALTER TABLE watched_episodes DROP CONSTRAINT IF EXISTS watched_episodes_pkey;
  ALTER TABLE watchlist_items DROP CONSTRAINT IF EXISTS watchlist_items_pkey;
  ALTER TABLE user_preferences DROP CONSTRAINT IF EXISTS user_preferences_pkey;
  ALTER TABLE user_lists DROP CONSTRAINT IF EXISTS user_lists_system_key_key;
  DROP INDEX IF EXISTS idx_watchlist_items_status_updated;
  DROP INDEX IF EXISTS idx_user_lists_name_lower;
  DROP INDEX IF EXISTS idx_user_lists_entity_type;
  DROP INDEX IF EXISTS idx_custom_list_people_person_id;
`;

export const MULTI_USER_CONSTRAINTS_SQL = `
  UPDATE user_lists SET id = gen_random_uuid()::text WHERE is_system = TRUE;
  ALTER TABLE watchlist_items ADD CONSTRAINT watchlist_items_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  ALTER TABLE watchlist_items ADD CONSTRAINT watchlist_items_pkey PRIMARY KEY (user_id, series_id);
  CREATE INDEX idx_watchlist_items_status_updated ON watchlist_items (user_id, status, updated_at DESC);
  ALTER TABLE watched_episodes ADD CONSTRAINT watched_episodes_pkey PRIMARY KEY (user_id, series_id, episode_id);
  ALTER TABLE watched_episodes ADD CONSTRAINT watched_episodes_user_series_fkey FOREIGN KEY (user_id, series_id) REFERENCES watchlist_items(user_id, series_id) ON DELETE CASCADE;
  ALTER TABLE user_lists ADD CONSTRAINT user_lists_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  ALTER TABLE user_lists ADD CONSTRAINT user_lists_id_user_unique UNIQUE (id, user_id);
  CREATE UNIQUE INDEX idx_user_lists_user_name_lower ON user_lists (user_id, LOWER(name));
  CREATE UNIQUE INDEX idx_user_lists_user_system_key ON user_lists (user_id, system_key) WHERE system_key IS NOT NULL;
  CREATE INDEX idx_user_lists_entity_type ON user_lists (user_id, entity_type, is_system DESC, updated_at DESC);
  ALTER TABLE custom_list_series ADD CONSTRAINT custom_list_series_list_user_fkey FOREIGN KEY (list_id, user_id) REFERENCES user_lists(id, user_id) ON DELETE CASCADE;
  ALTER TABLE custom_list_series ADD CONSTRAINT custom_list_series_user_series_fkey FOREIGN KEY (user_id, series_id) REFERENCES watchlist_items(user_id, series_id) ON DELETE CASCADE;
  ALTER TABLE custom_list_people ADD CONSTRAINT custom_list_people_list_user_fkey FOREIGN KEY (list_id, user_id) REFERENCES user_lists(id, user_id) ON DELETE CASCADE;
  CREATE INDEX idx_custom_list_people_user_person ON custom_list_people (user_id, person_id);
  ALTER TABLE user_preferences ADD CONSTRAINT user_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  ALTER TABLE user_preferences ADD CONSTRAINT user_preferences_pkey PRIMARY KEY (user_id, key);
`;

export const DOWN_DROP_SQL = `
  DELETE FROM user_lists WHERE user_id <> (SELECT id FROM users ORDER BY created_at ASC LIMIT 1);
  DELETE FROM watchlist_items WHERE user_id <> (SELECT id FROM users ORDER BY created_at ASC LIMIT 1);
  DELETE FROM user_preferences WHERE user_id <> (SELECT id FROM users ORDER BY created_at ASC LIMIT 1);
  ALTER TABLE custom_list_series DROP CONSTRAINT IF EXISTS custom_list_series_list_user_fkey;
  ALTER TABLE custom_list_series DROP CONSTRAINT IF EXISTS custom_list_series_user_series_fkey;
  ALTER TABLE custom_list_people DROP CONSTRAINT IF EXISTS custom_list_people_list_user_fkey;
  ALTER TABLE watched_episodes DROP CONSTRAINT IF EXISTS watched_episodes_user_series_fkey;
  ALTER TABLE watched_episodes DROP CONSTRAINT IF EXISTS watched_episodes_pkey;
  ALTER TABLE watchlist_items DROP CONSTRAINT IF EXISTS watchlist_items_pkey;
  ALTER TABLE user_preferences DROP CONSTRAINT IF EXISTS user_preferences_pkey;
  ALTER TABLE user_lists DROP CONSTRAINT IF EXISTS user_lists_id_user_unique;
  DROP INDEX IF EXISTS idx_watchlist_items_status_updated;
  DROP INDEX IF EXISTS idx_user_lists_user_name_lower;
  DROP INDEX IF EXISTS idx_user_lists_user_system_key;
  DROP INDEX IF EXISTS idx_user_lists_entity_type;
  DROP INDEX IF EXISTS idx_custom_list_people_user_person;
  UPDATE user_lists SET id = system_key WHERE is_system = TRUE AND system_key IS NOT NULL;
`;

export const DOWN_RESTORE_SQL = `
  ALTER TABLE watchlist_items ADD CONSTRAINT watchlist_items_pkey PRIMARY KEY (series_id);
  CREATE INDEX idx_watchlist_items_status_updated ON watchlist_items (status, updated_at DESC);
  ALTER TABLE watched_episodes ADD CONSTRAINT watched_episodes_pkey PRIMARY KEY (series_id, episode_id);
  ALTER TABLE watched_episodes ADD CONSTRAINT watched_episodes_series_id_fkey FOREIGN KEY (series_id) REFERENCES watchlist_items(series_id) ON DELETE CASCADE;
  ALTER TABLE user_lists ADD CONSTRAINT user_lists_system_key_key UNIQUE (system_key);
  CREATE UNIQUE INDEX idx_user_lists_name_lower ON user_lists (LOWER(name));
  CREATE INDEX idx_user_lists_entity_type ON user_lists (entity_type, is_system DESC, updated_at DESC);
  ALTER TABLE custom_list_series ADD CONSTRAINT custom_list_series_list_id_fkey FOREIGN KEY (list_id) REFERENCES user_lists(id) ON DELETE CASCADE;
  ALTER TABLE custom_list_series ADD CONSTRAINT custom_list_series_series_id_fkey FOREIGN KEY (series_id) REFERENCES watchlist_items(series_id) ON DELETE CASCADE;
  ALTER TABLE custom_list_people ADD CONSTRAINT custom_list_people_list_id_fkey FOREIGN KEY (list_id) REFERENCES user_lists(id) ON DELETE CASCADE;
  CREATE INDEX idx_custom_list_people_person_id ON custom_list_people (person_id);
  ALTER TABLE user_preferences ADD CONSTRAINT user_preferences_pkey PRIMARY KEY (key);
`;
