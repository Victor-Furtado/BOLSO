import type {
	Ability,
	AncestryOption,
	Boost,
	GrantedFeature,
	HeritageOption,
	Rarity,
	Size
} from '$lib/char-gen/ancestry';
import type { BackgroundOption, BackgroundOrigin } from '$lib/char-gen/background';
import type { ClassFeature, ClassOption, ProficiencyRank } from '$lib/char-gen/class';
import type { FeatOption } from '$lib/char-gen/feat';
import {
	htmlText,
	readChoiceLists,
	readNumber,
	readString,
	readStringList,
	raritySchema,
	systemOf
} from '../schemas/payload';
import type { CatalogDocumentRow, GrantRow } from '../repositories/document.repository';

const PF2E_STATIC = 'https://raw.githubusercontent.com/foundryvtt/pf2e/v14-dev/static/';

/** Foundry stores `systems/pf2e/icons/...`; the repo file is `static/icons/...`. */
function catalogImage(path: string | null): string {
	if (!path) return '';
	if (path.startsWith('https://') || path.startsWith('http://')) return path;
	return `${PF2E_STATIC}${path.replace(/^systems\/pf2e\//, '')}`;
}

const abilities = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA', 'FREE'] as const;
const sizes = ['tiny', 'sm', 'med', 'lg', 'huge'] as const;

function asAbility(value: string): Boost | null {
	const upper = value.toUpperCase();
	return abilities.includes(upper as Boost) ? (upper as Boost) : null;
}

/** One slot becomes a single boost. A list of abilities is a free choice. */
function flattenBoosts(lists: string[][]): Boost[] {
	return lists.flatMap((list) => {
		const mapped = list.flatMap((entry) => {
			const ability = asAbility(entry);
			return ability ? [ability] : [];
		});
		if (mapped.length === 0) return [];
		if (mapped.length > 1) return ['FREE' as const];
		return mapped;
	});
}

function rarityOf(row: CatalogDocumentRow): Rarity {
	const parsed = raritySchema.safeParse(row.rarity);
	return parsed.success ? parsed.data : 'common';
}

function traitsOf(row: CatalogDocumentRow): string[] {
	return row.traits ? row.traits.split(',').filter(Boolean) : [];
}

function keyOf(row: CatalogDocumentRow): string {
	return row.slug ?? row.uuid;
}

function descriptionOf(system: Record<string, unknown>): string | null {
	const description = system.description;
	const html =
		description && typeof description === 'object' && 'value' in description
			? readString((description as { value: unknown }).value)
			: readString(description);
	return htmlText(html);
}

function grantsFor(uuid: string, grants: GrantRow[]): GrantedFeature[] {
	return grants
		.filter((grant) => grant.from_uuid === uuid)
		.map((grant) => ({
			name: grant.name,
			type: grant.type,
			description: htmlText(grant.description)
		}));
}

export function mapAncestry(row: CatalogDocumentRow, grants: GrantRow[]): AncestryOption {
	const system = systemOf(row.payload);
	const size = readString(system.size);
	const vision = readString(system.vision) ?? 'normal';
	const languages = system.languages;
	const additional = system.additionalLanguages;
	return {
		id: row.uuid,
		slug: `pf2e.ancestry.${keyOf(row)}`,
		key: keyOf(row),
		name: row.name,
		image: catalogImage(row.img),
		description: descriptionOf(system),
		rarity: rarityOf(row),
		traits: traitsOf(row),
		legacy: row.remaster === 0,
		hp: readNumber(system.hp) ?? 0,
		size: sizes.includes(size as Size) ? (size as Size) : 'med',
		speed: readNumber(system.speed) ?? 25,
		vision,
		boosts: flattenBoosts(readChoiceLists(system.boosts)),
		flaws: flattenBoosts(readChoiceLists(system.flaws)),
		languages: readStringList(languages),
		additionalLanguages: readStringList(
			additional && typeof additional === 'object' && 'value' in additional
				? (additional as { value: unknown }).value
				: additional
		),
		features: grantsFor(row.uuid, grants),
		heritageIds: []
	};
}

export function mapHeritage(
	row: CatalogDocumentRow,
	grants: GrantRow[]
): HeritageOption & {
	ancestrySlug: string | null;
} {
	const system = systemOf(row.payload);
	const ancestry = system.ancestry;
	const ancestrySlug =
		ancestry && typeof ancestry === 'object'
			? readString((ancestry as { slug?: unknown; name?: unknown }).slug)
			: readString(ancestry);
	return {
		id: row.uuid,
		slug: `pf2e.heritage.${keyOf(row)}`,
		key: keyOf(row),
		name: row.name,
		image: catalogImage(row.img) || null,
		description: descriptionOf(system),
		rarity: rarityOf(row),
		traits: traitsOf(row),
		versatile: traitsOf(row).includes('versatile'),
		legacy: row.remaster === 0,
		grants: grantsFor(row.uuid, grants),
		ancestrySlug
	};
}

function backgroundOrigin(title: string | null): {
	origin: BackgroundOrigin;
	detail: string | null;
} {
	const source = title?.toLowerCase() ?? '';
	if (source.includes('lost omens')) return { origin: 'lost-omens', detail: title };
	if (source.includes('society') || source.includes('pathfinder society')) {
		return { origin: 'society', detail: title };
	}
	if (source && !source.includes('player core') && !source.includes('core rulebook')) {
		return { origin: 'adventure', detail: title };
	}
	return { origin: 'core', detail: null };
}

