import { error, redirect, type Handle } from '@sveltejs/kit';
import { actorRank, adminRoute, routeRank, type MemberRole } from '$lib/server/auth/access';
import { accountFromCookies } from '$lib/server/auth/session';
import { db } from '$lib/server/db/client';

export const handle: Handle = async ({ event, resolve }) => {
	const account = await accountFromCookies(event.cookies);
	event.locals.account = account;

	let role: MemberRole | null = null;
	if (account) {
		const member = await db
			.selectFrom('play_members')
			.select('role')
			.where('account_id', '=', account.id)
			.executeTakeFirst();
		role = member?.role === 'player' || member?.role === 'gm' ? member.role : null;
	}
	event.locals.role = role;

	if (adminRoute(event.route.id)) {
		if (!account) redirect(303, '/login');
		if (!account.admin) error(403, 'Você não tem acesso a esta página.');
	}

	const required = routeRank(event.route.id);
	const granted = actorRank(account, role);
	if (required > granted) {
		if (!account) redirect(303, '/login');
		error(403, 'Você não tem acesso a esta página.');
	}

	return resolve(event);
};
