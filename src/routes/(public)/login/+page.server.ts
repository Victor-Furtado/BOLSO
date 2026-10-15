import { fail, redirect } from '@sveltejs/kit';
import { hashPassword, verifyPassword } from '$lib/server/auth/crypto';
import { openSession, passwordAcceptable, revokeSession } from '$lib/server/auth/session';
import { isTempPassword } from '$lib/server/auth/temp-password';
import { db } from '$lib/server/db/client';
import type { Actions, PageServerLoad } from './$types';

const FAILURE_WINDOW_MS = 15 * 60 * 1000;
const FAILURE_LIMIT = 8;
const failures = new Map<string, number[]>();

function tooManyFailures(key: string): boolean {
	const now = Date.now();
	const recent = (failures.get(key) ?? []).filter((at) => now - at < FAILURE_WINDOW_MS);
	failures.set(key, recent);
	return recent.length >= FAILURE_LIMIT;
}

function noteFailure(key: string): void {
	const now = Date.now();
	const recent = (failures.get(key) ?? []).filter((at) => now - at < FAILURE_WINDOW_MS);
	recent.push(now);
	failures.set(key, recent);
}

export const load: PageServerLoad = ({ locals }) => {
	if (locals.account?.needAction === 'password_change') redirect(303, '/senha');
	if (locals.account) redirect(303, '/');
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
		if (!passwordAcceptable(password)) {
			return fail(400, { message: 'E-mail ou senha incorretos.', email });
		}

		const limitKey = `${email}`;
		if (tooManyFailures(limitKey)) {
			return fail(429, { message: 'Muitas tentativas. Espere e tente de novo.', email });
		}

		const account = await db
			.selectFrom('play_accounts')
			.select(['id', 'password_hash', 'disabled_at', 'need_action'])
			.where('email', '=', email)
			.executeTakeFirst();
		const valid = account
			? await verifyPassword(password, account.password_hash)
			: await verifyPassword(password, await dummyHash);
		if (!account || account.disabled_at || !valid) {
			noteFailure(limitKey);
			return fail(400, { message: 'E-mail ou senha incorretos.', email });
		}

		const mustChange = account.need_action === 'password_change' || isTempPassword(password);
		if (mustChange && account.need_action !== 'password_change') {
			await db
				.updateTable('play_accounts')
				.set({ need_action: 'password_change' })
				.where('id', '=', account.id)
				.execute();
		}

		await openSession(account.id, cookies, remember);
		redirect(303, mustChange ? '/senha' : '/');
	},
	logout: async ({ cookies }) => {
		await revokeSession(cookies);
		redirect(303, '/login');
	}
};

const dummyHash = hashPassword('bolso-login-dummy');
