import { fail, redirect } from '@sveltejs/kit';
import { findCampaign } from '$lib/server/campaign/campaign.repository';
import {
	ALIVE_CHARACTER_LIMIT,
	listAliveCharacters,
	saveAliveCharacter
} from '$lib/server/characters/character.repository';
import type { Actions } from './$types';
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

export const load: PageServerLoad = async ({ url, locals }) => {
	const campaign = await findCampaign(url.searchParams.get('campaign') ?? 'bolso');
	const characters = locals.account ? await listAliveCharacters(locals.account.id) : [];
	if (characters.length >= ALIVE_CHARACTER_LIMIT) redirect(303, '/personagens');

	return {
		characters,
		aliveLimit: ALIVE_CHARACTER_LIMIT,
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

const PORTRAIT_MAX_CHARS = 400_000;

function portraitBlob(value: FormDataEntryValue | null): string | null | 'invalid' {
	if (value == null || value === '') return null;
	if (typeof value !== 'string' || value.length > PORTRAIT_MAX_CHARS) return 'invalid';
	if (!/^data:image\/(webp|jpeg|png);base64,[A-Za-z0-9+/]+=*$/.test(value)) return 'invalid';
	return value;
}

function textSlug(value: unknown): string | null {
	if (typeof value !== 'string') return null;
	const slug = value.trim();
	if (!slug || slug.length > 80) return null;
	return slug;
}

export const actions: Actions = {
	save: async ({ request, locals }) => {
		const account = locals.account;
		if (!account) return fail(401, { message: 'Entre para salvar um personagem.' });

		const campaign = await findCampaign('bolso');
		if (!campaign) return fail(500, { message: 'A mesa Bolso não está pronta.' });

		const form = await request.formData();
		const body = String(form.get('sheet') ?? '');
		if (body.length > 100_000) return fail(400, { message: 'A ficha é grande demais.' });
		const portrait = portraitBlob(form.get('portrait'));
		if (portrait === 'invalid') {
			return fail(400, {
				message: 'O retrato precisa ser uma imagem quadrada em WebP, JPEG ou PNG.'
			});
		}

		let sheet: {
			version?: number;
			name?: unknown;
			ancestry?: unknown;
			class?: unknown;
		};
		try {
			sheet = JSON.parse(body) as typeof sheet;
		} catch {
			return fail(400, { message: 'A ficha não é um JSON válido.' });
		}

		const name = typeof sheet.name === 'string' ? sheet.name.trim() : '';
		if (sheet.version !== 1 || !name || name.length > 80) {
			return fail(400, { message: 'Dê um nome ao personagem antes de salvar.' });
		}

		const result = await saveAliveCharacter({
			accountId: account.id,
			campaignId: campaign.id,
			name,
			ancestrySlug: textSlug(sheet.ancestry),
			classSlug: textSlug(sheet.class),
			sheet: JSON.stringify({ ...sheet, name }),
			portrait
		});
		if (result === 'full') {
			return fail(409, { message: `Você já tem ${ALIVE_CHARACTER_LIMIT} personagens vivos.` });
		}
		return { saved: name };
	}
};
