import type {
	Ability,
	AncestryCatalog,
	AncestryChoice,
	AncestryOption,
	GrantedFeature,
	HeritageOption
} from './ancestry';
import type { BackgroundCatalog, BackgroundChoice, BackgroundOption } from './background';
import type {
	ClassCatalog,
	ClassChoice,
	ClassFeature,
	ClassOption,
	ProficiencyRank
} from './class';
import type { FeatCategory, FeatOption } from './feat';

export const abilities: readonly Ability[] = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];

export const FREE_BOOSTS = 4;

export const skillAbilities: Record<string, Ability> = {
	acrobatics: 'DEX',
	arcana: 'INT',
	athletics: 'STR',
	crafting: 'INT',
	deception: 'CHA',
	diplomacy: 'CHA',
	intimidation: 'CHA',
	medicine: 'WIS',
	nature: 'WIS',
	occultism: 'INT',
	performance: 'CHA',
	religion: 'WIS',
	society: 'INT',
	stealth: 'DEX',
	survival: 'WIS',
	thievery: 'DEX'
};

/**
 * Choices made after picking ancestry, background and class. Each dependent group remembers the
 * option it was made for, so changing an earlier step sets those picks aside instead of applying
 * them to the wrong option (and restores them if the player switches back).
 */
export type FinalTouches = {
	ancestry: { for: string | null; alternate: boolean; free: Ability[] };
	background: { for: string | null; picks: Array<Ability | null> };
	class: { for: string | null; key: Ability | null };
	freeBoosts: Ability[];
	skills: string[];
	languages: string[];
	feats: {
		forClass: string | null;
		forAncestry: string | null;
		class: string | null;
		ancestry: string | null;
		skill: string | null;
		general: string | null;
	};
};

export function createEmptyFinalTouches(): FinalTouches {
	return {
		ancestry: { for: null, alternate: false, free: [] },
		background: { for: null, picks: [] },
		class: { for: null, key: null },
		freeBoosts: [],
		skills: [],
		languages: [],
		feats: {
			forClass: null,
			forAncestry: null,
			class: null,
			ancestry: null,
			skill: null,
			general: null
		}
	};
}

export type Selections = {
	ancestry: AncestryOption | null;
	heritage: HeritageOption | null;
	background: BackgroundOption | null;
	classOption: ClassOption | null;
};

export function resolveSelections(
	catalogs: { ancestry: AncestryCatalog; background: BackgroundCatalog; class: ClassCatalog },
	choices: { ancestry: AncestryChoice; background: BackgroundChoice; class: ClassChoice }
): Selections {
	const ancestry =
		catalogs.ancestry.ancestries.find((option) => option.id === choices.ancestry.ancestryId) ??
		null;
	const heritage =
		ancestry &&
		choices.ancestry.heritageId &&
		ancestry.heritageIds.includes(choices.ancestry.heritageId)
			? (catalogs.ancestry.heritages.find((option) => option.id === choices.ancestry.heritageId) ??
				null)
			: null;
	return {
		ancestry,
		heritage,
		background:
			catalogs.background.backgrounds.find(
				(option) => option.id === choices.background.backgroundId
			) ?? null,
		classOption:
			catalogs.class.classes.find((option) => option.id === choices.class.classId) ?? null
	};
}

/** Keeps the first valid, distinct picks, up to `limit`. */
function keepValid(picks: readonly Ability[], allowed: readonly Ability[], limit: number) {
	const kept: Ability[] = [];
	for (const pick of picks) {
		if (kept.length >= limit) break;
		if (allowed.includes(pick) && !kept.includes(pick)) kept.push(pick);
	}
	return kept;
}

export type AncestryBoostPlan = {
	/** Replaces the listed boosts and flaws with two free boosts. */
	alternate: boolean;
	fixed: Ability[];
	flaws: Ability[];
	freeCount: number;
	/** Attributes a free ancestry boost can go to. */
	freeOptions: Ability[];
	free: Ability[];
};

export function planAncestryBoosts(
	ancestry: AncestryOption,
	touches: FinalTouches
): AncestryBoostPlan {
	const own = touches.ancestry.for === ancestry.id;
	const alternate = own && touches.ancestry.alternate;
	const fixed = alternate
		? []
		: ancestry.boosts.filter((boost): boost is Ability => boost !== 'FREE');
	const flaws = alternate ? [] : ancestry.flaws.filter((flaw): flaw is Ability => flaw !== 'FREE');
	const freeCount = alternate ? 2 : ancestry.boosts.filter((boost) => boost === 'FREE').length;
	const freeOptions = abilities.filter((ability) => !fixed.includes(ability));
	const saved = own ? touches.ancestry.free : [];
	return {
		alternate,
		fixed,
		flaws,
		freeCount,
		freeOptions,
		free: keepValid(saved, freeOptions, freeCount)
	};
}

