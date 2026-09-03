import { AncestryDataSchema } from '../schemas/entry.schema';
import type { Ancestry, Entry } from '../types';

export function toAncestry(entry: Entry): Ancestry {
	if (entry.type !== 'ancestry') {
		throw new Error(`Cannot map catalog entry '${entry.id}' to ancestry`);
	}

	return {
		...entry,
		type: 'ancestry',
		data: AncestryDataSchema.parse(JSON.parse(entry.data))
	};
}

export function toAncestries(entries: Entry[]): Ancestry[] {
	return entries.map(toAncestry);
}
