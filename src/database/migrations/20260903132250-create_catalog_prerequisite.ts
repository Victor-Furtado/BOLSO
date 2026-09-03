import type { db } from '$database/client';
import './schema-helpers';

export async function up(database: typeof db): Promise<void> {
	await database.schema
		.createTable('catalog_prerequisite')
		.ifNotExists()
		.withUuidPk()
		.addColumn('entry_id', 'text', (col) =>
			col.notNull().references('catalog_entry.id').onDelete('restrict').onUpdate('cascade')
		)
		.addColumn('expression', 'text', (col) => col.notNull())
		.withTimestamps()
		.execute();

	await database.schema
		.createIndex('catalog_prerequisite_entry_id_index')
		.on('catalog_prerequisite')
		.column('entry_id')
		.execute();
}

export async function down(database: typeof db): Promise<void> {
	await database.schema.dropTable('catalog_prerequisite').ifExists().execute();
}
