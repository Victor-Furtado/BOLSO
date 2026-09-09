import { AncestryDataSchema, FeatDataSchema } from '../schemas/entry.schema';
import type { Ancestry, Entry, Feat } from '../types';

function parseTraits(traits: string): string[] {
	try {
		const parsed = JSON.parse(traits);
		return Array.isArray(parsed) ? parsed.filter((trait) => typeof trait === 'string') : [];
	} catch {
		return [];
	}
}

export function toFeat(entry: Entry): Feat {
	if (entry.type !== 'feat') {
		throw new Error(`Cannot map catalog entry '${entry.id}' to feat`);
	}

	return {
		...entry,
		type: 'feat',
		traits: parseTraits(entry.traits),
		data: FeatDataSchema.parse(JSON.parse(entry.data))
	};
}

export function toFeats(entries: Entry[]): Feat[] {
	return entries.map(toFeat);
}

export function toAncestry(entry: Entry, feats: Feat[] = []): Ancestry {
	if (entry.type !== 'ancestry') {
		throw new Error(`Cannot map catalog entry '${entry.id}' to ancestry`);
	}

	return {
		...entry,
		type: 'ancestry',
		traits: parseTraits(entry.traits),
		data: AncestryDataSchema.parse(JSON.parse(entry.data)),
		feats
	};
}

export function toAncestries(
	entries: Entry[],
	featsByAncestryId: Map<string, Feat[]> = new Map()
): Ancestry[] {
	return entries.map((entry) => toAncestry(entry, featsByAncestryId.get(entry.id) ?? []));
}
