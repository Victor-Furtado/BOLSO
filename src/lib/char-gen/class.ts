import type { Ability, GrantedFeature, Rarity } from './ancestry';

/** 0 untrained, 1 trained, 2 expert, 3 master, 4 legendary. */
export type ProficiencyRank = 0 | 1 | 2 | 3 | 4;

export type ClassFeature = GrantedFeature & { level: number };

export type ClassOption = {
	id: string;
	slug: string;
	key: string;
	name: string;
	image: string;
	description: string | null;
	rarity: Rarity;
	legacy: boolean;
	hp: number;
	/** Empty when a subclass decides it (e.g. the psychic's subconscious mind). */
	keyAbilities: Ability[];
	spellcaster: boolean;
	perception: ProficiencyRank;
	saves: { fortitude: ProficiencyRank; reflex: ProficiencyRank; will: ProficiencyRank };
	attacks: {
		simple: ProficiencyRank;
		martial: ProficiencyRank;
		advanced: ProficiencyRank;
		unarmed: ProficiencyRank;
		other: { name: string; rank: ProficiencyRank } | null;
	};
	defenses: {
		unarmored: ProficiencyRank;
		light: ProficiencyRank;
		medium: ProficiencyRank;
		heavy: ProficiencyRank;
	};
	skills: string[];
	/** Extra trained skills of the player's choice, before Intelligence. */
	additionalSkills: number;
	features: ClassFeature[];
	featLevels: {
		class: number[];
		ancestry: number[];
		general: number[];
		skill: number[];
		skillIncrease: number[];
	};
};

export type ClassCatalog = {
	classes: ClassOption[];
};

export type ClassChoice = {
	classId: string | null;
};

export function createEmptyClassChoice(): ClassChoice {
	return { classId: null };
}

export const classRarityLabels: Record<Rarity, { singular: string; plural: string }> = {
	common: { singular: 'Comum', plural: 'Comuns' },
	uncommon: { singular: 'Incomum', plural: 'Incomuns' },
	rare: { singular: 'Rara', plural: 'Raras' },
	unique: { singular: 'Única', plural: 'Únicas' }
};

export const proficiencyLabels: Record<ProficiencyRank, string> = {
	0: 'Destreinado',
	1: 'Treinado',
	2: 'Especialista',
	3: 'Mestre',
	4: 'Lendário'
};
