import { sql, type Kysely } from 'kysely';

/**
 * Campaign settings. A campaign starts with no allowed options.
 * Options point at catalog uuids and are replaced by scripts/campaign-setup.ts.
 * Deleting a catalog document drops the option so a pack rebuild can proceed.
 */
export async function up(database: Kysely<unknown>): Promise<void> {
	await sql`PRAGMA foreign_keys = ON`.execute(database);

	await database.schema
		.createTable('play_campaigns')
		.addColumn('id', 'text', (col) => col.primaryKey())
		.addColumn('slug', 'text', (col) => col.notNull().unique())
		.addColumn('name', 'text', (col) => col.notNull())
		.addColumn('level_min', 'integer', (col) => col.notNull().defaultTo(1))
		.addColumn('level_max', 'integer', (col) => col.notNull().defaultTo(20))
		.addColumn('max_rarity', 'text', (col) => col.notNull().defaultTo('common'))
		.addCheckConstraint('campaigns_level_min_check', sql`level_min between 1 and 20`)
		.addCheckConstraint('campaigns_level_max_check', sql`level_max between 1 and 20`)
		.addCheckConstraint('campaigns_level_order_check', sql`level_min <= level_max`)
		.addCheckConstraint(
			'campaigns_rarity_check',
			sql`max_rarity in ('common', 'uncommon', 'rare', 'unique')`
		)
		.modifyEnd(sql`strict`)
		.execute();

	await database.schema
		.createTable('play_campaign_options')
		.addColumn('campaign_id', 'text', (col) =>
			col.notNull().references('play_campaigns.id').onDelete('cascade')
		)
		.addColumn('catalog_uuid', 'text', (col) =>
			col.notNull().references('catalog_documents.uuid').onDelete('cascade')
		)
		.addColumn('kind', 'text', (col) => col.notNull())
		.addPrimaryKeyConstraint('campaign_options_pk', ['campaign_id', 'catalog_uuid'])
		.addCheckConstraint(
			'campaign_options_kind_check',
			sql`kind in ('ancestry', 'heritage', 'background', 'class')`
		)
		.modifyEnd(sql`strict`)
		.execute();

	await database.schema
		.createIndex('campaign_options_kind_idx')
		.on('play_campaign_options')
		.columns(['campaign_id', 'kind'])
		.execute();
}

export async function down(database: Kysely<unknown>): Promise<void> {
	await database.schema.dropTable('play_campaign_options').ifExists().execute();
	await database.schema.dropTable('play_campaigns').ifExists().execute();
}
