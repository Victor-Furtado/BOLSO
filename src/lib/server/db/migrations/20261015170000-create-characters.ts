import { sql, type Kysely } from 'kysely';
import type { DB } from '../types';

/** A saved hero. Alive rows are capped at 10 per account in the save path. */
export async function up(database: Kysely<unknown>): Promise<void> {
	const db = database as Kysely<DB>;

	await db.schema
		.createTable('play_characters')
		.addColumn('id', 'text', (col) => col.primaryKey())
		.addColumn('account_id', 'text', (col) =>
			col.notNull().references('play_accounts.id').onDelete('cascade')
		)
		.addColumn('campaign_id', 'text', (col) =>
			col.notNull().references('play_campaigns.id').onDelete('cascade')
		)
		.addColumn('name', 'text', (col) => col.notNull())
		.addColumn('ancestry_slug', 'text')
		.addColumn('class_slug', 'text')
		.addColumn('status', 'text', (col) => col.notNull().defaultTo('alive'))
		.addColumn('sheet', 'text', (col) => col.notNull())
		.addColumn('created_at', 'text', (col) => col.notNull())
		.addCheckConstraint('characters_status_check', sql`status in ('alive', 'dead')`)
		.addCheckConstraint('characters_sheet_check', sql`json_valid(sheet)`)
		.modifyEnd(sql`strict`)
		.execute();

	await db.schema
		.createIndex('characters_account_status_idx')
		.on('play_characters')
		.columns(['account_id', 'status'])
		.execute();
}

export async function down(database: Kysely<unknown>): Promise<void> {
	const db = database as Kysely<DB>;
	await db.schema.dropTable('play_characters').ifExists().execute();
}
