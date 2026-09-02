import type { Generated } from 'kysely';

export interface AncestriesTable {
	id: string;
	name: string;
	img: string | null;
	description: string;
	hp: number;
	hands: number;
	size: string;
	speed: number;
	vision: string;
	boosts: string;
	flaws: string;
	languages: string;
	additional_languages: string;
	traits: string;
	spells: string;
	enable: Generated<number>;
}

export interface FeatsTable {
	id: string;
	name: string;
	action_type: string;
	description: string;
	rarity: string;
	type: string;
	traits: string;
	enable: Generated<number>;
}

export interface AncestryFeatsTable {
	ancestry_id: string;
	feat_id: string;
}

export interface Database {
	ancestries: AncestriesTable;
	feats: FeatsTable;
	ancestry_feats: AncestryFeatsTable;
}
