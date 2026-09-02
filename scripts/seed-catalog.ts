import process from 'node:process';
import { z } from 'zod';
import ancestriesJson from '../src/lib/data/ancestries.json' with { type: 'json' };
import featsJson from '../src/lib/data/items/ancestries.json' with { type: 'json' };
import { createCatalogDb } from '../src/lib/db/client';
import { ensureCatalogSchema } from '../src/lib/db/schema';

const envSchema = z.object({
	TURSO_CATALOG_DB_URL: z.string().min(1),
	TURSO_CATALOG_AUTH_TOKEN: z.preprocess(
		(value) => (value === '' ? undefined : value),
		z.string().min(1).optional()
	)
});

const ancestrySeedSchema = z.object({
	id: z.string().min(1),
	name: z.string().min(1),
	img: z.string(),
	description: z.string(),
	boosts: z.array(z.string()),
	flaws: z.array(z.string()),
	hp: z.number().int(),
	hands: z.number().int(),
	languages: z.array(z.string()),
	traits: z.array(z.string()),
	additionalLanguages: z.array(z.string()),
	items: z.array(z.string()),
	spells: z.array(z.string()),
	size: z.string().min(1),
	speed: z.number().int(),
	vision: z.string().min(1)
});

const featSeedSchema = z.object({
	id: z.string().min(1),
	name: z.string().min(1),
	actionType: z.string().min(1),
	description: z.string(),
	rarity: z.string().min(1),
	traits: z.array(z.string()),
	type: z.string().min(1)
});

function jsonText(value: unknown) {
	return JSON.stringify(value);
}

async function main() {
	const env = envSchema.parse({
		TURSO_CATALOG_DB_URL: process.env.TURSO_CATALOG_DB_URL,
		TURSO_CATALOG_AUTH_TOKEN: process.env.TURSO_CATALOG_AUTH_TOKEN
	});

	const ancestries = z.array(ancestrySeedSchema).parse(ancestriesJson);
	const feats = z.array(featSeedSchema).parse(featsJson);
	const featIds = new Set(feats.map((feat) => feat.id));

	const links = ancestries.flatMap((ancestry) =>
		ancestry.items.map((featId) => ({ ancestryId: ancestry.id, featId }))
	);
	const missingFeatIds = [...new Set(links.map((link) => link.featId))].filter(
		(id) => !featIds.has(id)
	);
	if (missingFeatIds.length) {
		throw new Error(`Seed references unknown feats: ${missingFeatIds.join(', ')}`);
	}

	const db = createCatalogDb(env.TURSO_CATALOG_DB_URL, env.TURSO_CATALOG_AUTH_TOKEN);

	try {
		await ensureCatalogSchema(db);

		await db.transaction().execute(async (trx) => {
			await trx
				.insertInto('ancestries')
				.values(
					ancestries.map((ancestry) => ({
						id: ancestry.id,
						name: ancestry.name,
						img: ancestry.img,
						description: ancestry.description,
						hp: ancestry.hp,
						hands: ancestry.hands,
						size: ancestry.size,
						speed: ancestry.speed,
						vision: ancestry.vision,
						boosts: jsonText(ancestry.boosts),
						flaws: jsonText(ancestry.flaws),
						languages: jsonText(ancestry.languages),
						additional_languages: jsonText(ancestry.additionalLanguages),
						traits: jsonText(ancestry.traits),
						spells: jsonText(ancestry.spells)
					}))
				)
				.onConflict((oc) =>
					oc.column('id').doUpdateSet((eb) => ({
						name: eb.ref('excluded.name'),
						img: eb.ref('excluded.img'),
						description: eb.ref('excluded.description'),
						hp: eb.ref('excluded.hp'),
						hands: eb.ref('excluded.hands'),
						size: eb.ref('excluded.size'),
						speed: eb.ref('excluded.speed'),
						vision: eb.ref('excluded.vision'),
						boosts: eb.ref('excluded.boosts'),
						flaws: eb.ref('excluded.flaws'),
						languages: eb.ref('excluded.languages'),
						additional_languages: eb.ref('excluded.additional_languages'),
						traits: eb.ref('excluded.traits'),
						spells: eb.ref('excluded.spells')
					}))
				)
				.execute();

			await trx
				.insertInto('feats')
				.values(
					feats.map((feat) => ({
						id: feat.id,
						name: feat.name,
						action_type: feat.actionType,
						description: feat.description,
						rarity: feat.rarity,
						type: feat.type,
						traits: jsonText(feat.traits)
					}))
				)
				.onConflict((oc) =>
					oc.column('id').doUpdateSet((eb) => ({
						name: eb.ref('excluded.name'),
						action_type: eb.ref('excluded.action_type'),
						description: eb.ref('excluded.description'),
						rarity: eb.ref('excluded.rarity'),
						type: eb.ref('excluded.type'),
						traits: eb.ref('excluded.traits')
					}))
				)
				.execute();

			await trx.deleteFrom('ancestry_feats').execute();

			if (links.length) {
				await trx
					.insertInto('ancestry_feats')
					.values(
						links.map((link) => ({
							ancestry_id: link.ancestryId,
							feat_id: link.featId
						}))
					)
					.execute();
			}
		});

		console.log(
			`Seeded ${ancestries.length} ancestries (enable default 0) and ${feats.length} feats (enable default 1).`
		);
	} finally {
		await db.destroy();
	}
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
