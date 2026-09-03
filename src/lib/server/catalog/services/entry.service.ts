import { toAncestries } from '../mappers/entry.mapper';
import { findMany } from '../repositories/entry.repository';
import type { Ancestry } from '../types';

export async function getAncestries(): Promise<Ancestry[]> {
	const result = await findMany({
		type: 'ancestry',
		enabled: true
	});

	return toAncestries(result);
}
