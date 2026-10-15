import {
	ALIVE_CHARACTER_LIMIT,
	listAliveRoster
} from '$lib/server/characters/character.repository';
import { loadAncestryCatalog, loadBackgroundCatalog, loadClassCatalog } from '$lib/server/catalog';
import type { PageServerLoad } from './$types';

function label(slug: string | undefined, names: Map<string, string>): string | null {
	if (!slug) return null;
	const known = names.get(slug);
	if (known) return known;
	const tail = slug.split('.').pop() ?? slug;
	return tail
		.split('-')
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(' ');
}

export const load: PageServerLoad = async ({ locals }) => {
	const characters = locals.account ? await listAliveRoster(locals.account.id) : [];
	const [ancestries, backgrounds, classes] = await Promise.all([
		loadAncestryCatalog(),
		loadBackgroundCatalog(),
		loadClassCatalog()
	]);
	const names = new Map<string, string>();
	for (const option of [
		...ancestries.ancestries,
		...ancestries.heritages,
		...backgrounds.backgrounds,
		...classes.classes
	]) {
		names.set(option.slug, option.name);
	}

	return {
		aliveLimit: ALIVE_CHARACTER_LIMIT,
		characters: characters.map((character) => {
			let sheet: { heritage?: string; background?: string; level?: number } = {};
			try {
				sheet = JSON.parse(character.sheet) as typeof sheet;
			} catch {
				sheet = {};
			}
			const ancestry = label(character.ancestrySlug ?? undefined, names);
			const heritage = label(sheet.heritage, names);
			const background = label(sheet.background, names);
			const characterClass = label(character.classSlug ?? undefined, names);
			const people = [ancestry, heritage].filter(Boolean).join(', ');
			const subtitle = [people, characterClass, background].filter(Boolean).join(' · ');
			return {
				id: character.id,
				name: character.name,
				subtitle: subtitle || 'Ficha sem ancestralidade',
				level: sheet.level ?? 1,
				portrait: character.portrait
			};
		})
	};
};
