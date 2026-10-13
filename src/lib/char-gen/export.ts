import type { Ability } from './ancestry';
import type { BasicInfo } from './basic-info';
import type { Build, Selections } from './build';

/**
 * Portable character sheet. Catalog choices are referenced by slug and only the player's own
 * picks are stored; everything the rules derive from those (fixed boosts, automatic skills,
 * stats, features) is left out. Empty fields are omitted.
 */
export type CharacterExport = {
	version: 1;
	level: 1;
	name?: string;
	nickname?: string;
	formerOccupation?: string;
	motto?: string;
	age?: number;
	heightCm?: number;
	weightKg?: number;
	ancestry?: string;
	heritage?: string;
	background?: string;
	class?: string;
	boosts?: {
		/** Free ancestry boosts; with `alternateAncestry`, they replace the fixed boosts and flaws. */
		ancestry?: Ability[];
		alternateAncestry?: true;
		background?: Ability[];
		class?: Ability;
		free?: Ability[];
	};
	skills?: string[];
	feats?: Partial<Record<'class' | 'ancestry' | 'skill' | 'general', string>>;
	languages?: string[];
};

function compact<T extends object>(value: T): T | undefined {
	const entries = Object.entries(value).filter(
		([, field]) =>
			field !== undefined &&
			field !== null &&
			field !== '' &&
			!(Array.isArray(field) && field.length === 0)
	);
	return entries.length ? (Object.fromEntries(entries) as T) : undefined;
}

export function toCharacterExport(
	basicInfo: BasicInfo,
	selections: Selections,
	build: Build
): CharacterExport {
	const boosts = compact({
		ancestry: build.ancestryPlan?.free,
		alternateAncestry: build.ancestryPlan?.alternate || undefined,
		background: build.backgroundSlots
			.map((slot) => slot.pick)
			.filter((pick): pick is Ability => pick !== null),
		class: build.classPlan?.key ?? undefined,
		free: build.freeBoosts
	} satisfies CharacterExport['boosts']);

	const feats = compact(
		Object.fromEntries(
			build.featSlots
				.map((slot) => [slot.category, slot.options.find((feat) => feat.id === slot.chosen)?.slug])
				.filter((entry): entry is [string, string] => typeof entry[1] === 'string')
		)
	);

	return {
		version: 1,
		level: 1,
		...compact({
			name: basicInfo.name.trim(),
			nickname: basicInfo.nickname.trim(),
			formerOccupation: basicInfo.formerOccupation.trim(),
			motto: basicInfo.motto.trim(),
			age: basicInfo.age ?? undefined,
			heightCm: basicInfo.heightCm ?? undefined,
			weightKg: basicInfo.weightKg ?? undefined,
			ancestry: selections.ancestry?.slug,
			heritage: selections.heritage?.slug,
			background: selections.background?.slug,
			class: selections.classOption?.slug,
			boosts,
			skills: build.skillPicks.chosen,
			feats,
			languages: build.languages.chosen
		})
	};
}

/** File name derived from the character's name, e.g. `gar-pedra-funda.json`. */
export function characterFileName(name: string) {
	const slug = name
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');
	return `${slug || 'personagem'}.json`;
}
