import type { db } from '$database/client';
import './schema-helpers';

export async function up(database: typeof db): Promise<void> {
	await database.schema
		.createTable('catalog_effect')
		.ifNotExists()
		.withUuidPk()
		.addColumn('entry_id', 'text', (col) =>
			col.notNull().references('catalog_entry.id').onDelete('restrict').onUpdate('cascade')
		)
		.addColumn('type', 'text', (col) => col.notNull())
		.addColumn('data', 'text', (col) => col.notNull())
		.withTimestamps()
		.execute();

	await database.schema
		.createIndex('catalog_effect_entry_id_index')
		.on('catalog_effect')
		.column('entry_id')
		.execute();

	await database.schema
		.createIndex('catalog_effect_type_index')
		.on('catalog_effect')
		.column('type')
		.execute();
}

export async function down(database: typeof db): Promise<void> {
	await database.schema.dropTable('catalog_effect').ifExists().execute();
}
