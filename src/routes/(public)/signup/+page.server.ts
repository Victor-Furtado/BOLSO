import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async () => fail(403, { message: 'O cadastro está desativado.' })
};
