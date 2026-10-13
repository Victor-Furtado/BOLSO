import { randomUUID } from 'node:crypto';
import { hashPassword } from '../src/lib/server/auth/crypto.ts';
import { db } from './db.ts';

const email = 'victor@bolso.com';
const password = 'zxc123';

async function seedAdmin(): Promise<void> {
	const campaign = await db
		.selectFrom('play_campaigns')
		.select('id')
		.where('slug', '=', 'bolso')
		.executeTakeFirst();
	if (!campaign) throw new Error('Bolso campaign is missing. Run campaign:setup first.');

	const existing = await db
		.selectFrom('play_accounts')
		.select('id')
		.where('email', '=', email)
		.executeTakeFirst();
	const id = existing?.id ?? randomUUID();
	const passwordHash = await hashPassword(password);

	if (existing) {
		await db
			.updateTable('play_accounts')
			.set({ password_hash: passwordHash, admin: 1, disabled_at: null })
			.where('id', '=', id)
			.execute();
	} else {
		await db
			.insertInto('play_accounts')
			.values({ id, email, password_hash: passwordHash, admin: 1 })
			.execute();
	}

	await db
		.insertInto('play_members')
		.values({ account_id: id, campaign_id: campaign.id, role: 'gm', manager: 0 })
		.onConflict((conflict) =>
			conflict.column('account_id').doUpdateSet({ role: 'gm', campaign_id: campaign.id })
		)
		.execute();

	console.log(`✓ admin ${email}`);
	await db.destroy();
}

seedAdmin().catch(async (error: unknown) => {
	console.error(error);
	await db.destroy();
	process.exit(1);
});
