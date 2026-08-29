import { Kysely } from 'kysely';
import { LibsqlDialect } from '@libsql/kysely-libsql';
import type { Database } from './types';

export function createCatalogDb(url: string, authToken?: string) {
	return new Kysely<Database>({
		dialect: new LibsqlDialect({
			url,
			...(authToken ? { authToken } : {})
		})
	});
}
