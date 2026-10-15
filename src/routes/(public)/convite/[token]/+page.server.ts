import { redirect } from '@sveltejs/kit';
import { accountIdForInvite } from '$lib/server/auth/invite';
import { openSession } from '$lib/server/auth/session';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, cookies }) => {
	const accountId = await accountIdForInvite(params.token ?? '');
	if (!accountId) return { invalid: true };
	await openSession(accountId, cookies, false);
	redirect(303, '/senha');
};
