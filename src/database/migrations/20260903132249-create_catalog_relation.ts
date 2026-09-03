import type { db } from '$database/client';
import './schema-helpers';

export async function up(database: typeof db): Promise<void> {
	await database.schema
		.createTable('catalog_relation')
		.ifNotExists()
		.withUuidPk()
		.addColumn('source_entry_id', 'text', (col) =>
			col.notNull().references('catalog_entry.id').onDelete('restrict').onUpdate('cascade')
		)
		.addColumn('target_entry_id', 'text', (col) =>
			col.notNull().references('catalog_entry.id').onDelete('restrict').onUpdate('cascade')
		)
		.addColumn('type', 'text', (col) => col.notNull())
		.addColumn('data', 'text')
		.withTimestamps()
		.execute();

	await database.schema
		.createIndex('catalog_relation_source_entry_id_index')
		.on('catalog_relation')
		.column('source_entry_id')
		.execute();

	await database.schema
		.createIndex('catalog_relation_target_entry_id_index')
		.on('catalog_relation')
		.column('target_entry_id')
		.execute();

	await database.schema
		.createIndex('catalog_relation_type_index')
		.on('catalog_relation')
		.column('type')
		.execute();
}

export async function down(database: typeof db): Promise<void> {
	await database.schema.dropTable('catalog_relation').ifExists().execute();
}
