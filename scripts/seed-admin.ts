import { randomUUID } from 'node:crypto';
import { sql } from 'kysely';
import { hashPassword } from '../src/lib/server/auth/crypto.ts';
import { db } from './db.ts';

const email = 'victor@bolso.com';
const password = 'zxc123';

async function seedAdmin(): Promise<void> {
	const campaign = await sql<{ id: string }>`
		select id from play_campaigns where slug = 'bolso'
	`.execute(db);
	const campaignId = campaign.rows[0]?.id;
	if (!campaignId) throw new Error('Bolso campaign is missing. Run campaign:setup first.');

	const existing = await sql<{ id: string }>`
		select id from play_accounts where email = ${email}
	`.execute(db);
	const id = existing.rows[0]?.id ?? randomUUID();
	const passwordHash = hashPassword(password);

	if (existing.rows[0]) {
		await sql`
			update play_accounts
			set password_hash = ${passwordHash}, admin = 1, disabled_at = null
			where id = ${id}
		`.execute(db);
	} else {
		await sql`
			insert into play_accounts (id, email, password_hash, admin)
			values (${id}, ${email}, ${passwordHash}, 1)
		`.execute(db);
	}

	await sql`
		insert into play_members (account_id, campaign_id, role, manager)
		values (${id}, ${campaignId}, 'gm', 0)
		on conflict (account_id) do update set role = 'gm', campaign_id = ${campaignId}
	`.execute(db);

	console.log(`✓ admin ${email}`);
	await db.destroy();
}

seedAdmin().catch(async (error: unknown) => {
	console.error(error);
	await db.destroy();
	process.exit(1);
});
