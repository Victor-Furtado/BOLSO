import { randomUUID } from 'node:crypto';
import { sql } from 'kysely';
import type { Cookies } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { db } from '$lib/server/db/client';
import { getEnv } from '$lib/utils/env';
import { readJwt, signJwt } from './crypto';

export const SESSION_COOKIE = 'bolso_session';
export const REFRESH_COOKIE = 'bolso_refresh';

const ACCESS_SECONDS = 15 * 60;
const REFRESH_SECONDS = 30 * 24 * 60 * 60;

export type Account = {
	id: string;
	email: string;
	admin: boolean;
};

type SessionRow = {
	id: string;
	account_id: string;
	family_id: string;
	expires_at: string;
	revoked_at: string | null;
	email: string;
	admin: number;
	disabled_at: string | null;
};

function cookieBase(maxAge?: number) {
	return {
		path: '/',
		httpOnly: true,
		secure: !dev,
		sameSite: 'lax' as const,
		...(maxAge === undefined ? {} : { maxAge })
	};
}

function accessToken(accountId: string, sessionId: string): string {
	return signJwt(
		{ sub: accountId, sid: sessionId, exp: Math.floor(Date.now() / 1000) + ACCESS_SECONDS },
		getEnv().JWT_SECRET
	);
}

export async function openSession(
	accountId: string,
	cookies: Cookies,
	remember: boolean
): Promise<void> {
	const id = randomUUID();
	const familyId = randomUUID();
	const expiresAt = new Date(Date.now() + REFRESH_SECONDS * 1000).toISOString();
	await sql`
		insert into play_sessions (id, account_id, family_id, expires_at)
		values (${id}, ${accountId}, ${familyId}, ${expiresAt})
	`.execute(db);
	const refreshMaxAge = remember ? REFRESH_SECONDS : undefined;
	cookies.set(SESSION_COOKIE, accessToken(accountId, id), cookieBase(ACCESS_SECONDS));
	cookies.set(REFRESH_COOKIE, id, cookieBase(refreshMaxAge));
}

export function clearSessionCookies(cookies: Cookies): void {
	cookies.delete(SESSION_COOKIE, { path: '/' });
	cookies.delete(REFRESH_COOKIE, { path: '/' });
}

async function sessionById(id: string): Promise<SessionRow | undefined> {
	const result = await sql<SessionRow>`
		select s.id, s.account_id, s.family_id, s.expires_at, s.revoked_at,
			a.email, a.admin, a.disabled_at
		from play_sessions s
		join play_accounts a on a.id = s.account_id
		where s.id = ${id}
	`.execute(db);
	return result.rows[0];
}

function usable(row: SessionRow | undefined): row is SessionRow {
	return (
		!!row && !row.revoked_at && !row.disabled_at && new Date(row.expires_at).getTime() > Date.now()
	);
}

async function revokeFamily(familyId: string): Promise<void> {
	const now = new Date().toISOString();
	await sql`
		update play_sessions
		set revoked_at = ${now}
		where family_id = ${familyId} and revoked_at is null
	`.execute(db);
}

export async function accountFromCookies(cookies: Cookies): Promise<Account | null> {
	const access = cookies.get(SESSION_COOKIE);
	const claims = access ? readJwt(access, getEnv().JWT_SECRET) : null;
	if (claims) {
		const row = await sessionById(claims.sid);
		if (usable(row) && row.account_id === claims.sub) {
			return { id: row.account_id, email: row.email, admin: row.admin === 1 };
		}
	}

	const refreshId = cookies.get(REFRESH_COOKIE);
	if (!refreshId) return null;
	const current = await sessionById(refreshId);
	if (!current) return null;
	if (current.revoked_at) {
		await revokeFamily(current.family_id);
		clearSessionCookies(cookies);
		return null;
	}
	if (!usable(current)) {
		clearSessionCookies(cookies);
		return null;
	}

	const nextId = randomUUID();
	const now = new Date().toISOString();
	await sql`
		insert into play_sessions (id, account_id, family_id, expires_at)
		values (${nextId}, ${current.account_id}, ${current.family_id}, ${current.expires_at})
	`.execute(db);
	await sql`update play_sessions set revoked_at = ${now} where id = ${current.id}`.execute(db);
	cookies.set(SESSION_COOKIE, accessToken(current.account_id, nextId), cookieBase(ACCESS_SECONDS));
	cookies.set(REFRESH_COOKIE, nextId, cookieBase(REFRESH_SECONDS));
	return { id: current.account_id, email: current.email, admin: current.admin === 1 };
}

export async function revokeSession(cookies: Cookies): Promise<void> {
	const refreshId = cookies.get(REFRESH_COOKIE);
	if (refreshId) {
		const now = new Date().toISOString();
		await sql`update play_sessions set revoked_at = ${now} where id = ${refreshId}`.execute(db);
	}
	clearSessionCookies(cookies);
}
