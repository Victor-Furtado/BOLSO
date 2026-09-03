import { db } from './db';
import ancestriesJson from '../data/ancestries.json' with { type: 'json' };

async function seed() {
	console.log('🌱 Seeding database...');

	console.log('\n🧬 Seeding ancestries...');
	console.log(`🧬 Seeded ${ancestriesJson.length} ancestries!`);

	console.log('✅ Seed completed!');

	await db.destroy();
}

seed().catch((error) => {
	console.error('❌ Seed failed:', error);
	process.exit(1);
});