export type BackgroundBoostSlot = { options: Ability[]; pick: Ability | null };

export function planBackgroundBoosts(
	background: BackgroundOption,
	touches: FinalTouches
): BackgroundBoostSlot[] {
	const saved = touches.background.for === background.id ? touches.background.picks : [];
	const taken: Ability[] = [];
	return background.boosts.map((choices, index) => {
		const options = choices.includes('FREE')
			? [...abilities]
			: choices.filter((choice): choice is Ability => choice !== 'FREE');
		const wanted = options.length === 1 ? options[0] : (saved[index] ?? null);
		const pick = wanted && options.includes(wanted) && !taken.includes(wanted) ? wanted : null;
		if (pick) taken.push(pick);
		return { options, pick };
	});
}

export type ClassBoostPlan = { options: Ability[]; key: Ability | null };

export function planClassBoost(classOption: ClassOption, touches: FinalTouches): ClassBoostPlan {
	const options = classOption.keyAbilities.length ? classOption.keyAbilities : [...abilities];
	const saved = touches.class.for === classOption.id ? touches.class.key : null;
	const key = options.length === 1 ? options[0] : saved && options.includes(saved) ? saved : null;
	return { options, key };
}

export type BoostSource = 'ancestry' | 'background' | 'class' | 'free';

export type AttributeScore = {
	ability: Ability;
	modifier: number;
	boosts: BoostSource[];
	flaws: number;
};

export type SkillEntry = {
	key: string;
	ability: Ability;
	trained: boolean;
	/** Why the skill is trained: background, class or the player's own pick. */
	source: 'background' | 'class' | 'choice' | null;
	modifier: number;
};

export type Build = {
	ancestryPlan: AncestryBoostPlan | null;
	backgroundSlots: BackgroundBoostSlot[];
	classPlan: ClassBoostPlan | null;
	freeBoosts: Ability[];
	scores: Record<Ability, AttributeScore>;
	boostsDone: boolean;
	skills: SkillEntry[];
	lore: string[];
	skillPicks: { count: number; chosen: string[]; options: string[] };
	spellcasting: { ability: Ability | null; modifier: number | null } | null;
	featSlots: Array<{
		category: FeatCategory;
		options: FeatOption[];
		chosen: string | null;
	}>;
	languages: { fixed: string[]; options: string[]; count: number; chosen: string[] };
	stats: {
		hp: number | null;
		ac: number;
		perception: number;
		fortitude: number;
		reflex: number;
		will: number;
		classDc: number | null;
		bulk: { encumbered: number; max: number };
	} | null;
	features: Array<{ source: string; items: Array<GrantedFeature | ClassFeature> }>;
};

/** Proficiency bonus at 1st level: level + 2/4/6/8 when trained or better. */
export function proficiencyBonus(rank: ProficiencyRank, level = 1) {
	return rank === 0 ? 0 : level + rank * 2;
}

export function formatModifier(value: number) {
	return value >= 0 ? `+${value}` : `−${Math.abs(value)}`;
}

