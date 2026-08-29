import { type Kysely, sql } from 'kysely';
import type { Database } from './types';

export async function ensureCatalogSchema(db: Kysely<Database>) {
	await sql`PRAGMA foreign_keys = ON`.execute(db);

	await db.schema
		.createTable('ancestries')
		.ifNotExists()
		.addColumn('id', 'text', (col) => col.primaryKey())
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
		.addColumn('additional_languages', 'text', (col) => col.notNull())
		.addColumn('traits', 'text', (col) => col.notNull())
		.addColumn('spells', 'text', (col) => col.notNull())
		.addColumn('enable', 'integer', (col) => col.notNull().defaultTo(0))
		.execute();

	await db.schema
		.createTable('feats')
		.ifNotExists()
		.addColumn('id', 'text', (col) => col.primaryKey())
		.addColumn('name', 'text', (col) => col.notNull())
		.addColumn('action_type', 'text', (col) => col.notNull())
		.addColumn('description', 'text', (col) => col.notNull())
		.addColumn('rarity', 'text', (col) => col.notNull())
		.addColumn('type', 'text', (col) => col.notNull())
		.addColumn('traits', 'text', (col) => col.notNull())
		.addColumn('enable', 'integer', (col) => col.notNull().defaultTo(1))
		.execute();

	await db.schema
		.createTable('ancestry_feats')
		.ifNotExists()
		.addColumn('ancestry_id', 'text', (col) => col.notNull().references('ancestries.id'))
		.addColumn('feat_id', 'text', (col) => col.notNull().references('feats.id'))
		.addPrimaryKeyConstraint('ancestry_feats_pk', ['ancestry_id', 'feat_id'])
		.execute();
}
