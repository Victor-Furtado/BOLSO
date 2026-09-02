import dotenv from 'dotenv';
import { Kysely } from 'kysely';
import { LibsqlDialect } from '@libsql/kysely-libsql';

dotenv.config({ quiet: true });

export const db = new Kysely({
	dialect: new LibsqlDialect({
		url: process.env.TURSO_CATALOG_DB_URL || '',
		authToken: process.env.TURSO_CATALOG_AUTH_TOKEN
	})
});
