import type { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

function createWatchlistItemsTable(pgm: MigrationBuilder): void {
  pgm.createTable('watchlist_items', {
    series_id: { type: 'integer', primaryKey: true },
    name: { type: 'text', notNull: true },
    localized_name_pt_br: { type: 'text' },
    image_url: { type: 'text' },
    status: {
      type: 'text',
      notNull: true,
      check: "status IN ('want_to_watch', 'watching', 'watched')",
    },
    genres: { type: 'jsonb', notNull: true, default: pgm.func("'[]'::jsonb") },
    rating: { type: 'double precision' },
    total_episodes: { type: 'integer', notNull: true, default: 0 },
    tvmaze_url: { type: 'text', notNull: true },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('NOW()') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('NOW()') },
  });
  pgm.createIndex('watchlist_items', ['status', { name: 'updated_at', sort: 'DESC' }], {
    name: 'idx_watchlist_items_status_updated',
  });
}

function createWatchedEpisodesTable(pgm: MigrationBuilder): void {
  pgm.createTable('watched_episodes', {
    series_id: {
      type: 'integer',
      notNull: true,
      references: 'watchlist_items(series_id)',
      onDelete: 'CASCADE',
    },
    episode_id: { type: 'integer', notNull: true },
    season_number: { type: 'integer', notNull: true },
    episode_number: { type: 'integer', notNull: true },
    watched_at: { type: 'timestamptz', notNull: true, default: pgm.func('NOW()') },
  });
  pgm.addConstraint('watched_episodes', 'watched_episodes_pkey', {
    primaryKey: ['series_id', 'episode_id'],
  });
  pgm.createIndex('watched_episodes', ['series_id', 'season_number', 'episode_number'], {
    name: 'idx_watched_episodes_series_order',
  });
}

function createUserPreferencesTable(pgm: MigrationBuilder): void {
  pgm.createTable('user_preferences', {
    key: { type: 'text', primaryKey: true },
    value: { type: 'text', notNull: true },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('NOW()') },
  });
}

export function up(pgm: MigrationBuilder): void {
  createWatchlistItemsTable(pgm);
  createWatchedEpisodesTable(pgm);
  createUserPreferencesTable(pgm);
}

export function down(pgm: MigrationBuilder): void {
  pgm.dropTable('user_preferences');
  pgm.dropTable('watched_episodes');
  pgm.dropTable('watchlist_items');
}
