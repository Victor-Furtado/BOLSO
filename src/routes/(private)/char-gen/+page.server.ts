import { getAncestries } from '$lib/server/catalog/services/entry.service';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => ({
	ancestries: await getAncestries()
});
