import { toAncestries, toFeat } from '../mappers/entry.mapper';
import { findGrantedFeatsBySourceIds, findMany } from '../repositories/entry.repository';
import type { Ancestry, Feat } from '../types';

export async function getAncestries(): Promise<Ancestry[]> {
	const ancestries = await findMany({
		type: 'ancestry',
		enabled: true
	});

	const granted = await findGrantedFeatsBySourceIds(ancestries.map((entry) => entry.id));
	const featsByAncestryId = new Map<string, Feat[]>();

	for (const row of granted) {
		const { source_entry_id, ...entry } = row;
		const feats = featsByAncestryId.get(source_entry_id) ?? [];
		feats.push(toFeat(entry));
		featsByAncestryId.set(source_entry_id, feats);
	}

	return toAncestries(ancestries, featsByAncestryId);
}