export function computeBuild(
	selections: Selections,
	touches: FinalTouches,
	feats: FeatOption[] = []
): Build {
	const { ancestry, heritage, background, classOption } = selections;

	const ancestryPlan = ancestry ? planAncestryBoosts(ancestry, touches) : null;
	const backgroundSlots = background ? planBackgroundBoosts(background, touches) : [];
	const classPlan = classOption ? planClassBoost(classOption, touches) : null;
	const freeBoosts = keepValid(touches.freeBoosts, abilities, FREE_BOOSTS);

	const scores = Object.fromEntries(
		abilities.map((ability) => [ability, { ability, modifier: 0, boosts: [], flaws: 0 }])
	) as unknown as Record<Ability, AttributeScore>;
	const boost = (ability: Ability, source: BoostSource) => {
		scores[ability].boosts.push(source);
		scores[ability].modifier += 1;
	};

	if (ancestryPlan) {
		for (const ability of [...ancestryPlan.fixed, ...ancestryPlan.free]) boost(ability, 'ancestry');
		for (const ability of ancestryPlan.flaws) {
			scores[ability].flaws += 1;
			scores[ability].modifier -= 1;
		}
	}
	for (const slot of backgroundSlots) if (slot.pick) boost(slot.pick, 'background');
	if (classPlan?.key) boost(classPlan.key, 'class');
	for (const ability of freeBoosts) boost(ability, 'free');

	const boostsDone =
		!!ancestryPlan &&
		ancestryPlan.free.length === ancestryPlan.freeCount &&
		!!background &&
		backgroundSlots.every((slot) => slot.pick) &&
		!!classPlan?.key &&
		freeBoosts.length === FREE_BOOSTS;

	const mod = (ability: Ability) => scores[ability].modifier;

	const backgroundSkills = background?.skills.filter((skill) => skill in skillAbilities) ?? [];
	const classSkills = classOption?.skills.filter((skill) => skill in skillAbilities) ?? [];
	const automatic = new Set([...backgroundSkills, ...classSkills]);
	const overlaps = classSkills.filter((skill) => backgroundSkills.includes(skill)).length;
	const pickCount = classOption
		? Math.max(0, classOption.additionalSkills + mod('INT')) + overlaps
		: 0;
	const pickOptions = Object.keys(skillAbilities).filter((skill) => !automatic.has(skill));
	const chosenSkills = touches.skills
		.filter((skill, index, all) => pickOptions.includes(skill) && all.indexOf(skill) === index)
		.slice(0, pickCount);

	const skills: SkillEntry[] = Object.entries(skillAbilities).map(([key, ability]) => {
		const source = backgroundSkills.includes(key)
			? 'background'
			: classSkills.includes(key)
				? 'class'
				: chosenSkills.includes(key)
					? 'choice'
					: null;
		return {
			key,
			ability,
			trained: source !== null,
			source,
			modifier: mod(ability) + (source ? proficiencyBonus(1) : 0)
		};
	});

	const fixedLanguages = ancestry?.languages ?? [];
	const languageOptions = (ancestry?.additionalLanguages ?? []).filter(
		(language) => !fixedLanguages.includes(language)
	);
	const languageCount = Math.max(0, mod('INT'));
	const chosenLanguages = touches.languages
		.filter(
			(language, index, all) =>
				languageOptions.includes(language) && all.indexOf(language) === index
		)
		.slice(0, languageCount);

	const keyAbility = classPlan?.key ?? null;
	const spellcasting = classOption?.spellcaster
		? {
				ability: keyAbility,
				modifier: keyAbility === null ? null : mod(keyAbility) + proficiencyBonus(1)
			}
		: null;

	const savedFeats =
		touches.feats.forClass === (classOption?.id ?? null) &&
		touches.feats.forAncestry === (ancestry?.id ?? null)
			? touches.feats
			: { class: null, ancestry: null, skill: null, general: null };
	const hasTrait = (feat: FeatOption, trait: string) => feat.traits.includes(trait);
	const featSlots = (
		[
			classOption?.featLevels.class.includes(1) &&
				classOption && {
					category: 'class' as const,
					options: feats.filter((feat) => hasTrait(feat, classOption.key))
				},
			classOption?.featLevels.ancestry.includes(1) &&
				ancestry && {
					category: 'ancestry' as const,
					options: feats.filter((feat) => hasTrait(feat, ancestry.key))
				},
			classOption?.featLevels.skill.includes(1) && {
				category: 'skill' as const,
				options: feats.filter((feat) => hasTrait(feat, 'skill'))
			},
			classOption?.featLevels.general.includes(1) && {
				category: 'general' as const,
				options: feats.filter((feat) => hasTrait(feat, 'general'))
			}
		] satisfies Array<{ category: FeatCategory; options: FeatOption[] } | false | null | undefined>
	)
		.filter((slot): slot is { category: FeatCategory; options: FeatOption[] } => !!slot)
		.map((slot) => ({
			...slot,
			chosen: slot.options.some((feat) => feat.id === savedFeats[slot.category])
				? savedFeats[slot.category]
				: null
		}));

	const stats = classOption
		? {
				hp: ancestry ? ancestry.hp + classOption.hp + mod('CON') : null,
				ac: 10 + mod('DEX') + proficiencyBonus(classOption.defenses.unarmored),
				perception: mod('WIS') + proficiencyBonus(classOption.perception),
				fortitude: mod('CON') + proficiencyBonus(classOption.saves.fortitude),
				reflex: mod('DEX') + proficiencyBonus(classOption.saves.reflex),
				will: mod('WIS') + proficiencyBonus(classOption.saves.will),
				classDc: classPlan?.key ? 10 + proficiencyBonus(1) + mod(classPlan.key) : null,
				bulk: { encumbered: 5 + mod('STR'), max: 10 + mod('STR') }
			}
		: null;

	const features = [
		{ source: ancestry?.name ?? 'Ancestralidade', items: ancestry?.features ?? [] },
		{ source: heritage?.name ?? 'Herança', items: heritage?.grants ?? [] },
		{ source: background?.name ?? 'Antecedente', items: background?.grants ?? [] },
		{
			source: classOption?.name ?? 'Classe',
			items: classOption?.features.filter((feature) => feature.level === 1) ?? []
		}
	].filter((group) => group.items.length > 0);

	return {
		ancestryPlan,
		backgroundSlots,
		classPlan,
		freeBoosts,
		scores,
		boostsDone,
		skills,
		lore: background?.lore ?? [],
		skillPicks: { count: pickCount, chosen: chosenSkills, options: pickOptions },
		spellcasting,
		featSlots,
		languages: {
			fixed: fixedLanguages,
			options: languageOptions,
			count: languageCount,
			chosen: chosenLanguages
		},
		stats,
		features
	};
}
