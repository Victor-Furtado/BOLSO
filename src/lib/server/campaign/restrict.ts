import type { AncestryCatalog } from '$lib/char-gen/ancestry';
import type { BackgroundCatalog } from '$lib/char-gen/background';
import type { ClassCatalog } from '$lib/char-gen/class';
import type { CampaignRecord } from './campaign.repository';

const RARITY_RANK = { common: 0, uncommon: 1, rare: 2, unique: 3 } as const;

function withinRarity(rarity: string, max: CampaignRecord['maxRarity']): boolean {
	const rank = RARITY_RANK[rarity as keyof typeof RARITY_RANK] ?? 0;
	return rank <= RARITY_RANK[max];
}

export function restrictAncestryCatalog(
	catalog: AncestryCatalog,
	campaign: CampaignRecord | null
): AncestryCatalog {
	if (!campaign) return { ancestries: [], heritages: [] };
	const heritages = catalog.heritages.filter(
		(heritage) =>
			campaign.options.heritage.has(heritage.id) &&
			withinRarity(heritage.rarity, campaign.maxRarity)
	);
	const heritageIds = new Set(heritages.map((heritage) => heritage.id));
	return {
		ancestries: catalog.ancestries
			.filter(
				(ancestry) =>
					campaign.options.ancestry.has(ancestry.id) &&
					withinRarity(ancestry.rarity, campaign.maxRarity)
			)
			.map((ancestry) => ({
				...ancestry,
				heritageIds: ancestry.heritageIds.filter((id) => heritageIds.has(id))
			})),
		heritages
	};
}

export function restrictBackgroundCatalog(
	catalog: BackgroundCatalog,
	campaign: CampaignRecord | null
): BackgroundCatalog {
	if (!campaign) return { backgrounds: [] };
	return {
		backgrounds: catalog.backgrounds.filter(
			(background) =>
				campaign.options.background.has(background.id) &&
				withinRarity(background.rarity, campaign.maxRarity)
		)
	};
}

export function restrictClassCatalog(
	catalog: ClassCatalog,
	campaign: CampaignRecord | null
): ClassCatalog {
	if (!campaign) return { classes: [] };
	return {
		classes: catalog.classes.filter(
			(characterClass) =>
				campaign.options.class.has(characterClass.id) &&
				withinRarity(characterClass.rarity, campaign.maxRarity)
		)
	};
}
