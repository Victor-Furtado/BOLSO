import { randomUUID } from 'node:crypto';
import { db } from '$lib/server/db/client';

export const ALIVE_CHARACTER_LIMIT = 10;

export type CharacterListItem = {
	id: string;
	name: string;
	ancestrySlug: string | null;
	classSlug: string | null;
	sheet: string;
	createdAt: string;
};

export type CharacterRosterItem = CharacterListItem & {
	portrait: string | null;
};

export async function listAliveCharacters(accountId: string): Promise<CharacterListItem[]> {
	const rows = await db
		.selectFrom('play_characters')
		.select(['id', 'name', 'ancestry_slug', 'class_slug', 'sheet', 'created_at'])
		.where('account_id', '=', accountId)
		.where('status', '=', 'alive')
		.orderBy('created_at', 'desc')
		.execute();

	return rows.map((row) => ({
		id: row.id,
		name: row.name,
		ancestrySlug: row.ancestry_slug,
		classSlug: row.class_slug,
		sheet: row.sheet,
		createdAt: row.created_at
	}));
}

export async function listAliveRoster(accountId: string): Promise<CharacterRosterItem[]> {
	const rows = await db
		.selectFrom('play_characters')
		.select(['id', 'name', 'ancestry_slug', 'class_slug', 'sheet', 'portrait', 'created_at'])
		.where('account_id', '=', accountId)
		.where('status', '=', 'alive')
		.orderBy('created_at', 'desc')
		.execute();

	return rows.map((row) => ({
		id: row.id,
		name: row.name,
		ancestrySlug: row.ancestry_slug,
		classSlug: row.class_slug,
		sheet: row.sheet,
		portrait: row.portrait,
		createdAt: row.created_at
	}));
}

export async function saveAliveCharacter(input: {
	accountId: string;
	campaignId: string;
	name: string;
	ancestrySlug: string | null;
	classSlug: string | null;
	sheet: string;
	portrait: string | null;
}): Promise<'saved' | 'full'> {
	return db.transaction().execute(async (trx) => {
		const count = await trx
			.selectFrom('play_characters')
			.select((eb) => eb.fn.countAll<number>().as('total'))
			.where('account_id', '=', input.accountId)
			.where('status', '=', 'alive')
			.executeTakeFirstOrThrow();
		if (Number(count.total) >= ALIVE_CHARACTER_LIMIT) return 'full';

		await trx
			.insertInto('play_characters')
			.values({
				id: randomUUID(),
				account_id: input.accountId,
				campaign_id: input.campaignId,
				name: input.name,
				ancestry_slug: input.ancestrySlug,
				class_slug: input.classSlug,
				status: 'alive',
				sheet: input.sheet,
				portrait: input.portrait,
				created_at: new Date().toISOString()
			})
			.execute();
		return 'saved';
	});
}
