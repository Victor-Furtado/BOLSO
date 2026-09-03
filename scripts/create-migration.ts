import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(__dirname, '../src/lib/server/db/migrations');

const migrationName = process.argv[2];

if (!migrationName) {
	console.error('Please provide a migration name:');
	console.error('  npm run migrate:new <name>');
	process.exit(1);
}

const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);

const fileName = `${timestamp}-${migrationName}.ts`;
const filePath = path.join(migrationsDir, fileName);

const template = `import type { db } from '$database/client';
import './schema-helpers';

export async function up(database: typeof db): Promise<void> {
	// Migration code here
}

export async function down(database: typeof db): Promise<void> {
	// Rollback code here
}
`;

fs.writeFileSync(filePath, template);
console.log(`✓ Created migration: ${fileName}`);
