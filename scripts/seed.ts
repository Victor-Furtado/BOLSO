import { db } from '$database/client';

async function seed() {
	console.log('🌱 Seeding database...\n');

	console.log('\nNothing to seed\n');
	console.log('\n✅ Seed completed!\n');

	await db.destroy();
}

seed().catch((error) => {
	console.error('❌ Seed failed:', error);
	process.exit(1);
});
