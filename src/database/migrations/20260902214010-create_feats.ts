import type { db } from '$database/client';
import './schema-helpers';

export async function up(database: typeof db): Promise<void> {
	await database.schema
		.createTable('feats')
		.ifNotExists()
		.withUuidPk()
		.addColumn('name', 'text', (col) => col.notNull())
		.addColumn('action_type', 'text', (col) => col.notNull())
		.addColumn('description', 'text', (col) => col.notNull())
		.addColumn('rarity', 'text', (col) => col.notNull())
		.addColumn('type', 'text', (col) => col.notNull())
		.addColumn('traits', 'text', (col) => col.notNull())
		.addColumn('enable', 'integer', (col) => col.notNull().defaultTo(false))
		.addColumn('custom', 'boolean', (col) => col.notNull().defaultTo(true))
		.execute();
}

export async function down(database: typeof db): Promise<void> {
	await database.schema.dropTable('feats').ifExists().execute();
}
