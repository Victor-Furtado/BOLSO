import type { Handle } from '@sveltejs/kit';
import { accountFromCookies } from '$lib/server/auth/session';

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.account = await accountFromCookies(event.cookies);
	return resolve(event);
};
