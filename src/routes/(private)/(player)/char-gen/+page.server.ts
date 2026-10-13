import { findCampaign } from '$lib/server/campaign/campaign.repository';
import {
	restrictAncestryCatalog,
	restrictBackgroundCatalog,
	restrictClassCatalog
} from '$lib/server/campaign/restrict';
import {
	loadAncestryCatalog,
	loadBackgroundCatalog,
	loadClassCatalog,
	loadFeatCatalog
} from '$lib/server/catalog';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const campaign = await findCampaign(url.searchParams.get('campaign'));
	const settings = campaign && {
		slug: campaign.slug,
		name: campaign.name,
		levelMin: campaign.levelMin,
		levelMax: campaign.levelMax,
		maxRarity: campaign.maxRarity
	};

	return {
		campaign: settings,
		ancestryCatalog: loadAncestryCatalog().then((catalog) =>
			restrictAncestryCatalog(catalog, campaign)
		),
		backgroundCatalog: loadBackgroundCatalog().then((catalog) =>
			restrictBackgroundCatalog(catalog, campaign)
		),
		classCatalog: loadClassCatalog().then((catalog) => restrictClassCatalog(catalog, campaign)),
		featCatalog: loadFeatCatalog(campaign?.maxRarity ?? null, campaign?.sources ?? [])
	};
};
