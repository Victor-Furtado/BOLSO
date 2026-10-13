import { sql, type Kysely } from 'kysely';

/** Publication titles the campaign allows for feats. Empty means every book. */
export async function up(database: Kysely<unknown>): Promise<void> {
	await sql`PRAGMA foreign_keys = ON`.execute(database);
	await database.schema
		.alterTable('play_campaigns')
		.addColumn('sources', 'text', (col) => col.notNull().defaultTo('[]'))
		.execute();
}

export async function down(database: Kysely<unknown>): Promise<void> {
	await database.schema.alterTable('play_campaigns').dropColumn('sources').execute();
}
