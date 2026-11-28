import type { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

function createUserListsTable(pgm: MigrationBuilder): void {
  pgm.createTable('user_lists', {
    id: { type: 'text', primaryKey: true },
    is_system: { type: 'boolean', notNull: true, default: false },
    system_key: {
      type: 'text',
      unique: true,
      check: "system_key IS NULL OR system_key IN ('want_to_watch', 'watching', 'watched')",
    },
    entity_type: {
      type: 'text',
      notNull: true,
      check: "entity_type IN ('series', 'person')",
    },
    name: { type: 'text', notNull: true },
    description: { type: 'text' },
    icon: { type: 'text', notNull: true },
    color: { type: 'text', notNull: true },
    tags: { type: 'jsonb', notNull: true, default: pgm.func("'[]'::jsonb") },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('NOW()') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('NOW()') },
  });
  pgm.createIndex('user_lists', ['LOWER(name)'], { name: 'idx_user_lists_name_lower', unique: true });
  pgm.createIndex('user_lists', ['entity_type', { name: 'is_system', sort: 'DESC' }, { name: 'updated_at', sort: 'DESC' }], {
    name: 'idx_user_lists_entity_type',
  });
  pgm.createIndex('user_lists', ['tags'], { name: 'idx_user_lists_tags_gin', method: 'gin' });
}

function seedPrimaryLists(pgm: MigrationBuilder): void {
  pgm.sql(`INSERT INTO user_lists (id, is_system, system_key, entity_type, name, description, icon, color) VALUES
    ('want_to_watch', TRUE, 'want_to_watch', 'series', 'Want to Watch', 'Series queued to watch next', 'bookmark', 'cyan'),
    ('watching', TRUE, 'watching', 'series', 'Watching', 'Series currently in progress', 'play', 'amber'),
    ('watched', TRUE, 'watched', 'series', 'Watched', 'Series you have completed', 'check-circle', 'emerald')`);
}

function createCustomListSeriesTable(pgm: MigrationBuilder): void {
  pgm.createTable('custom_list_series', {
    list_id: { type: 'text', notNull: true, references: 'user_lists(id)', onDelete: 'CASCADE' },
    series_id: { type: 'integer', notNull: true, references: 'watchlist_items(series_id)', onDelete: 'CASCADE' },
    added_at: { type: 'timestamptz', notNull: true, default: pgm.func('NOW()') },
  });
  pgm.addConstraint('custom_list_series', 'custom_list_series_pkey', { primaryKey: ['list_id', 'series_id'] });
  pgm.createIndex('custom_list_series', ['series_id'], { name: 'idx_custom_list_series_series_id' });
}

function createCustomListPeopleTable(pgm: MigrationBuilder): void {
  pgm.createTable('custom_list_people', {
    list_id: { type: 'text', notNull: true, references: 'user_lists(id)', onDelete: 'CASCADE' },
    person_id: { type: 'integer', notNull: true },
    name: { type: 'text', notNull: true },
    image_url: { type: 'text' },
    country: { type: 'text' },
    tvmaze_url: { type: 'text', notNull: true },
    added_at: { type: 'timestamptz', notNull: true, default: pgm.func('NOW()') },
  });
  pgm.addConstraint('custom_list_people', 'custom_list_people_pkey', { primaryKey: ['list_id', 'person_id'] });
  pgm.createIndex('custom_list_people', ['person_id'], { name: 'idx_custom_list_people_person_id' });
}

export function up(pgm: MigrationBuilder): void {
  createUserListsTable(pgm);
  seedPrimaryLists(pgm);
  createCustomListSeriesTable(pgm);
  createCustomListPeopleTable(pgm);
}

export function down(pgm: MigrationBuilder): void {
  pgm.dropTable('custom_list_people');
  pgm.dropTable('custom_list_series');
  pgm.dropTable('user_lists');
}
