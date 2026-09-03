import { Migrator, FileMigrationProvider } from 'kysely/migration';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from './db';

const migrator = new Migrator({
	db,
	provider: new FileMigrationProvider({
		fs,
		path,
		migrationFolder: path.join(
			path.dirname(fileURLToPath(import.meta.url)),
			'../src/database/migrations'
		)
	})
});

async function migrateDownAll() {
	while (true) {
		const { error, results } = await migrator.migrateDown();

		if (error) {
			console.error(error);
			process.exit(1);
		}

		if (!results?.length) {
			break;
		}

		results.forEach((it) => {
			if (it.status === 'Success') {
				console.log(`✓ Migration "${it.migrationName}" was rolled back successfully`);
			}
		});

		// Quando não houver mais migrations para reverter
		const rolledBack = results.some((it) => it.status === 'Success');

		if (!rolledBack) {
			break;
		}
	}

	await db.destroy();
}

migrateDownAll();
