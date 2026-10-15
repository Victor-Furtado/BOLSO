import { timingSafeEqual } from 'node:crypto';

/** TEMP: delete this file when open signup is removed. */
export const TEMP_SIGNUP_PASSWORD = 'meGustaBolso!';

export function isTempPassword(password: string): boolean {
	const actual = Buffer.from(password);
	const expected = Buffer.from(TEMP_SIGNUP_PASSWORD);
	if (actual.length !== expected.length) return false;
	return timingSafeEqual(actual, expected);
}
