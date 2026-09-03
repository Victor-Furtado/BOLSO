import { db } from './db';

const ancestriesUrl =
	'https://api.github.com/repos/foundryvtt/pf2e/contents/packs/pf2e/ancestries?ref=v14-dev';

type FoundryAncestry = {
	_id: string;
	name: string;
	system: {
		additionalLanguages?: { value?: string[] };
		boosts?: Record<string, { value?: string[] }>;
		description?: { value?: string };
		flaws?: Record<string, { value?: string[] }>;
		hands?: number;
		hp?: number;
		languages?: { value?: string[] };
		publication?: { license?: string; remaster?: boolean };
		size?: string;
		speed?: number;
		traits?: { rarity?: string; value?: string[] };
		vision?: string;
	};
};

type GitHubFile = {
	name: string;
	download_url: string;
	type: string;
};

const sources = {
	remaster: {
		id: 'pf2e.remaster',
		slug: 'pf2e-remaster',
		name: 'Pathfinder 2e Remaster',
		type: 'official',
		approved: 1,
		license: 'ORC'
	},
	legacy: {
		id: 'pf2e.legacy',
		slug: 'pf2e-legacy',
		name: 'Pathfinder 2e Legacy',
		type: 'official',
		approved: 1,
		license: 'OGL'
	}
} as const;

function slugify(value: string): string {
	return value
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/(^-|-$)/g, '');
}

async function loadAncestries(): Promise<FoundryAncestry[]> {
	const directoryResponse = await fetch(ancestriesUrl);

	if (!directoryResponse.ok) {
		throw new Error(`Failed to load ancestries directory: ${directoryResponse.status}`);
	}

	const files = (await directoryResponse.json()) as GitHubFile[];
	const ancestryFiles = files.filter((file) => file.type === 'file' && file.name.endsWith('.json'));

	return Promise.all(
		ancestryFiles.map(async (file) => {
			const response = await fetch(file.download_url);

			if (!response.ok) {
				throw new Error(`Failed to load ancestry ${file.name}: ${response.status}`);
			}

			return (await response.json()) as FoundryAncestry;
		})
	);
}

function createEntry(
	ancestry: {
		name: string;
		description?: string;
		boosts?: string[];
		flaws?: string[];
		hp?: number;
		hands?: number;
		languages?: string[];
		additionalLanguages?: string[];
		size?: string;
		speed?: number;
		vision?: string;
		traits?: string[];
		rarity?: string;
		publication?: { license?: string; remaster?: boolean };
	},
	sourceId: string
) {
	return {
		id: `ancestry.${slugify(ancestry.name)}`,
		source_id: sourceId,
		type: 'ancestry',
		enabled: 1,
		slug: slugify(ancestry.name),
		name: ancestry.name,
		description: ancestry.description ?? null,
		level: null,
		rarity: ancestry.rarity ?? null,
		traits: JSON.stringify(ancestry.traits ?? []),
		data: JSON.stringify({
			boosts: ancestry.boosts ?? [],
			flaws: ancestry.flaws ?? [],
			hp: ancestry.hp,
			hands: ancestry.hands,
			languages: ancestry.languages ?? [],
			additionalLanguages: ancestry.additionalLanguages ?? [],
			size: ancestry.size,
			speed: ancestry.speed,
			vision: ancestry.vision
		})
	};
}

function normalizeFoundryAncestry(ancestry: FoundryAncestry) {
	const values = (field: Record<string, { value?: string[] }> | undefined) =>
		Object.values(field ?? {}).flatMap((entry) => entry.value ?? []);

	return {
		name: ancestry.name,
		description: ancestry.system.description?.value,
		boosts: values(ancestry.system.boosts).map((value) => value.toUpperCase()),
		flaws: values(ancestry.system.flaws).map((value) => value.toUpperCase()),
		hp: ancestry.system.hp,
		hands: ancestry.system.hands,
		languages: ancestry.system.languages?.value,
		additionalLanguages: ancestry.system.additionalLanguages?.value,
		size: ancestry.system.size,
		speed: ancestry.system.speed,
		vision: ancestry.system.vision,
		traits: ancestry.system.traits?.value,
		rarity: ancestry.system.traits?.rarity,
		publication: ancestry.system.publication
	};
}

async function seed() {
	console.log('🌱 Seeding database...');

	await db
		.insertInto('catalog_source')
		.values(Object.values(sources))
		.onConflict((conflict) =>
			conflict.column('id').doUpdateSet({
				slug: (eb) => eb.ref('excluded.slug'),
				name: (eb) => eb.ref('excluded.name'),
				type: (eb) => eb.ref('excluded.type'),
				approved: (eb) => eb.ref('excluded.approved'),
				license: (eb) => eb.ref('excluded.license')
			})
		)
		.execute();

	const ancestries = await loadAncestries();
	const entries = ancestries.map((ancestry) => {
		const normalizedAncestry = normalizeFoundryAncestry(ancestry);
		const sourceId = normalizedAncestry.publication?.remaster
			? sources.remaster.id
			: sources.legacy.id;

		return createEntry(normalizedAncestry, sourceId);
	});

	await db
		.insertInto('catalog_entry')
		.values(entries)
		.onConflict((conflict) =>
			conflict.columns(['source_id', 'type', 'slug']).doUpdateSet({
				id: (eb) => eb.ref('excluded.id'),
				source_id: (eb) => eb.ref('excluded.source_id'),
				type: (eb) => eb.ref('excluded.type'),
				enabled: (eb) => eb.ref('excluded.enabled'),
				slug: (eb) => eb.ref('excluded.slug'),
				name: (eb) => eb.ref('excluded.name'),
				description: (eb) => eb.ref('excluded.description'),
				level: (eb) => eb.ref('excluded.level'),
				rarity: (eb) => eb.ref('excluded.rarity'),
				traits: (eb) => eb.ref('excluded.traits'),
				data: (eb) => eb.ref('excluded.data')
			})
		)
		.execute();

	console.log('\n🧬 Seeding ancestries...');
	console.log(`🧬 Seeded ${entries.length} ancestries!`);

	console.log('✅ Seed completed!');

	await db.destroy();
}

seed().catch((error) => {
	console.error('❌ Seed failed:', error);
	process.exit(1);
});
