import type { Selectable } from 'kysely';
import type { CatalogEntry } from '../db/types';
import type { AncestryData } from './schemas/entry.schema';

export type Entry = Selectable<CatalogEntry>;

export type Ancestry = Omit<Selectable<CatalogEntry>, 'type' | 'data'> & {
	type: 'ancestry';
	data: AncestryData;
};
