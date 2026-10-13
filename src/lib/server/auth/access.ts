/** Least access to most. A higher rank may open every group below it. */
const GROUPS = ['(public)', '(private)', '(player)', '(gm)', '(admin)'] as const;

export type MemberRole = 'player' | 'gm';

export function routeRank(routeId: string | null): number {
	if (!routeId) return 0;
	let rank = 0;
	for (let index = 0; index < GROUPS.length; index++) {
		if (routeId.includes(GROUPS[index])) rank = index;
	}
	return rank;
}

export function actorRank(account: { admin: boolean } | null, role: MemberRole | null): number {
	if (!account) return 0;
	if (account.admin) return 4;
	if (role === 'gm') return 3;
	if (role === 'player') return 2;
	return 1;
}
