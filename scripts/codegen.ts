import { spawnSync } from 'node:child_process';
import { URL } from 'node:url';
import dotenv from 'dotenv';

dotenv.config({ quiet: true });

const databaseUrl = process.env.TURSO_CATALOG_DB_URL;
const authToken = process.env.TURSO_CATALOG_AUTH_TOKEN;

if (!databaseUrl || !authToken) {
	console.error('TURSO_CATALOG_DB_URL and TURSO_CATALOG_AUTH_TOKEN are required');
	process.exit(1);
}

const authenticatedUrl = new URL(databaseUrl);
authenticatedUrl.username = authToken;

const result = spawnSync('kysely-codegen', ['--url', authenticatedUrl.toString()], {
	stdio: 'inherit',
	shell: process.platform === 'win32'
});

process.exit(result.status ?? 1);
