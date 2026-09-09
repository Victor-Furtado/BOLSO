import type { Selectable } from 'kysely';
import type { CatalogEntry } from '../db/types';
import type { AncestryData, FeatData } from './schemas/entry.schema';

export type Entry = Selectable<CatalogEntry>;

type CatalogEntryBase = Omit<Selectable<CatalogEntry>, 'type' | 'data' | 'traits'>;

export type Feat = CatalogEntryBase & {
	type: 'feat';
	traits: string[];
	data: FeatData;
};

export type Ancestry = CatalogEntryBase & {
	type: 'ancestry';
	traits: string[];
	data: AncestryData;
	feats: Feat[];
};
