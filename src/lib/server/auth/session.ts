import { randomUUID } from 'node:crypto';
import type { Cookies } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { db } from '$lib/server/db/client';
import { getEnv } from '$lib/utils/env';
import { hashRefreshSecret, newRefreshSecret, readJwt, signJwt } from './crypto';

export const SESSION_COOKIE = 'bolso_session';
export const REFRESH_COOKIE = 'bolso_refresh';

const ACCESS_SECONDS = 15 * 60;
const REFRESH_SECONDS = 30 * 24 * 60 * 60;
const PASSWORD_MAX = 256;
export const PASSWORD_MIN = 8;

export type Account = {
	id: string;
	email: string;
	admin: boolean;
	needAction: string | null;
};

type SessionRow = {
	id: string;
	account_id: string;
	family_id: string;
	expires_at: string;
	revoked_at: string | null;
	persistent: number;
	email: string;
	admin: number;
	disabled_at: string | null;
	need_action: string | null;
};

export function passwordAcceptable(password: string): boolean {
	return password.length > 0 && password.length <= PASSWORD_MAX;
}

export function newPasswordAcceptable(password: string): boolean {
	return password.length >= PASSWORD_MIN && password.length <= PASSWORD_MAX;
}

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

function refreshMaxAge(persistent: boolean): number | undefined {
	return persistent ? REFRESH_SECONDS : undefined;
}

function sessionQuery() {
	return db
		.selectFrom('play_sessions as s')
		.innerJoin('play_accounts as a', 'a.id', 's.account_id')
		.select([
			's.id',
			's.account_id',
			's.family_id',
			's.expires_at',
			's.revoked_at',
			's.persistent',
			'a.email',
			'a.admin',
			'a.disabled_at',
			'a.need_action'
		]);
}

async function insertSession(
	accountId: string,
	familyId: string,
	expiresAt: string,
	secret: string,
	persistent: boolean
): Promise<string> {
	const id = randomUUID();
	await db
		.insertInto('play_sessions')
		.values({
			id,
			account_id: accountId,
			family_id: familyId,
			expires_at: expiresAt,
			token_hash: hashRefreshSecret(secret),
			persistent: persistent ? 1 : 0,
			created_at: new Date().toISOString()
		})
		.execute();
	return id;
}

export async function openSession(
	accountId: string,
	cookies: Cookies,
	remember: boolean
): Promise<void> {
	const secret = newRefreshSecret();
	const familyId = randomUUID();
	const expiresAt = new Date(Date.now() + REFRESH_SECONDS * 1000).toISOString();
	const id = await insertSession(accountId, familyId, expiresAt, secret, remember);
	cookies.set(SESSION_COOKIE, accessToken(accountId, id), cookieBase(ACCESS_SECONDS));
	cookies.set(REFRESH_COOKIE, secret, cookieBase(refreshMaxAge(remember)));
}

export function clearSessionCookies(cookies: Cookies): void {
	cookies.delete(SESSION_COOKIE, { path: '/' });
	cookies.delete(REFRESH_COOKIE, { path: '/' });
}

function usable(row: SessionRow | undefined): row is SessionRow {
	return (
		!!row && !row.revoked_at && !row.disabled_at && new Date(row.expires_at).getTime() > Date.now()
	);
}

async function revokeFamily(familyId: string): Promise<void> {
	await db
		.updateTable('play_sessions')
		.set({ revoked_at: new Date().toISOString() })
		.where('family_id', '=', familyId)
		.where('revoked_at', 'is', null)
		.execute();
}

function accountOf(row: SessionRow): Account {
	return {
		id: row.account_id,
		email: row.email,
		admin: row.admin === 1,
		needAction: row.need_action
	};
}

export async function accountFromCookies(cookies: Cookies): Promise<Account | null> {
	const access = cookies.get(SESSION_COOKIE);
	const claims = access ? readJwt(access, getEnv().JWT_SECRET) : null;
	if (claims) {
		const row = await sessionQuery().where('s.id', '=', claims.sid).executeTakeFirst();
		if (usable(row) && row.account_id === claims.sub) return accountOf(row);
	}

	const refreshSecret = cookies.get(REFRESH_COOKIE);
	if (!refreshSecret) return null;
	const current = await sessionQuery()
		.where('s.token_hash', '=', hashRefreshSecret(refreshSecret))
		.executeTakeFirst();
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

	const claimed = await db
		.updateTable('play_sessions')
		.set({ revoked_at: new Date().toISOString() })
		.where('id', '=', current.id)
		.where('revoked_at', 'is', null)
		.executeTakeFirst();
	if (Number(claimed.numUpdatedRows) !== 1) {
		const successor = await db
			.selectFrom('play_sessions')
			.select('id')
			.where('family_id', '=', current.family_id)
			.where('revoked_at', 'is', null)
			.executeTakeFirst();
		if (!successor) {
			await revokeFamily(current.family_id);
			clearSessionCookies(cookies);
		}
		return null;
	}

	const secret = newRefreshSecret();
	const persistent = current.persistent === 1;
	const nextId = await insertSession(
		current.account_id,
		current.family_id,
		current.expires_at,
		secret,
		persistent
	);
	cookies.set(SESSION_COOKIE, accessToken(current.account_id, nextId), cookieBase(ACCESS_SECONDS));
	cookies.set(REFRESH_COOKIE, secret, cookieBase(refreshMaxAge(persistent)));
	return accountOf(current);
}

export async function revokeSession(cookies: Cookies): Promise<void> {
	const refreshSecret = cookies.get(REFRESH_COOKIE);
	if (refreshSecret) {
		await db
			.updateTable('play_sessions')
			.set({ revoked_at: new Date().toISOString() })
			.where('token_hash', '=', hashRefreshSecret(refreshSecret))
			.where('revoked_at', 'is', null)
			.execute();
	}
	clearSessionCookies(cookies);
}
