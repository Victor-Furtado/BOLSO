import { sql } from 'kysely';
import './schema-helpers';
import type { db } from '$database/client';

export async function up(database: typeof db): Promise<void> {
	await sql`PRAGMA foreign_keys = ON`.execute(database);

	await database.schema
		.createTable('ancestries')
		//.ifNotExists()
		.withUuidPk()
		.addColumn('name', 'text', (col) => col.notNull())
		.addColumn('img', 'text')
		.addColumn('description', 'text', (col) => col.notNull())
		.addColumn('hp', 'integer', (col) => col.notNull())
		.addColumn('hands', 'integer', (col) => col.notNull())
		.addColumn('size', 'text', (col) => col.notNull())
		.addColumn('speed', 'integer', (col) => col.notNull())
		.addColumn('vision', 'text', (col) => col.notNull())
		.addColumn('boosts', 'text', (col) => col.notNull())
		.addColumn('flaws', 'text', (col) => col.notNull())
		.addColumn('languages', 'text', (col) => col.notNull())
		.addColumn('traits', 'text', (col) => col.notNull())
		.addColumn('enable', 'boolean', (col) => col.notNull().defaultTo(false))
		.addColumn('custom', 'boolean', (col) => col.notNull().defaultTo(true))
		.execute();
}

export async function down(database: typeof db): Promise<void> {
	await database.schema.dropTable('ancestries').ifExists().execute();
}
