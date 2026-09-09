import { db } from './db';

const PF2E_REF = 'v14-dev';
const PF2E_RAW = `https://raw.githubusercontent.com/foundryvtt/pf2e/${PF2E_REF}`;
const PF2E_API = 'https://api.github.com/repos/foundryvtt/pf2e';

const ancestriesPath = 'packs/pf2e/ancestries';
const ancestryFeaturesPath = 'packs/pf2e/ancestry-features';
const ancestryActionsPath = 'packs/pf2e/actions/ancestry';
const heritagesPath = 'packs/pf2e/heritages';

const ANCESTRY_FEATURE_UUID_PREFIX = 'Compendium.pf2e.ancestryfeatures.Item.';
const ACTION_UUID_PREFIX = 'Compendium.pf2e.actionspf2e.Item.';

type FoundryPublication = { license?: string; remaster?: boolean };
type FoundryActionType = 'passive' | 'action' | 'free' | 'reaction';

type FoundryAncestry = {
	_id: string;
	name: string;
	img: string;
	system: {
		additionalLanguages?: { value?: string[] };
		boosts?: Record<string, { value?: string[] }>;
		description?: { value?: string };
		flaws?: Record<string, { value?: string[] }>;
		hands?: number;
		hp?: number;
		items?: Record<string, { name?: string; uuid?: string }>;
		languages?: { value?: string[] };
		publication?: FoundryPublication;
		size?: string;
		speed?: number;
		traits?: { rarity?: string; value?: string[] };
		vision?: string;
	};
};

type FoundryFeatLike = {
	_id: string;
	name: string;
	img: string;
	type: string;
	system: {
		actionType?: { value?: FoundryActionType };
		actions?: { value?: number | null };
		category?: string;
		description?: { value?: string };
		frequency?: { max?: number; per?: string } | null;
		level?: { value?: number };
		publication?: FoundryPublication;
		rules?: Array<{ key?: string; uuid?: string }>;
		traits?: { rarity?: string; value?: string[] };
	};
};

type FoundryHeritage = {
	_id: string;
	name: string;
	img: string;
	type: string;
	system: {
		ancestry?: { name?: string; slug?: string; uuid?: string } | null;
		description?: { value?: string };
		publication?: FoundryPublication;
		rules?: Array<{ key?: string; uuid?: string }>;
		traits?: { rarity?: string; value?: string[] };
	};
};

type GitHubTreeEntry = {
	path: string;
	type: string;
};

type CatalogEntryInsert = {
	id: string;
	source_id: string;
	type: string;
	enabled: number;
	slug: string;
	name: string;
	image: string;
	description: string | null;
	level: number | null;
	rarity: string | null;
	traits: string;
	data: string;
};

