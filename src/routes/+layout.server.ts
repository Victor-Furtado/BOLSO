import { actorRank } from '$lib/server/auth/access';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ locals }) => {
	return {
		account: locals.account,
		access: actorRank(locals.account, locals.role),
		admin: locals.account?.admin ?? false
	};
};
