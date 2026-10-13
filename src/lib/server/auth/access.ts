/** Least access to most. A higher rank may open every group below it. Admin is not a rank. */
const GROUPS = ['(public)', '(private)', '(player)', '(gm)'] as const;

export type MemberRole = 'player' | 'gm';

export function routeRank(routeId: string | null): number {
	if (!routeId) return 0;
	let rank = 0;
	for (let index = 0; index < GROUPS.length; index++) {
		if (routeId.includes(GROUPS[index])) rank = index;
	}
	return rank;
}

export function adminRoute(routeId: string | null): boolean {
	return !!routeId?.includes('(admin)');
}

export function actorRank(account: { admin: boolean } | null, role: MemberRole | null): number {
	if (!account) return 0;
	if (role === 'gm') return 3;
	if (role === 'player') return 2;
	return 1;
}
