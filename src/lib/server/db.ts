import { createCatalogDb } from '$lib/db/client';
import { getEnv } from '$lib/utils/env';

let db: ReturnType<typeof createCatalogDb> | null = null;

export function getDb() {
	if (db) return db;

	const env = getEnv();
	db = createCatalogDb(env.TURSO_CATALOG_DB_URL, env.TURSO_CATALOG_AUTH_TOKEN);
	return db;
}
