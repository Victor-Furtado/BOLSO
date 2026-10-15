import { type Kysely } from 'kysely';
import type { DB } from '../types';

/** Square portrait as a data-URL string, kept off the sheet JSON. */
export async function up(database: Kysely<unknown>): Promise<void> {
	const db = database as Kysely<DB>;
	await db.schema.alterTable('play_characters').addColumn('portrait', 'text').execute();
}

export async function down(database: Kysely<unknown>): Promise<void> {
	const db = database as Kysely<DB>;
	await db.schema.alterTable('play_characters').dropColumn('portrait').execute();
}
