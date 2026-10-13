import type { AncestryCatalog } from '$lib/char-gen/ancestry';
import type { BackgroundCatalog } from '$lib/char-gen/background';
import type { ClassCatalog } from '$lib/char-gen/class';
import type { FeatOption } from '$lib/char-gen/feat';
import {
	listClassDetails,
	listGrants,
	listLevelOneFeats,
	listPlayerDocuments
} from '../repositories/document.repository';
import {
	mapAncestry,
	mapBackground,
	mapClass,
	mapFeat,
	mapHeritage,
	preferRemaster
} from './map-entry';

const STARTING_LEVEL = 1;

export async function loadAncestryCatalog(): Promise<AncestryCatalog> {
	const [ancestryRows, heritageRows] = await Promise.all([
		listPlayerDocuments('ancestry'),
		listPlayerDocuments('heritage')
	]);
	const grants = await listGrants(
		[...ancestryRows, ...heritageRows].map((row) => row.uuid),
		STARTING_LEVEL
	);
	const heritages = preferRemaster(heritageRows.map((row) => mapHeritage(row, grants)));
	const ancestries = preferRemaster(ancestryRows.map((row) => mapAncestry(row, grants))).map(
		(ancestry) => ({
			...ancestry,
			heritageIds: heritages
				.filter(
					(heritage) =>
						heritage.ancestrySlug === ancestry.key || heritage.traits.includes(ancestry.key)
				)
				.map((heritage) => heritage.id)
		})
	);
	return {
		ancestries,
		heritages: heritages.map(({ ancestrySlug: _ancestrySlug, ...heritage }) => heritage)
	};
}

export async function loadBackgroundCatalog(): Promise<BackgroundCatalog> {
	const rows = await listPlayerDocuments('background');
	const grants = await listGrants(
		rows.map((row) => row.uuid),
		STARTING_LEVEL
	);
	return { backgrounds: preferRemaster(rows.map((row) => mapBackground(row, grants))) };
}

export async function loadClassCatalog(): Promise<ClassCatalog> {
	const rows = await listPlayerDocuments('class');
	const [details, grants] = await Promise.all([
		listClassDetails(rows.map((row) => row.uuid)),
		listGrants(
			rows.map((row) => row.uuid),
			STARTING_LEVEL
		)
	]);
	const byUuid = new Map(details.map((row) => [row.document_uuid, row]));
	return {
		classes: preferRemaster(rows.map((row) => mapClass(row, byUuid.get(row.uuid), grants)))
	};
}

export async function loadFeatCatalog(
	maxRarity: 'common' | 'uncommon' | 'rare' | 'unique' | null,
	sources: string[] = []
): Promise<FeatOption[]> {
	if (!maxRarity) return [];
	const rows = await listLevelOneFeats(maxRarity, sources);
	return preferRemaster(
		rows.map((row) => ({ ...mapFeat(row), key: row.slug ?? row.uuid, legacy: row.remaster === 0 }))
	).map(({ key: _key, legacy: _legacy, ...feat }) => feat);
}
