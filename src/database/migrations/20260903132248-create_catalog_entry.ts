import type { db } from '$database/client';
import './schema-helpers';

export async function up(database: typeof db): Promise<void> {
	await database.schema
		.createTable('catalog_entry')
		.ifNotExists()
		.withUuidPk()
		.addColumn('source_id', 'text', (col) =>
			col.notNull().references('catalog_source.id').onDelete('restrict').onUpdate('cascade')
		)
		.addColumn('type', 'text', (col) => col.notNull())
		.addColumn('enabled', 'integer', (col) => col.notNull().defaultTo(1))
		.addColumn('slug', 'text', (col) => col.notNull())
		.addColumn('name', 'text', (col) => col.notNull())
		.addColumn('description', 'text')
		.addColumn('level', 'integer')
		.addColumn('rarity', 'text')
		.addColumn('traits', 'text', (col) => col.notNull())
		.addColumn('data', 'text', (col) => col.notNull())
		.withTimestamps()
		.addUniqueConstraint('catalog_entry_source_type_slug_unique', ['source_id', 'type', 'slug'])
		.execute();

	await database.schema
		.createIndex('catalog_entry_source_id_index')
		.on('catalog_entry')
		.column('source_id')
		.execute();

	await database.schema
		.createIndex('catalog_entry_type_index')
		.on('catalog_entry')
		.column('type')
		.execute();

	await database.schema
		.createIndex('catalog_entry_level_index')
		.on('catalog_entry')
		.column('level')
		.execute();

	await database.schema
		.createIndex('catalog_entry_rarity_index')
		.on('catalog_entry')
		.column('rarity')
		.execute();
}

export async function down(database: typeof db): Promise<void> {
	await database.schema.dropTable('catalog_entry').ifExists().execute();
}
