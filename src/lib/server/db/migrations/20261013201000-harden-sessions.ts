import { type Kysely } from 'kysely';
import type { DB } from '../types';

/**
 * Refresh cookies are random secrets. The table stores only their hash.
 * Existing session rows cannot be verified after that change, so they are dropped.
 */
export async function up(database: Kysely<unknown>): Promise<void> {
	await (database as Kysely<DB>).deleteFrom('play_sessions').execute();

	await database.schema
		.alterTable('play_sessions')
		.addColumn('token_hash', 'text', (col) => col.notNull().defaultTo(''))
		.execute();
	await database.schema
		.alterTable('play_sessions')
		.addColumn('persistent', 'integer', (col) => col.notNull().defaultTo(0))
		.execute();
	await database.schema
		.alterTable('play_sessions')
		.addColumn('created_at', 'text', (col) => col.notNull().defaultTo(''))
		.execute();

	await database.schema
		.createIndex('sessions_token_hash_idx')
		.on('play_sessions')
		.column('token_hash')
		.unique()
		.execute();
}

export async function down(database: Kysely<unknown>): Promise<void> {
	await database.schema.dropIndex('sessions_token_hash_idx').ifExists().execute();
	await database.schema.alterTable('play_sessions').dropColumn('created_at').execute();
	await database.schema.alterTable('play_sessions').dropColumn('persistent').execute();
	await database.schema.alterTable('play_sessions').dropColumn('token_hash').execute();
}
