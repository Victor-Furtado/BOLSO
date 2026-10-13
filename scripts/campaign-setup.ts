import fs from 'node:fs';
import { randomUUID } from 'node:crypto';
import { sql, type Kysely } from 'kysely';
import { db as catalogDb } from './db.ts';

const db = catalogDb as unknown as Kysely<Record<string, Record<string, unknown>>>;

/**
 * Replace one campaign's allow-list from a JSON file.
 * See docs/campaign-settings.md. A campaign with empty lists allows nothing.
 */

const KINDS = ['ancestry', 'heritage', 'background', 'class'] as const;
type Kind = (typeof KINDS)[number];

const PACK_BY_KIND: Record<Kind, string> = {
	ancestry: 'ancestries',
	heritage: 'heritages',
	background: 'backgrounds',
	class: 'classes'
};

const RARITIES = new Set(['common', 'uncommon', 'rare', 'unique']);

interface CampaignFile {
	slug: string;
	name: string;
	levelMin: number;
	levelMax: number;
	maxRarity: string;
	sources: string[];
	lists: Record<Kind, string[]>;
}

function asRecord(value: unknown): Record<string, unknown> | null {
	return value !== null && typeof value === 'object' && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: null;
}

function stringList(value: unknown, label: string): string[] {
	if (value === undefined) return [];
	if (
		!Array.isArray(value) ||
		value.some((entry) => typeof entry !== 'string' || entry.length === 0)
	) {
		throw new Error(`${label} must be an array of slugs`);
	}
	return value;
}

function readCampaign(filePath: string): CampaignFile {
	const raw = asRecord(JSON.parse(fs.readFileSync(filePath, 'utf8')) as unknown);
	if (!raw) throw new Error(`${filePath} must be a JSON object`);
	const slug = raw.slug;
	const name = raw.name;
	if (typeof slug !== 'string' || slug.length === 0) throw new Error('slug is required');
	if (typeof name !== 'string' || name.length === 0) throw new Error('name is required');
	const levelMin = raw.levelMin === undefined ? 1 : raw.levelMin;
	const levelMax = raw.levelMax === undefined ? 20 : raw.levelMax;
	const maxRarity = raw.maxRarity === undefined ? 'common' : raw.maxRarity;
	if (typeof levelMin !== 'number' || typeof levelMax !== 'number') {
		throw new Error('levelMin and levelMax must be numbers');
	}
	if (levelMin < 1 || levelMax > 20 || levelMin > levelMax) {
		throw new Error('levels must satisfy 1 ≤ levelMin ≤ levelMax ≤ 20');
	}
	if (typeof maxRarity !== 'string' || !RARITIES.has(maxRarity)) {
		throw new Error('maxRarity must be common, uncommon, rare, or unique');
	}
	return {
		slug,
		name,
		levelMin,
		levelMax,
		maxRarity,
		sources: stringList(raw.sources, 'sources'),
		lists: {
			ancestry: stringList(raw.ancestries, 'ancestries'),
			heritage: stringList(raw.heritages, 'heritages'),
			background: stringList(raw.backgrounds, 'backgrounds'),
			class: stringList(raw.classes, 'classes')
		}
	};
}

async function resolveSlug(kind: Kind, slug: string): Promise<string | null> {
	const row = await db
		.selectFrom('catalog_documents as d')
		.innerJoin('catalog_packs as p', 'p.name', 'd.pack')
		.select('d.uuid')
		.where('p.audience', '=', 'player')
		.where('d.pack', '=', PACK_BY_KIND[kind])
		.where('d.type', '=', kind)
		.where('d.slug', '=', slug)
		.orderBy(sql`d.remaster desc`)
		.executeTakeFirst();
	return row ? String(row.uuid) : null;
}

async function setup(filePath: string): Promise<void> {
	const campaign = readCampaign(filePath);
	const resolved: { kind: Kind; slug: string; uuid: string }[] = [];
	const missing: string[] = [];

	for (const kind of KINDS) {
		for (const slug of campaign.lists[kind]) {
			const uuid = await resolveSlug(kind, slug);
			if (!uuid) missing.push(`${kind} ${slug}`);
			else resolved.push({ kind, slug, uuid });
		}
	}

	if (missing.length > 0) {
		console.error('These slugs are not in the player catalog:');
		for (const line of missing) console.error(`  ${line}`);
		console.error('No options were written.');
		process.exitCode = 1;
		return;
	}

	await db.transaction().execute(async (trx) => {
		const existing = await trx
			.selectFrom('play_campaigns')
			.select('id')
			.where('slug', '=', campaign.slug)
			.executeTakeFirst();
		const id = existing ? String(existing.id) : randomUUID();

		if (existing) {
			await trx
				.updateTable('play_campaigns')
				.set({
					name: campaign.name,
					level_min: campaign.levelMin,
					level_max: campaign.levelMax,
					max_rarity: campaign.maxRarity,
					sources: JSON.stringify(campaign.sources)
				})
				.where('id', '=', id)
				.execute();
			await trx.deleteFrom('play_campaign_options').where('campaign_id', '=', id).execute();
		} else {
			await trx
				.insertInto('play_campaigns')
				.values({
					id,
					slug: campaign.slug,
					name: campaign.name,
					level_min: campaign.levelMin,
					level_max: campaign.levelMax,
					max_rarity: campaign.maxRarity,
					sources: JSON.stringify(campaign.sources)
				})
				.execute();
		}

		if (resolved.length > 0) {
			await trx
				.insertInto('play_campaign_options')
				.values(
					resolved.map((option) => ({
						campaign_id: id,
						catalog_uuid: option.uuid,
						kind: option.kind
					}))
				)
				.execute();
		}
	});

	console.log(`✓ ${campaign.slug} allows ${resolved.length} options`);
}

const filePath = process.argv[2];
if (!filePath) {
	console.error('Usage: npm run campaign:setup -- campaigns/<name>.json');
	process.exit(1);
}

setup(filePath)
	.catch((error: unknown) => {
		console.error(error);
		process.exitCode = 1;
	})
	.finally(() => catalogDb.destroy());
