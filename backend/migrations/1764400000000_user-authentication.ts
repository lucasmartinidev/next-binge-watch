import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import type { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';
import { loadAuthConfig } from '../src/config/authConfig';
import { loadDotenv } from '../src/config/envLoader';
import { DOWN_DROP_SQL, DOWN_RESTORE_SQL, LEGACY_DROP_SQL, MULTI_USER_CONSTRAINTS_SQL, OWNED_TABLES } from '../src/data/authMigrationSql';

loadDotenv();

export const shorthands: ColumnDefinitions | undefined = undefined;
const BCRYPT_ROUNDS = 10;

function createAuthTables(pgm: MigrationBuilder): void {
  pgm.createTable('users', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    username: { type: 'text', notNull: true, check: "char_length(username) BETWEEN 1 AND 39 AND username ~ '^[A-Za-z0-9-]+$'" },
    email: { type: 'text', notNull: true, check: 'char_length(email) <= 254' },
    client_salt: { type: 'text', notNull: true },
    password_hash: { type: 'text', notNull: true },
    role: { type: 'text', notNull: true, check: "role IN ('ADMIN', 'USER')" },
    is_active: { type: 'boolean', notNull: true, default: true },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('NOW()') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('NOW()') },
  });
  pgm.createIndex('users', ['LOWER(username)'], { name: 'idx_users_username_lower', unique: true });
  pgm.createIndex('users', ['LOWER(email)'], { name: 'idx_users_email_lower', unique: true });
  pgm.createTable('user_sessions', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    user_id: { type: 'uuid', notNull: true, references: 'users(id)', onDelete: 'CASCADE' },
    token_hash: { type: 'text', notNull: true, unique: true },
    expires_at: { type: 'timestamptz', notNull: true },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('NOW()') },
  });
  pgm.createIndex('user_sessions', ['user_id'], { name: 'idx_user_sessions_user_id' });
  pgm.createIndex('user_sessions', ['expires_at'], { name: 'idx_user_sessions_expires_at' });
}

function backfillOwnershipAndConstraints(pgm: MigrationBuilder, adminId: string): void {
  for (const table of OWNED_TABLES) {
    pgm.addColumn(table, { user_id: { type: 'uuid' } });
    pgm.sql(`UPDATE ${table} SET user_id = '${adminId}' WHERE user_id IS NULL;`);
    pgm.alterColumn(table, 'user_id', { notNull: true });
  }
  pgm.sql(MULTI_USER_CONSTRAINTS_SQL);
}

export async function up(pgm: MigrationBuilder): Promise<void> {
  const { initialAdmin } = loadAuthConfig();
  const adminId = randomUUID();
  const clientSalt = await bcrypt.genSalt(BCRYPT_ROUNDS);
  const clientHash = await bcrypt.hash(initialAdmin.password, clientSalt);
  const passwordHash = await bcrypt.hash(clientHash, BCRYPT_ROUNDS);
  const escapeSql = (val: string) => val.replace(/'/g, "''");
  createAuthTables(pgm);
  pgm.sql(`INSERT INTO users (id, username, email, client_salt, password_hash, role, is_active) VALUES ('${adminId}', '${escapeSql(initialAdmin.username)}', '${escapeSql(initialAdmin.email)}', '${escapeSql(clientSalt)}', '${escapeSql(passwordHash)}', '${initialAdmin.role}', TRUE);`);
  pgm.sql(LEGACY_DROP_SQL);
  backfillOwnershipAndConstraints(pgm, adminId);
}

export function down(pgm: MigrationBuilder): void {
  pgm.sql(DOWN_DROP_SQL);
  for (const table of [...OWNED_TABLES].reverse()) {
    pgm.dropColumn(table, 'user_id');
  }
  pgm.sql(DOWN_RESTORE_SQL);
  pgm.dropTable('user_sessions');
  pgm.dropTable('users');
}
