import { createHash, createHmac, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';

function scryptAsync(
	password: string,
	salt: Buffer,
	keylen: number,
	options: { N: number; r: number; p: number }
): Promise<Buffer> {
	const maxmem = 128 * options.N * options.r * 2;
	return new Promise((resolve, reject) => {
		scrypt(password, salt, keylen, { ...options, maxmem }, (error, key) => {
			if (error) reject(error);
			else resolve(key);
		});
	});
}

const KEY_LENGTH = 32;
const SCRYPT_N = 2 ** 16;
const SCRYPT_R = 8;
const SCRYPT_P = 1;

export async function hashPassword(password: string): Promise<string> {
	const salt = randomBytes(16);
	const hash = (await scryptAsync(password, salt, KEY_LENGTH, {
		N: SCRYPT_N,
		r: SCRYPT_R,
		p: SCRYPT_P
	})) as Buffer;
	return `scrypt$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${salt.toString('base64url')}$${hash.toString('base64url')}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
	const parts = stored.split('$');
	let n = 2 ** 14;
	let r = 8;
	let p = 1;
	let salt: string | undefined;
	let hash: string | undefined;
	if (parts.length === 6 && parts[0] === 'scrypt') {
		n = Number(parts[1]);
		r = Number(parts[2]);
		p = Number(parts[3]);
		salt = parts[4];
		hash = parts[5];
	} else if (parts.length === 3 && parts[0] === 'scrypt') {
		salt = parts[1];
		hash = parts[2];
	}
	if (!salt || !hash || !Number.isInteger(n) || n < 2 || r < 1 || p < 1) return false;
	const actual = (await scryptAsync(password, Buffer.from(salt, 'base64url'), KEY_LENGTH, {
		N: n,
		r,
		p
	})) as Buffer;
	const expected = Buffer.from(hash, 'base64url');
	if (actual.length !== expected.length) return false;
	return timingSafeEqual(actual, expected);
}

export function newRefreshSecret(): string {
	return randomBytes(32).toString('base64url');
}

export function hashRefreshSecret(secret: string): string {
	return createHash('sha256').update(secret).digest('base64url');
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
	try {
		const parsedHeader = JSON.parse(Buffer.from(header, 'base64url').toString()) as {
			alg?: string;
		};
		if (parsedHeader.alg !== 'HS256') return null;
	} catch {
		return null;
	}
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
