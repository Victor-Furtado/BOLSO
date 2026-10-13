import { sql, type Kysely } from 'kysely';

/**
 * Catalog projection from docs/catalog-database-schema.md.
 * Play tables stay out of this migration; they are character state, not the catalog.
 *
 * Journal-page uuids are the full Foundry page form, so the id-form CHECK from the
 * schema doc is enforced by the importer for every type other than journal_page.
 */
export async function up(database: Kysely<unknown>): Promise<void> {
	await sql`PRAGMA foreign_keys = ON`.execute(database);

	await database.schema
		.createTable('catalog_packs')
		.addColumn('name', 'text', (col) => col.primaryKey())
		.addColumn('label', 'text', (col) => col.notNull())
		.addColumn('document_class', 'text', (col) => col.notNull())
		.addColumn('audience', 'text', (col) => col.notNull())
		.addColumn('source_dir', 'text', (col) => col.notNull())
		.addColumn('system_path', 'text', (col) => col.notNull())
		.addCheckConstraint(
			'packs_document_class_check',
			sql`document_class in ('Actor', 'Item', 'JournalEntry', 'Macro', 'RollTable')`
		)
		.addCheckConstraint('packs_audience_check', sql`audience in ('player', 'gm', 'engine')`)
		.modifyEnd(sql`strict`)
		.execute();

	await database.schema
		.createTable('catalog_folders')
		.addColumn('id', 'integer', (col) => col.primaryKey())
		.addColumn('pack', 'text', (col) =>
			col.notNull().references('catalog_packs.name').onDelete('cascade')
		)
		.addColumn('foundry_id', 'text', (col) => col.notNull())
		.addColumn('name', 'text', (col) => col.notNull())
		.addColumn('parent_id', 'integer', (col) =>
			col.references('catalog_folders.id').onDelete('cascade')
		)
		.addColumn('sort', 'integer')
		.addColumn('source_path', 'text')
		.addUniqueConstraint('folders_pack_foundry_id', ['pack', 'foundry_id'])
		.modifyEnd(sql`strict`)
		.execute();

	await database.schema
		.createIndex('folders_parent_idx')
		.on('catalog_folders')
		.column('parent_id')
		.execute();

	await database.schema
		.createTable('catalog_documents')
		.addColumn('uuid', 'text', (col) => col.primaryKey())
		.addColumn('pack', 'text', (col) =>
			col.notNull().references('catalog_packs.name').onDelete('cascade')
		)
		.addColumn('document_class', 'text', (col) => col.notNull())
		.addColumn('type', 'text', (col) => col.notNull())
		.addColumn('foundry_id', 'text', (col) => col.notNull())
		.addColumn('name', 'text', (col) => col.notNull())
		.addColumn('name_folded', 'text', (col) => col.notNull())
		.addColumn('slug', 'text')
		.addColumn('img', 'text')
		.addColumn('folder_id', 'integer', (col) =>
			col.references('catalog_folders.id').onDelete('set null')
		)
		.addColumn('level', 'integer')
		.addColumn('rarity', 'text')
		.addColumn('remaster', 'integer')
		.addColumn('license', 'text')
		.addColumn('source_title', 'text')
		.addColumn('source_path', 'text', (col) => col.notNull())
		.addColumn('payload', 'text', (col) => col.notNull())
		.addColumn('imported_at', 'text', (col) =>
			col.notNull().defaultTo(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`)
		)
		.addUniqueConstraint('documents_pack_class_id', ['pack', 'document_class', 'foundry_id'])
		.addCheckConstraint(
			'documents_class_check',
			sql`document_class in ('Actor', 'Item', 'JournalEntry', 'Macro', 'RollTable')`
		)
		.addCheckConstraint(
			'documents_rarity_check',
			sql`rarity is null or rarity in ('common', 'uncommon', 'rare', 'unique')`
		)
		.addCheckConstraint('documents_remaster_check', sql`remaster is null or remaster in (0, 1)`)
		.addCheckConstraint('documents_payload_check', sql`json_valid(payload)`)
		.modifyEnd(sql`strict`)
		.execute();

	await database.schema
		.createIndex('documents_browse_idx')
		.on('catalog_documents')
		.columns(['pack', 'type', 'level', 'rarity'])
		.execute();
	await database.schema
		.createIndex('documents_name_idx')
		.on('catalog_documents')
		.column('name_folded')
		.execute();
	await database.schema
		.createIndex('documents_slug_idx')
		.on('catalog_documents')
		.columns(['pack', 'slug'])
		.execute();
	await database.schema
		.createIndex('documents_source_idx')
		.on('catalog_documents')
		.columns(['source_title', 'remaster'])
		.execute();

	await database.schema
		.createTable('catalog_traits')
		.addColumn('document_uuid', 'text', (col) =>
			col.notNull().references('catalog_documents.uuid').onDelete('cascade')
		)
		.addColumn('kind', 'text', (col) => col.notNull())
		.addColumn('trait', 'text', (col) => col.notNull())
		.addPrimaryKeyConstraint('traits_pk', ['document_uuid', 'kind', 'trait'])
		.addCheckConstraint('traits_kind_check', sql`kind in ('trait', 'tradition', 'other_tag')`)
		.modifyEnd(sql`strict`)
		.execute();

	await database.schema
		.createIndex('traits_lookup_idx')
		.on('catalog_traits')
		.columns(['kind', 'trait'])
		.execute();

	await database.schema
		.createTable('catalog_embedded_items')
		.addColumn('id', 'integer', (col) => col.primaryKey())
		.addColumn('parent_uuid', 'text', (col) =>
			col.notNull().references('catalog_documents.uuid').onDelete('cascade')
		)
		.addColumn('foundry_id', 'text', (col) => col.notNull())
		.addColumn('type', 'text', (col) => col.notNull())
		.addColumn('name', 'text', (col) => col.notNull())
		.addColumn('sort', 'integer')
		.addColumn('payload', 'text', (col) => col.notNull())
		.addUniqueConstraint('embedded_parent_foundry_id', ['parent_uuid', 'foundry_id'])
		.addCheckConstraint('embedded_payload_check', sql`json_valid(payload)`)
		.modifyEnd(sql`strict`)
		.execute();

	await database.schema
		.createIndex('embedded_parent_idx')
		.on('catalog_embedded_items')
		.columns(['parent_uuid', 'sort'])
		.execute();

	await database.schema
		.createTable('catalog_rules')
		.addColumn('id', 'integer', (col) => col.primaryKey())
		.addColumn('document_uuid', 'text', (col) =>
			col.references('catalog_documents.uuid').onDelete('cascade')
		)
		.addColumn('embedded_item_id', 'integer', (col) =>
			col.references('catalog_embedded_items.id').onDelete('cascade')
		)
		.addColumn('position', 'integer', (col) => col.notNull())
		.addColumn('key', 'text', (col) => col.notNull())
		.addColumn('selector', 'text')
		.addColumn('predicate', 'text', (col) => col.notNull().defaultTo('[]'))
		.addColumn('payload', 'text', (col) => col.notNull())
		.addUniqueConstraint('rules_document_position', ['document_uuid', 'position'])
		.addUniqueConstraint('rules_embedded_position', ['embedded_item_id', 'position'])
		.addCheckConstraint(
			'rules_owner_check',
			sql`(document_uuid is not null) + (embedded_item_id is not null) = 1`
		)
		.addCheckConstraint('rules_predicate_check', sql`json_valid(predicate)`)
		.addCheckConstraint('rules_payload_check', sql`json_valid(payload)`)
		.modifyEnd(sql`strict`)
		.execute();

	await database.schema
		.createIndex('rules_key_selector_idx')
		.on('catalog_rules')
		.columns(['key', 'selector'])
		.execute();

	await database.schema
		.createTable('catalog_links')
		.addColumn('id', 'integer', (col) => col.primaryKey())
		.addColumn('from_uuid', 'text', (col) =>
			col.references('catalog_documents.uuid').onDelete('cascade')
		)
		.addColumn('from_embedded', 'integer', (col) =>
			col.references('catalog_embedded_items.id').onDelete('cascade')
		)
		.addColumn('to_ref', 'text', (col) => col.notNull())
		.addColumn('to_uuid', 'text', (col) =>
			col.references('catalog_documents.uuid').onDelete('set null')
		)
		.addColumn('kind', 'text', (col) => col.notNull())
		.addColumn('detail', 'text', (col) => col.notNull().defaultTo('{}'))
		.addCheckConstraint(
			'links_kind_check',
			sql`kind in ('description', 'grant', 'effect', 'choice', 'embedded', 'journal')`
		)
		.addCheckConstraint('links_detail_check', sql`json_valid(detail)`)
		.addCheckConstraint('links_from_check', sql`from_uuid is not null or from_embedded is not null`)
		.modifyEnd(sql`strict`)
		.execute();

	await database.schema
		.createIndex('links_from_idx')
		.on('catalog_links')
		.columns(['from_uuid', 'kind'])
		.execute();
	await database.schema
		.createIndex('links_to_idx')
		.on('catalog_links')
		.columns(['to_uuid', 'kind'])
		.execute();
	await database.schema
		.createIndex('links_unresolved_idx')
		.on('catalog_links')
		.column('to_ref')
		.where(sql.ref('to_uuid'), 'is', null)
		.execute();

	await database.schema
		.createTable('catalog_name_groups')
		.addColumn('publication', 'text')
		.addColumn('pack', 'text', (col) => col.notNull())
		.addColumn('name', 'text', (col) => col.notNull())
		.addColumn('name_folded', 'text', (col) => col.notNull())
		.addPrimaryKeyConstraint('name_groups_pk', ['pack', 'name'])
		.modifyEnd(sql`strict`)
		.execute();

	await database.schema
		.createIndex('name_groups_name_idx')
		.on('catalog_name_groups')
		.column('name_folded')
		.execute();

	await database.schema
		.createTable('catalog_spell_details')
		.addColumn('document_uuid', 'text', (col) =>
			col.primaryKey().references('catalog_documents.uuid').onDelete('cascade')
		)
		.addColumn('area_type', 'text')
		.addColumn('area_value', 'integer')
		.addColumn('defense', 'text')
		.addColumn('heightening_type', 'text')
		.addColumn('time', 'text')
		.modifyEnd(sql`strict`)
		.execute();

	await database.schema
		.createTable('catalog_feat_details')
		.addColumn('document_uuid', 'text', (col) =>
			col.primaryKey().references('catalog_documents.uuid').onDelete('cascade')
		)
		.addColumn('category', 'text', (col) => col.notNull())
		.addColumn('action_type', 'text', (col) => col.notNull())
		.addColumn('actions', 'integer')
		.addColumn('prerequisites', 'text', (col) => col.notNull().defaultTo('[]'))
		.addCheckConstraint('feat_actions_check', sql`actions is null or actions between 1 and 3`)
		.addCheckConstraint('feat_prerequisites_check', sql`json_valid(prerequisites)`)
		.modifyEnd(sql`strict`)
		.execute();

	await database.schema
		.createIndex('feat_category_idx')
		.on('catalog_feat_details')
		.columns(['category', 'action_type'])
		.execute();

	await database.schema
		.createTable('catalog_class_details')
		.addColumn('document_uuid', 'text', (col) =>
			col.primaryKey().references('catalog_documents.uuid').onDelete('cascade')
		)
		.addColumn('hp', 'integer', (col) => col.notNull())
		.addColumn('key_ability', 'text')
		.addColumn('class_feat_levels', 'text', (col) => col.notNull())
		.addColumn('ancestry_feat_levels', 'text', (col) => col.notNull())
		.addColumn('general_feat_levels', 'text', (col) => col.notNull())
		.addColumn('skill_feat_levels', 'text', (col) => col.notNull().defaultTo('[]'))
		.addCheckConstraint('class_feat_levels_check', sql`json_valid(class_feat_levels)`)
		.addCheckConstraint('ancestry_feat_levels_check', sql`json_valid(ancestry_feat_levels)`)
		.addCheckConstraint('general_feat_levels_check', sql`json_valid(general_feat_levels)`)
		.addCheckConstraint('skill_feat_levels_check', sql`json_valid(skill_feat_levels)`)
		.modifyEnd(sql`strict`)
		.execute();

	await database.schema
		.createTable('catalog_equipment_details')
		.addColumn('document_uuid', 'text', (col) =>
			col.primaryKey().references('catalog_documents.uuid').onDelete('cascade')
		)
		.addColumn('price_cp', 'integer')
		.addColumn('bulk', 'text')
		.addColumn('category', 'text')
		.addColumn('item_group', 'text')
		.addColumn('damage_die', 'text')
		.addColumn('damage_type', 'text')
		.addColumn('armor_category', 'text')
		.modifyEnd(sql`strict`)
		.execute();

	await database.schema
		.createIndex('equipment_category_idx')
		.on('catalog_equipment_details')
		.columns(['category', 'item_group'])
		.execute();

	await database.schema
		.createTable('catalog_creature_details')
		.addColumn('document_uuid', 'text', (col) =>
			col.primaryKey().references('catalog_documents.uuid').onDelete('cascade')
		)
		.addColumn('size', 'text')
		.modifyEnd(sql`strict`)
		.execute();

	await database.schema
		.createTable('catalog_import_warnings')
		.addColumn('id', 'integer', (col) => col.primaryKey())
		.addColumn('source_path', 'text', (col) => col.notNull())
		.addColumn('message', 'text', (col) => col.notNull())
		.modifyEnd(sql`strict`)
		.execute();
}

export async function down(database: Kysely<unknown>): Promise<void> {
	await database.schema.dropTable('catalog_import_warnings').ifExists().execute();
	await database.schema.dropTable('catalog_creature_details').ifExists().execute();
	await database.schema.dropTable('catalog_equipment_details').ifExists().execute();
	await database.schema.dropTable('catalog_class_details').ifExists().execute();
	await database.schema.dropTable('catalog_feat_details').ifExists().execute();
	await database.schema.dropTable('catalog_spell_details').ifExists().execute();
	await database.schema.dropTable('catalog_name_groups').ifExists().execute();
	await database.schema.dropTable('catalog_links').ifExists().execute();
	await database.schema.dropTable('catalog_rules').ifExists().execute();
	await database.schema.dropTable('catalog_embedded_items').ifExists().execute();
	await database.schema.dropTable('catalog_traits').ifExists().execute();
	await database.schema.dropTable('catalog_documents').ifExists().execute();
	await database.schema.dropTable('catalog_folders').ifExists().execute();
	await database.schema.dropTable('catalog_packs').ifExists().execute();
}
