import { fail, redirect } from '@sveltejs/kit';
import { sql } from 'kysely';
import { hashPassword, verifyPassword } from '$lib/server/auth/crypto';
import { openSession, revokeSession } from '$lib/server/auth/session';
import { db } from '$lib/server/db/client';
import { actorRank } from '$lib/server/auth/access';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals }) => {
	if (actorRank(locals.account, locals.role) >= 2) redirect(303, '/');
	return {};
};

export const actions: Actions = {
	login: async ({ request, cookies }) => {
		const form = await request.formData();
		const email = String(form.get('email') ?? '')
			.trim()
			.toLowerCase();
		const password = String(form.get('password') ?? '');
		const remember = form.get('remember') === 'on';

		if (!email || !password) {
			return fail(400, { message: 'Informe e-mail e senha.', email });
		}

		const found = await sql<{
			id: string;
			password_hash: string;
			disabled_at: string | null;
		}>`
			select id, password_hash, disabled_at
			from play_accounts
			where email = ${email}
		`.execute(db);
		const account = found.rows[0];
		const valid = account
			? verifyPassword(password, account.password_hash)
			: verifyPassword(password, dummyHash);
		if (!account || account.disabled_at || !valid) {
			return fail(400, { message: 'E-mail ou senha incorretos.', email });
		}

		await openSession(account.id, cookies, remember);
		redirect(303, '/');
	},
	logout: async ({ cookies }) => {
		await revokeSession(cookies);
		redirect(303, '/login');
	}
};

const dummyHash = hashPassword('bolso-login-dummy');