type CatalogRelationInsert = {
	id: string;
	source_entry_id: string;
	target_entry_id: string;
	type: string;
	data: string | null;
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

function sourceIdFromPublication(publication?: FoundryPublication): string {
	return publication?.remaster ? sources.remaster.id : sources.legacy.id;
}

function remapImage(img: string): string {
	return img
		.replaceAll('systems/pf2e/icons/ancestries/', `${PF2E_RAW}/static/icons/ancestries/`)
		.replaceAll('systems/pf2e/icons/features/', `${PF2E_RAW}/static/icons/features/`)
		.replaceAll('systems/pf2e/icons/actions/', `${PF2E_RAW}/static/icons/actions/`);
}

function mapActionType(
	foundryType: FoundryActionType | undefined,
	actions: number | null | undefined
): { actionType: string; actions: number | null } {
	switch (foundryType) {
		case 'free':
			return { actionType: 'free', actions: null };
		case 'reaction':
			return { actionType: 'reaction', actions: null };
		case 'action':
			if (actions === 2) return { actionType: 'two_actions', actions: 2 };
			if (actions === 3) return { actionType: 'three_actions', actions: 3 };
			return { actionType: 'single', actions: actions ?? 1 };
		case 'passive':
		default:
			return { actionType: 'passive', actions: null };
	}
}

function formatFrequency(frequency: FoundryFeatLike['system']['frequency']): string | null {
	if (!frequency?.max || !frequency.per) return null;
	return `${frequency.max}/${frequency.per}`;
}

function extractGrantedNames(
	rules: Array<{ key?: string; uuid?: string }> | undefined,
	description: string | undefined,
	prefix: string
): string[] {
	const names = new Set<string>();

	for (const rule of rules ?? []) {
		if (rule.key === 'GrantItem' && rule.uuid?.startsWith(prefix) && !rule.uuid.includes('{')) {
			names.add(rule.uuid.slice(prefix.length));
		}
	}

	const escaped = prefix.replace(/\./g, '\\.');
	const pattern = new RegExp(`@UUID\\[${escaped}([^\\]]+)\\]`, 'g');
	for (const match of (description ?? '').matchAll(pattern)) {
		names.add(match[1]);
	}

	return [...names];
}

function fileSlug(path: string): string {
	return path.split('/').pop()!.replace(/\.json$/, '');
}

async function listPackJsonFiles(packPath: string): Promise<string[]> {
	const response = await fetch(`${PF2E_API}/git/trees/${PF2E_REF}:${packPath}?recursive=1`);

	if (!response.ok) {
		throw new Error(`Failed to list ${packPath}: ${response.status}`);
	}

	const tree = (await response.json()) as { tree: GitHubTreeEntry[] };

	return tree.tree
		.filter(
			(entry) =>
				entry.type === 'blob' &&
				entry.path.endsWith('.json') &&
				!entry.path.endsWith('_folders.json')
		)
		.map((entry) => entry.path);
}

async function loadJsonFiles<T>(
	packPath: string,
	relativePaths: string[],
	concurrency = 16
): Promise<Array<{ path: string; data: T }>> {
	const results: Array<{ path: string; data: T }> = [];

	async function fetchOne(path: string, attempt = 1): Promise<{ path: string; data: T }> {
		try {
			const response = await fetch(`${PF2E_RAW}/${packPath}/${path}`);

			if (!response.ok) {
				throw new Error(`Failed to load ${packPath}/${path}: ${response.status}`);
			}

			return { path, data: (await response.json()) as T };
		} catch (error) {
			if (attempt >= 3) throw error;
			await new Promise((resolve) => setTimeout(resolve, attempt * 250));
			return fetchOne(path, attempt + 1);
		}
	}

	for (let i = 0; i < relativePaths.length; i += concurrency) {
		const chunk = relativePaths.slice(i, i + concurrency);
		results.push(...(await Promise.all(chunk.map((path) => fetchOne(path)))));
	}

	return results;
}

async function upsertEntries(entries: CatalogEntryInsert[]): Promise<void> {
	const chunkSize = 100;

	for (let i = 0; i < entries.length; i += chunkSize) {
		const chunk = entries.slice(i, i + chunkSize);

		await db
			.insertInto('catalog_entry')
			.values(chunk)
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
					data: (eb) => eb.ref('excluded.data'),
					image: (eb) => eb.ref('excluded.image')
				})
			)
			.execute();
	}
}

async function upsertRelations(relations: CatalogRelationInsert[]): Promise<void> {
	const chunkSize = 100;

	for (let i = 0; i < relations.length; i += chunkSize) {
		const chunk = relations.slice(i, i + chunkSize);

		await db
			.insertInto('catalog_relation')
			.values(chunk)
			.onConflict((conflict) =>
				conflict.column('id').doUpdateSet({
					source_entry_id: (eb) => eb.ref('excluded.source_entry_id'),
					target_entry_id: (eb) => eb.ref('excluded.target_entry_id'),
					type: (eb) => eb.ref('excluded.type'),
					data: (eb) => eb.ref('excluded.data')
				})
			)
			.execute();
	}
}

function createAncestryEntry(ancestry: FoundryAncestry): CatalogEntryInsert {
	const values = (field: Record<string, { value?: string[] }> | undefined) =>
		Object.values(field ?? {})
			.map(({ value }) => (value && value.length > 1 ? 'FREE' : value?.[0]?.toUpperCase()))
			.filter((v): v is string => !!v);

	const slug = slugify(ancestry.name);

	return {
		id: `ancestry.${slug}`,
		source_id: sourceIdFromPublication(ancestry.system.publication),
		type: 'ancestry',
		enabled: 1,
		slug,
		name: ancestry.name,
		image: remapImage(ancestry.img),
		description: ancestry.system.description?.value ?? null,
		level: null,
		rarity: ancestry.system.traits?.rarity ?? null,
		traits: JSON.stringify(ancestry.system.traits?.value ?? []),
		data: JSON.stringify({
			boosts: values(ancestry.system.boosts),
			flaws: values(ancestry.system.flaws),
			hp: ancestry.system.hp,
			hands: ancestry.system.hands,
			languages: ancestry.system.languages?.value ?? [],
			additionalLanguages: ancestry.system.additionalLanguages?.value ?? [],
			size: ancestry.system.size,
			speed: ancestry.system.speed,
			vision: ancestry.system.vision
		})
	};
}

