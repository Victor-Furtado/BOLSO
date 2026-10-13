import { error, redirect, type Handle } from '@sveltejs/kit';
import { sql } from 'kysely';
import { actorRank, routeRank, type MemberRole } from '$lib/server/auth/access';
import { accountFromCookies } from '$lib/server/auth/session';
import { db } from '$lib/server/db/client';

export const handle: Handle = async ({ event, resolve }) => {
	const account = await accountFromCookies(event.cookies);
	event.locals.account = account;

	let role: MemberRole | null = null;
	if (account) {
		const member = await sql<{ role: MemberRole }>`
			select role from play_members where account_id = ${account.id}
		`.execute(db);
		role = member.rows[0]?.role ?? null;
	}
	event.locals.role = role;

	const required = routeRank(event.route.id);
	const granted = actorRank(account, role);
	if (required > granted) {
		if (!account) redirect(303, '/login');
		error(403, 'Você não tem acesso a esta página.');
	}

	return resolve(event);
};
