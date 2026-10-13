import { sql } from 'kysely';
import { db } from '$lib/server/db/client';

export type CampaignKind = 'ancestry' | 'heritage' | 'background' | 'class';

export type CampaignRecord = {
	id: string;
	slug: string;
	name: string;
	levelMin: number;
	levelMax: number;
	maxRarity: 'common' | 'uncommon' | 'rare' | 'unique';
	/** Publication titles. Empty means feats are not limited by book. */
	sources: string[];
	options: Record<CampaignKind, Set<string>>;
};

type CampaignRow = {
	id: string;
	slug: string;
	name: string;
	level_min: number;
	level_max: number;
	max_rarity: CampaignRecord['maxRarity'];
	sources: string;
};

const emptyOptions = (): CampaignRecord['options'] => ({
	ancestry: new Set(),
	heritage: new Set(),
	background: new Set(),
	class: new Set()
});

export async function findCampaign(slug: string | null): Promise<CampaignRecord | null> {
	const rows = slug
		? (
				await sql<CampaignRow>`
					select id, slug, name, level_min, level_max, max_rarity, sources
					from play_campaigns
					where slug = ${slug}
				`.execute(db)
			).rows
		: (
				await sql<CampaignRow>`
					select id, slug, name, level_min, level_max, max_rarity, sources
					from play_campaigns
					order by slug
					limit 2
				`.execute(db)
			).rows;

	if (rows.length !== 1) return null;
	const row = rows[0];
	const options = emptyOptions();
	const links = await sql<{ catalog_uuid: string; kind: CampaignKind }>`
		select catalog_uuid, kind
		from play_campaign_options
		where campaign_id = ${row.id}
	`.execute(db);
	for (const link of links.rows) {
		options[link.kind]?.add(link.catalog_uuid);
	}
	return {
		id: row.id,
		slug: row.slug,
		name: row.name,
		levelMin: row.level_min,
		levelMax: row.level_max,
		maxRarity: row.max_rarity,
		sources: JSON.parse(row.sources) as string[],
		options
	};
}