function createFeatLikeEntry(
	item: FoundryFeatLike,
	options: { idPrefix: string; type: 'feat' | 'action'; slug: string }
): CatalogEntryInsert {
	const { actionType, actions } = mapActionType(
		item.system.actionType?.value,
		item.system.actions?.value
	);

	return {
		id: `${options.idPrefix}.${options.slug}`,
		source_id: sourceIdFromPublication(item.system.publication),
		type: options.type,
		enabled: 1,
		slug: options.slug,
		name: item.name,
		image: remapImage(item.img),
		description: item.system.description?.value ?? null,
		level: item.system.level?.value ?? null,
		rarity: item.system.traits?.rarity ?? null,
		traits: JSON.stringify(item.system.traits?.value ?? []),
		data: JSON.stringify({
			actions,
			actionType,
			frequency: formatFrequency(item.system.frequency)
		})
	};
}

function createHeritageEntry(
	heritage: FoundryHeritage,
	options: { slug: string; versatile: boolean }
): CatalogEntryInsert {
	return {
		id: `heritage.${options.slug}`,
		source_id: sourceIdFromPublication(heritage.system.publication),
		type: 'heritage',
		enabled: 1,
		slug: options.slug,
		name: heritage.name,
		image: remapImage(heritage.img),
		description: heritage.system.description?.value ?? null,
		level: null,
		rarity: heritage.system.traits?.rarity ?? null,
		traits: JSON.stringify(heritage.system.traits?.value ?? []),
		data: JSON.stringify({
			versatile: options.versatile
		})
	};
}

function relation(
	type: string,
	sourceEntryId: string,
	targetEntryId: string
): CatalogRelationInsert {
	return {
		id: `rel.${type}:${sourceEntryId}:${targetEntryId}`,
		source_entry_id: sourceEntryId,
		target_entry_id: targetEntryId,
		type,
		data: null
	};
}

async function seedSources(): Promise<void> {
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
}

async function seedAncestries(): Promise<FoundryAncestry[]> {
	console.log('\n🧬 Seeding ancestries...');

	const paths = await listPackJsonFiles(ancestriesPath);
	const loaded = await loadJsonFiles<FoundryAncestry>(ancestriesPath, paths);
	const ancestries = loaded.map(({ data }) => data);

	await upsertEntries(ancestries.map(createAncestryEntry));
	console.log(`🧬 Seeded ${ancestries.length} ancestries!`);

	return ancestries;
}

async function seedAncestryFeatures(ancestries: FoundryAncestry[]): Promise<{
	featuresByName: Map<string, CatalogEntryInsert>;
	featToActionNames: Map<string, string[]>;
}> {
	console.log('\n✨ Seeding ancestry features...');

	const paths = await listPackJsonFiles(ancestryFeaturesPath);
	const loaded = await loadJsonFiles<FoundryFeatLike>(ancestryFeaturesPath, paths);
	const featuresByName = new Map<string, CatalogEntryInsert>();
	const entries: CatalogEntryInsert[] = [];
	const featToActionNames = new Map<string, string[]>();

	for (const { path, data } of loaded) {
		const entry = createFeatLikeEntry(data, {
			idPrefix: 'feat.ancestry',
			type: 'feat',
			slug: fileSlug(path)
		});

		entries.push(entry);
		featuresByName.set(data.name, entry);

		const actionNames = extractGrantedNames(
			data.system.rules,
			data.system.description?.value,
			ACTION_UUID_PREFIX
		);
		if (actionNames.length > 0) {
			featToActionNames.set(entry.id, actionNames);
		}
	}

	await upsertEntries(entries);
	console.log(`✨ Seeded ${entries.length} ancestry features!`);

	const relations: CatalogRelationInsert[] = [];

	for (const ancestry of ancestries) {
		const ancestryId = `ancestry.${slugify(ancestry.name)}`;

		for (const item of Object.values(ancestry.system.items ?? {})) {
			const uuidName = item.uuid?.startsWith(ANCESTRY_FEATURE_UUID_PREFIX)
				? item.uuid.slice(ANCESTRY_FEATURE_UUID_PREFIX.length)
				: undefined;
			const feature =
				(uuidName ? featuresByName.get(uuidName) : undefined) ??
				(item.name ? featuresByName.get(item.name) : undefined);
			if (!feature) continue;
			relations.push(relation('grants', ancestryId, feature.id));
		}
	}

	await upsertRelations(relations);
	console.log(`🔗 Seeded ${relations.length} ancestry→feature grants!`);

	return { featuresByName, featToActionNames };
}

