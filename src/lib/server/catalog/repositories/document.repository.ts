import { sql } from 'kysely';
import { db } from '$lib/server/db/client';

export type CatalogDocumentRow = {
	uuid: string;
	slug: string | null;
	name: string;
	img: string | null;
	rarity: string | null;
	remaster: number | null;
	source_title: string | null;
	payload: string;
	traits: string | null;
};

export type GrantRow = {
	from_uuid: string;
	uuid: string;
	name: string;
	type: string;
	description: string | null;
	level: number | null;
};

export async function listPlayerDocuments(type: string): Promise<CatalogDocumentRow[]> {
	const result = await sql<CatalogDocumentRow>`
		select
			d.uuid,
			d.slug,
			d.name,
			d.img,
			d.rarity,
			d.remaster,
			d.source_title,
			d.payload,
			(
				select group_concat(t.trait, ',')
				from catalog_traits t
				where t.document_uuid = d.uuid and t.kind = 'trait'
			) as traits
		from catalog_documents d
		join catalog_packs p on p.name = d.pack
		where p.audience = 'player' and d.type = ${type}
	`.execute(db);
	return result.rows;
}

export async function listGrants(fromUuids: string[], maxLevel: number): Promise<GrantRow[]> {
	if (fromUuids.length === 0) return [];
	const result = await sql<GrantRow>`
		select
			l.from_uuid as from_uuid,
			g.uuid as uuid,
			g.name as name,
			g.type as type,
			json_extract(g.payload, '$.system.description.value') as description,
			cast(json_extract(l.detail, '$.level') as integer) as level
		from catalog_links l
		join catalog_documents g on g.uuid = l.to_uuid
		where l.kind = 'grant'
			and l.from_uuid in (${sql.join(fromUuids.map((uuid) => sql`${uuid}`))})
			and (
				json_extract(l.detail, '$.level') is null
				or cast(json_extract(l.detail, '$.level') as integer) <= ${maxLevel}
			)
	`.execute(db);
	return result.rows;
}

export async function listClassDetails(uuids: string[]) {
	if (uuids.length === 0) return [];
	const result = await sql<{
		document_uuid: string;
		hp: number;
		key_ability: string | null;
		class_feat_levels: string;
		ancestry_feat_levels: string;
		general_feat_levels: string;
		skill_feat_levels: string;
	}>`
		select document_uuid, hp, key_ability, class_feat_levels, ancestry_feat_levels,
			general_feat_levels, skill_feat_levels
		from catalog_class_details
		where document_uuid in (${sql.join(uuids.map((uuid) => sql`${uuid}`))})
	`.execute(db);
	return result.rows;
}

const RARITY_RANK = { common: 0, uncommon: 1, rare: 2, unique: 3 } as const;

export async function listLevelOneFeats(
	maxRarity: keyof typeof RARITY_RANK,
	sources: string[]
): Promise<CatalogDocumentRow[]> {
	const sourceFilter =
		sources.length > 0
			? sql`and d.source_title in (${sql.join(sources.map((title) => sql`${title}`))})`
			: sql``;
	const result = await sql<CatalogDocumentRow>`
		select
			d.uuid,
			d.slug,
			d.name,
			d.img,
			d.rarity,
			d.remaster,
			d.source_title,
			d.payload,
			(
				select group_concat(t.trait, ',')
				from catalog_traits t
				where t.document_uuid = d.uuid and t.kind = 'trait'
			) as traits
		from catalog_documents d
		join catalog_packs p on p.name = d.pack
		join catalog_feat_details f on f.document_uuid = d.uuid
		where p.audience = 'player'
			and d.type = 'feat'
			and d.level <= 1
			and case d.rarity
				when 'uncommon' then 1
				when 'rare' then 2
				when 'unique' then 3
				else 0
			end <= ${RARITY_RANK[maxRarity]}
			and f.category in ('class', 'ancestry', 'skill', 'general')
			${sourceFilter}
	`.execute(db);
	return result.rows;
}
