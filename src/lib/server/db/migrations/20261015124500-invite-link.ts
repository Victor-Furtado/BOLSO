import { type Kysely } from 'kysely';
import type { DB } from '../types';

/** One-time invite link. Cleared when the person sets a password. */
export async function up(database: Kysely<unknown>): Promise<void> {
	const db = database as Kysely<DB>;
	await db.schema.alterTable('play_accounts').addColumn('invite_token_hash', 'text').execute();
	await db.schema.alterTable('play_accounts').addColumn('invite_expires_at', 'text').execute();
}

export async function down(database: Kysely<unknown>): Promise<void> {
	const db = database as Kysely<DB>;
	await db.schema.alterTable('play_accounts').dropColumn('invite_expires_at').execute();
	await db.schema.alterTable('play_accounts').dropColumn('invite_token_hash').execute();
}
