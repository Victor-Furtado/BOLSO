import type { db } from '$database/client';
import './schema-helpers';

export async function up(database: typeof db): Promise<void> {
	await database.schema
		.createTable('catalog_source')
		.ifNotExists()
		.withUuidPk()
		.addColumn('slug', 'text', (col) => col.notNull().unique())
		.addColumn('name', 'text', (col) => col.notNull())
		.addColumn('type', 'text', (col) => col.notNull())
		.addColumn('version', 'text')
		.addColumn('publisher', 'text')
		.withTimestamps()
		.execute();
}

export async function down(database: typeof db): Promise<void> {
	await database.schema.dropTable('catalog_source').ifExists().execute();
}
