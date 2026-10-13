import type { Ability, Boost, GrantedFeature, Rarity } from './ancestry';

export type BackgroundOrigin = 'core' | 'adventure' | 'lost-omens' | 'society';

export type BackgroundOption = {
	id: string;
	/** Full catalog slug; nested for adventure and Lost Omens backgrounds. */
	slug: string;
	/** Stable catalog key, the slug segment after `pf2e.background`. */
	key: string;
	name: string;
	/** Flavor text, without the rules paragraph. */
	summary: string | null;
	/** Rules paragraph as written in the book. */
	rules: string | null;
	/** Region or ancestry the background requires, e.g. "Região: Terras da Saga". */
	prerequisite: string | null;
	rarity: Rarity;
	legacy: boolean;
	origin: BackgroundOrigin;
	/** Adventure or campaign the background belongs to, when it isn't a core one. */
	originDetail: string | null;
	/** One entry per boost; each lists the attributes it can go to. */
	boosts: Boost[][];
	skills: string[];
	lore: string[];
	grants: GrantedFeature[];
};

export type BackgroundCatalog = {
	backgrounds: BackgroundOption[];
};

export type BackgroundChoice = {
	backgroundId: string | null;
};

export function createEmptyBackgroundChoice(): BackgroundChoice {
	return { backgroundId: null };
}

export const backgroundRarityLabels: Record<Rarity, { singular: string; plural: string }> = {
	common: { singular: 'Comum', plural: 'Comuns' },
	uncommon: { singular: 'Incomum', plural: 'Incomuns' },
	rare: { singular: 'Raro', plural: 'Raros' },
	unique: { singular: 'Único', plural: 'Únicos' }
};

export const backgroundOriginLabels: Record<BackgroundOrigin, string> = {
	core: 'Básico',
	adventure: 'Aventura',
	'lost-omens': 'Lost Omens',
	society: 'Sociedade Pathfinder'
};

export function offersBoost(background: BackgroundOption, ability: Ability) {
	return background.boosts.some((options) => options.includes(ability));
}