export function mapBackground(row: CatalogDocumentRow, grants: GrantRow[]): BackgroundOption {
	const system = systemOf(row.payload);
	const text = descriptionOf(system);
	const [summary, ...rest] = (text ?? '').split(/\n+/);
	const trained = system.trainedSkills;
	const origin = backgroundOrigin(row.source_title);
	const lore = readStringList(system.lore);
	return {
		id: row.uuid,
		slug: `pf2e.background.${keyOf(row)}`,
		key: keyOf(row),
		name: row.name,
		summary: summary || null,
		rules: rest.join('\n').trim() || null,
		prerequisite: readString(system.prerequisites) ?? null,
		rarity: rarityOf(row),
		legacy: row.remaster === 0,
		origin: origin.origin,
		originDetail: origin.detail,
		boosts: readChoiceLists(system.boosts).map((list) =>
			list.flatMap((entry) => {
				const ability = asAbility(entry);
				return ability ? [ability] : [];
			})
		),
		skills: readStringList(
			trained && typeof trained === 'object' && 'value' in trained
				? (trained as { value: unknown }).value
				: trained
		),
		lore,
		grants: grantsFor(row.uuid, grants)
	};
}

function rank(value: unknown): ProficiencyRank {
	const number = readNumber(value);
	if (number === 0 || number === 1 || number === 2 || number === 3 || number === 4) return number;
	return 0;
}

function numberList(value: unknown): number[] {
	const list =
		value && typeof value === 'object' && 'value' in value
			? (value as { value: unknown }).value
			: value;
	return Array.isArray(list)
		? list.filter((entry): entry is number => typeof entry === 'number')
		: [];
}

function levels(json: string | null | undefined): number[] {
	if (!json) return [];
	try {
		const parsed = JSON.parse(json) as unknown;
		return Array.isArray(parsed)
			? parsed.filter((entry): entry is number => typeof entry === 'number')
			: [];
	} catch {
		return [];
	}
}

function keyAbilities(json: string | null): Ability[] {
	if (!json) return [];
	try {
		const parsed = JSON.parse(json) as unknown;
		const list = Array.isArray(parsed) ? parsed : [parsed];
		return list.flatMap((entry) => {
			if (typeof entry !== 'string') return [];
			const ability = asAbility(entry);
			return ability && ability !== 'FREE' ? [ability] : [];
		});
	} catch {
		return [];
	}
}

export function mapClass(
	row: CatalogDocumentRow,
	details:
		| {
				hp: number;
				key_ability: string | null;
				class_feat_levels: string;
				ancestry_feat_levels: string;
				general_feat_levels: string;
				skill_feat_levels: string;
		  }
		| undefined,
	grants: GrantRow[]
): ClassOption {
	const system = systemOf(row.payload);
	const saves = (system.savingThrows ?? {}) as Record<string, unknown>;
	const attacks = (system.attacks ?? {}) as Record<string, unknown>;
	const defenses = (system.defenses ?? {}) as Record<string, unknown>;
	const trained = (system.trainedSkills ?? {}) as Record<string, unknown>;
	const other = attacks.other as { name?: unknown; value?: unknown } | undefined;
	const otherName = readString(other?.name);
	const features: ClassFeature[] = grantsFor(row.uuid, grants).map((feature) => ({
		...feature,
		level: 1
	}));
	return {
		id: row.uuid,
		slug: `pf2e.class.${keyOf(row)}`,
		key: keyOf(row),
		name: row.name,
		image: catalogImage(row.img),
		description: descriptionOf(system),
		rarity: rarityOf(row),
		legacy: row.remaster === 0,
		hp: details?.hp ?? readNumber(system.hp) ?? 0,
		keyAbilities: keyAbilities(details?.key_ability ?? null),
		spellcaster: system.spellcasting != null || traitsOf(row).includes('spellcaster'),
		perception: rank(system.perception),
		saves: {
			fortitude: rank(saves.fortitude),
			reflex: rank(saves.reflex),
			will: rank(saves.will)
		},
		attacks: {
			simple: rank(attacks.simple),
			martial: rank(attacks.martial),
			advanced: rank(attacks.advanced),
			unarmed: rank(attacks.unarmed),
			other: otherName ? { name: otherName, rank: rank(other?.value) } : null
		},
		defenses: {
			unarmored: rank(defenses.unarmored),
			light: rank(defenses.light),
			medium: rank(defenses.medium),
			heavy: rank(defenses.heavy)
		},
		skills: readStringList(trained.value),
		additionalSkills: readNumber(trained.additional) ?? 0,
		features,
		featLevels: {
			class: levels(details?.class_feat_levels),
			ancestry: levels(details?.ancestry_feat_levels),
			general: levels(details?.general_feat_levels),
			skill: levels(details?.skill_feat_levels),
			skillIncrease: numberList(system.skillIncreaseLevels)
		}
	};
}

export function mapFeat(row: CatalogDocumentRow): FeatOption {
	const system = systemOf(row.payload);
	const text = descriptionOf(system);
	const [description, ...rest] = (text ?? '').split(/\n+/);
	return {
		id: row.uuid,
		slug: `pf2e.feat.${keyOf(row)}`,
		name: row.name,
		traits: traitsOf(row),
		description: description || null,
		rules: rest.join('\n').trim() || null
	};
}

export function preferRemaster<T extends { key: string; legacy: boolean }>(rows: T[]): T[] {
	const byKey = new Map<string, T>();
	for (const row of rows) {
		const previous = byKey.get(row.key);
		if (!previous || (previous.legacy && !row.legacy)) byKey.set(row.key, row);
	}
	return [...byKey.values()].sort((a, b) => a.key.localeCompare(b.key));
}
