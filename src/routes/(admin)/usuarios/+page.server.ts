import { fail } from '@sveltejs/kit';
import { inviteAccount, type InviteSeat } from '$lib/server/auth/invite';
import { db } from '$lib/server/db/client';
import type { Actions, PageServerLoad } from './$types';

const seats = ['player', 'gm', 'admin'] as const;

function isSeat(value: string): value is InviteSeat {
	return seats.includes(value as InviteSeat);
}

export const load: PageServerLoad = async () => {
	const rows = await db
		.selectFrom('play_accounts as a')
		.leftJoin('play_members as m', 'm.account_id', 'a.id')
		.select([
			'a.id',
			'a.display_name as name',
			'a.email',
			'a.admin',
			'a.disabled_at',
			'a.need_action',
			'm.role'
		])
		.orderBy('a.email')
		.execute();

	return {
		users: rows.map((row) => ({
			id: row.id,
			name: row.name || row.email,
			email: row.email,
			seat:
				row.admin === 1
					? ('admin' as const)
					: row.role === 'gm'
						? ('gm' as const)
						: ('player' as const),
			active: !row.disabled_at,
			mustChangePassword: row.need_action === 'password_change'
		}))
	};
};

export const actions: Actions = {
	invite: async ({ request, url }) => {
		const form = await request.formData();
		const name = String(form.get('name') ?? '').trim();
		const email = String(form.get('email') ?? '')
			.trim()
			.toLowerCase();
		const seat = String(form.get('seat') ?? '');
		const temporary = form.get('temporary') === 'on';

		if (!name || name.length > 80 || !email.includes('@') || !isSeat(seat)) {
			return fail(400, { message: 'Informe nome, e-mail e assento.', email });
		}

		const existing = await db
			.selectFrom('play_accounts')
			.select('id')
			.where('email', '=', email)
			.executeTakeFirst();
		if (existing) return fail(400, { message: 'Já existe uma conta com esse e-mail.', email });

		try {
			await inviteAccount({
				name,
				email,
				seat,
				origin: url.origin,
				temporary
			});
		} catch (error) {
			console.error('invite failed', error instanceof Error ? error.message : 'unknown');
			return fail(502, { message: 'A conta não foi criada. O convite não saiu.', email });
		}

		return { invited: true, email, temporary };
	}
};
