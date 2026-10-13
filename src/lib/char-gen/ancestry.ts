export type Ability = 'STR' | 'DEX' | 'CON' | 'INT' | 'WIS' | 'CHA';
export type Boost = Ability | 'FREE';
export type Rarity = 'common' | 'uncommon' | 'rare' | 'unique';
export type Size = 'tiny' | 'sm' | 'med' | 'lg' | 'huge';

export type GrantedFeature = {
	name: string;
	type: string;
	description: string | null;
};

export const featureTypeLabels: Record<string, string> = {
	feat: 'Talento',
	action: 'Ação',
	classfeature: 'Habilidade de classe'
};

export type HeritageOption = {
	id: string;
	/** Full catalog slug, e.g. `pf2e.heritage.forge-dwarf`. */
	slug: string;
	/** Stable catalog key, the last segment of `pf2e.heritage.*`. */
	key: string;
	name: string;
	image: string | null;
	description: string | null;
	rarity: Rarity;
	traits: string[];
	versatile: boolean;
	legacy: boolean;
	grants: GrantedFeature[];
};

export type AncestryOption = {
	id: string;
	slug: string;
	key: string;
	name: string;
	image: string;
	description: string | null;
	rarity: Rarity;
	traits: string[];
	legacy: boolean;
	hp: number;
	size: Size;
	speed: number;
	vision: string;
	boosts: Boost[];
	flaws: Boost[];
	languages: string[];
	additionalLanguages: string[];
	features: GrantedFeature[];
	heritageIds: string[];
};

export type AncestryCatalog = {
	ancestries: AncestryOption[];
	heritages: HeritageOption[];
};

export type AncestryChoice = {
	ancestryId: string | null;
	heritageId: string | null;
};

export function createEmptyAncestryChoice(): AncestryChoice {
	return { ancestryId: null, heritageId: null };
}

export const rarityOrder: readonly Rarity[] = ['common', 'uncommon', 'rare', 'unique'];

export const rarityLabels: Record<Rarity, { singular: string; plural: string }> = {
	common: { singular: 'Comum', plural: 'Comuns' },
	uncommon: { singular: 'Incomum', plural: 'Incomuns' },
	rare: { singular: 'Rara', plural: 'Raras' },
	unique: { singular: 'Única', plural: 'Únicas' }
};

export const abilityLabels: Record<Boost, { short: string; full: string }> = {
	STR: { short: 'For', full: 'Força' },
	DEX: { short: 'Des', full: 'Destreza' },
	CON: { short: 'Con', full: 'Constituição' },
	INT: { short: 'Int', full: 'Inteligência' },
	WIS: { short: 'Sab', full: 'Sabedoria' },
	CHA: { short: 'Car', full: 'Carisma' },
	FREE: { short: 'Livre', full: 'Livre' }
};
