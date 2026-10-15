import { type Kysely } from 'kysely';
import type { DB } from '../types';

/** Invite accounts must replace the temporary password before using the app. */
export async function up(database: Kysely<unknown>): Promise<void> {
	const db = database as Kysely<DB>;
	await db.schema
		.alterTable('play_accounts')
		.addColumn('display_name', 'text', (col) => col.notNull().defaultTo(''))
		.execute();
	await db.schema.alterTable('play_accounts').addColumn('need_action', 'text').execute();
}

export async function down(database: Kysely<unknown>): Promise<void> {
	const db = database as Kysely<DB>;
	await db.schema.alterTable('play_accounts').dropColumn('need_action').execute();
	await db.schema.alterTable('play_accounts').dropColumn('display_name').execute();
}
