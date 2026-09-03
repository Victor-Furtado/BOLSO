import type { db } from '$lib/server/db/client';
import './schema-helpers';

export async function up(database: typeof db): Promise<void> {
	await database.schema
		.createTable('catalog_source')
		.ifNotExists()
		.withUuidPk()
		.addColumn('slug', 'text', (col) => col.notNull().unique())
		.addColumn('name', 'text', (col) => col.notNull())
		.addColumn('type', 'text', (col) => col.notNull())
		.addColumn('approved', 'integer', (col) => col.notNull().defaultTo(0))
		.addColumn('license', 'text')
		.withTimestamps()
		.execute();
}

export async function down(database: typeof db): Promise<void> {
	await database.schema.dropTable('catalog_source').ifExists().execute();
}
