import { Kysely } from 'kysely';
import { LibsqlDialect } from '@libsql/kysely-libsql';
import { getEnv } from '$lib/utils/env';
import type { DB } from './types';

export const db = new Kysely<DB>({
	dialect: new LibsqlDialect({
		url: getEnv().TURSO_CATALOG_DB_URL,
		authToken: getEnv().TURSO_CATALOG_AUTH_TOKEN
	})
});
