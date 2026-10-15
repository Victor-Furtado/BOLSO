import { fail, redirect } from '@sveltejs/kit';
import { hashPassword, verifyPassword } from '$lib/server/auth/crypto';
import { newPasswordAcceptable, PASSWORD_MIN } from '$lib/server/auth/session';
import { db } from '$lib/server/db/client';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals }) => {
	return { min: PASSWORD_MIN, invited: locals.account?.needAction === 'password_change' };
};

export const actions: Actions = {
	default: async ({ locals, request }) => {
		const account = locals.account;
		if (!account) redirect(303, '/login');

		const invited = account.needAction === 'password_change';
		const form = await request.formData();
		const current = String(form.get('current') ?? '');
		const next = String(form.get('next') ?? '');
		const confirm = String(form.get('confirm') ?? '');

		if (!newPasswordAcceptable(next)) {
			return fail(400, {
				message: `A nova senha precisa ter entre ${PASSWORD_MIN} e 256 caracteres.`
			});
		}
		if (next !== confirm) return fail(400, { message: 'A confirmação não confere.' });

		const row = await db
			.selectFrom('play_accounts')
			.select(['password_hash', 'disabled_at'])
			.where('id', '=', account.id)
			.executeTakeFirst();
		if (!row || row.disabled_at) return fail(400, { message: 'Esta conta não pode entrar.' });
		if (!invited && (next === current || !(await verifyPassword(current, row.password_hash)))) {
			return fail(400, { message: 'A senha atual está incorreta.' });
		}

		await db
			.updateTable('play_accounts')
			.set({
				password_hash: await hashPassword(next),
				need_action: null,
				invite_token_hash: null,
				invite_expires_at: null
			})
			.where('id', '=', account.id)
			.execute();

		redirect(303, '/');
	}
};