async function seedAncestryActions(
	featToActionNames: Map<string, string[]>
): Promise<Map<string, CatalogEntryInsert>> {
	console.log('\n🎬 Seeding ancestry actions...');

	const paths = await listPackJsonFiles(ancestryActionsPath);
	const loaded = await loadJsonFiles<FoundryFeatLike>(ancestryActionsPath, paths);
	const actionsByName = new Map<string, CatalogEntryInsert>();
	const entries: CatalogEntryInsert[] = [];

	for (const { path, data } of loaded) {
		const entry = createFeatLikeEntry(data, {
			idPrefix: 'action.ancestry',
			type: 'action',
			slug: fileSlug(path)
		});
		entries.push(entry);
		actionsByName.set(data.name, entry);
	}

	await upsertEntries(entries);
	console.log(`🎬 Seeded ${entries.length} ancestry actions!`);

	const relations: CatalogRelationInsert[] = [];

	for (const [featId, actionNames] of featToActionNames) {
		for (const actionName of actionNames) {
			const action = actionsByName.get(actionName);
			if (!action) continue;
			relations.push(relation('grants', featId, action.id));
		}
	}

	await upsertRelations(relations);
	console.log(`🔗 Seeded ${relations.length} feature→action grants!`);

	return actionsByName;
}

async function seedHeritages(
	featuresByName: Map<string, CatalogEntryInsert>,
	actionsByName: Map<string, CatalogEntryInsert>
): Promise<void> {
	console.log('\n🏛️ Seeding heritages...');

	const paths = await listPackJsonFiles(heritagesPath);
	const loaded = await loadJsonFiles<FoundryHeritage>(heritagesPath, paths);
	const entries: CatalogEntryInsert[] = [];
	const relations: CatalogRelationInsert[] = [];

	for (const { path, data } of loaded) {
		const versatile = path.startsWith('versatile-heritages/');
		const entry = createHeritageEntry(data, {
			slug: fileSlug(path),
			versatile
		});
		entries.push(entry);

		const ancestrySlug = data.system.ancestry?.slug;
		if (ancestrySlug) {
			relations.push(relation('contains', `ancestry.${ancestrySlug}`, entry.id));
			relations.push(relation('requires', entry.id, `ancestry.${ancestrySlug}`));
		}

		const grantedFeatureNames = extractGrantedNames(
			data.system.rules,
			data.system.description?.value,
			ANCESTRY_FEATURE_UUID_PREFIX
		);
		for (const name of grantedFeatureNames) {
			const feature = featuresByName.get(name);
			if (!feature) continue;
			relations.push(relation('grants', entry.id, feature.id));
		}

		const grantedActionNames = extractGrantedNames(
			data.system.rules,
			data.system.description?.value,
			ACTION_UUID_PREFIX
		);
		for (const name of grantedActionNames) {
			const action = actionsByName.get(name);
			if (!action) continue;
			relations.push(relation('grants', entry.id, action.id));
		}
	}

	await upsertEntries(entries);
	console.log(`🏛️ Seeded ${entries.length} heritages!`);

	await upsertRelations(relations);
	console.log(`🔗 Seeded ${relations.length} heritage relations!`);
}

async function seed() {
	console.log('🌱 Seeding database...');

	await seedSources();
	const ancestries = await seedAncestries();
	const { featuresByName, featToActionNames } = await seedAncestryFeatures(ancestries);
	const actionsByName = await seedAncestryActions(featToActionNames);
	await seedHeritages(featuresByName, actionsByName);

	console.log('\n✅ Seed completed!');
	await db.destroy();
}

seed().catch((error) => {
	console.error('❌ Seed failed:', error);
	process.exit(1);
});
