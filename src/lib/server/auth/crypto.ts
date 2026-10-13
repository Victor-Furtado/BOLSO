import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const KEY_LENGTH = 32;

export function hashPassword(password: string): string {
	const salt = randomBytes(16);
	const hash = scryptSync(password, salt, KEY_LENGTH);
	return `scrypt$${salt.toString('base64url')}$${hash.toString('base64url')}`;
}

export function verifyPassword(password: string, stored: string): boolean {
	const [scheme, salt, hash] = stored.split('$');
	if (scheme !== 'scrypt' || !salt || !hash) return false;
	const actual = scryptSync(password, Buffer.from(salt, 'base64url'), KEY_LENGTH);
	const expected = Buffer.from(hash, 'base64url');
	if (actual.length !== expected.length) return false;
	return timingSafeEqual(actual, expected);
}

function base64url(value: Buffer | string): string {
	return Buffer.from(value).toString('base64url');
}

export function signJwt(payload: Record<string, unknown>, secret: string): string {
	const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
	const body = base64url(JSON.stringify(payload));
	const signature = createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
	return `${header}.${body}.${signature}`;
}

export function readJwt(
	token: string,
	secret: string
): { sub: string; sid: string; exp: number } | null {
	const [header, body, signature] = token.split('.');
	if (!header || !body || !signature) return null;
	const expected = createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
	const actual = Buffer.from(signature);
	const wanted = Buffer.from(expected);
	if (actual.length !== wanted.length || !timingSafeEqual(actual, wanted)) return null;
	try {
		const payload = JSON.parse(Buffer.from(body, 'base64url').toString()) as {
			sub?: string;
			sid?: string;
			exp?: number;
		};
		if (!payload.sub || !payload.sid || typeof payload.exp !== 'number') return null;
		if (payload.exp * 1000 <= Date.now()) return null;
		return { sub: payload.sub, sid: payload.sid, exp: payload.exp };
	} catch {
		return null;
	}
}
