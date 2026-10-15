import { fail, redirect } from '@sveltejs/kit';
import { randomUUID } from 'node:crypto';
import { hashPassword } from '$lib/server/auth/crypto';
import { openSession } from '$lib/server/auth/session';
import { isTempPassword } from '$lib/server/auth/temp-password';
import { db } from '$lib/server/db/client';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const form = await request.formData();
		const name = String(form.get('name') ?? '').trim();
		const email = String(form.get('email') ?? '')
			.trim()
			.toLowerCase();
		const password = String(form.get('password') ?? '');

		if (!name || name.length > 80 || !email.includes('@') || !isTempPassword(password)) {
			return fail(403, { message: 'O cadastro está desativado.', email });
		}

		const existing = await db
			.selectFrom('play_accounts')
			.select('id')
			.where('email', '=', email)
			.executeTakeFirst();
		if (existing) return fail(400, { message: 'Já existe uma conta com esse e-mail.', email });

		const campaign = await db
			.selectFrom('play_campaigns')
			.select('id')
			.where('slug', '=', 'bolso')
			.executeTakeFirst();
		if (!campaign) return fail(500, { message: 'A mesa Bolso não está pronta.', email });

		const id = randomUUID();
		await db
			.insertInto('play_accounts')
			.values({
				id,
				email,
				display_name: name,
				password_hash: await hashPassword(password),
				admin: 0,
				need_action: 'password_change'
			})
			.execute();
		await db
			.insertInto('play_members')
			.values({ account_id: id, campaign_id: campaign.id, role: 'player', manager: 0 })
			.execute();

		await openSession(id, cookies, false);
		redirect(303, '/senha');
	}
};
