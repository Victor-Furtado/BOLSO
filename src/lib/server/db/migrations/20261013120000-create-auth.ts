import { sql, type Kysely } from 'kysely';

/**
 * Register, login, and session auth for the single Bolso campaign.
 * See docs/campaign-hub-auth.md. Expeditions are not in this migration.
 *
 * guest is the absence of a play_members row. admin is a flag on the account.
 * manager is stored for player and gm and is not read yet.
 */
export async function up(database: Kysely<unknown>): Promise<void> {
	await sql`PRAGMA foreign_keys = ON`.execute(database);

	await database.schema
		.createTable('play_accounts')
		.addColumn('id', 'text', (col) => col.primaryKey())
		.addColumn('email', 'text', (col) => col.notNull().unique())
		.addColumn('password_hash', 'text', (col) => col.notNull())
		.addColumn('admin', 'integer', (col) => col.notNull().defaultTo(0))
		.addColumn('disabled_at', 'text')
		.addCheckConstraint('accounts_admin_check', sql`admin in (0, 1)`)
		.addCheckConstraint('accounts_email_check', sql`email = lower(email)`)
		.modifyEnd(sql`strict`)
		.execute();

	await database.schema
		.createTable('play_sessions')
		.addColumn('id', 'text', (col) => col.primaryKey())
		.addColumn('account_id', 'text', (col) =>
			col.notNull().references('play_accounts.id').onDelete('cascade')
		)
		.addColumn('family_id', 'text', (col) => col.notNull())
		.addColumn('expires_at', 'text', (col) => col.notNull())
		.addColumn('revoked_at', 'text')
		.modifyEnd(sql`strict`)
		.execute();

	await database.schema
		.createIndex('sessions_account_idx')
		.on('play_sessions')
		.column('account_id')
		.execute();
	await database.schema
		.createIndex('sessions_family_idx')
		.on('play_sessions')
		.column('family_id')
		.execute();

	await database.schema
		.createTable('play_members')
		.addColumn('account_id', 'text', (col) =>
			col.primaryKey().references('play_accounts.id').onDelete('cascade')
		)
		.addColumn('campaign_id', 'text', (col) =>
			col.notNull().references('play_campaigns.id').onDelete('cascade')
		)
		.addColumn('role', 'text', (col) => col.notNull())
		.addColumn('manager', 'integer', (col) => col.notNull().defaultTo(0))
		.addCheckConstraint('members_role_check', sql`role in ('player', 'gm')`)
		.addCheckConstraint('members_manager_check', sql`manager in (0, 1)`)
		.modifyEnd(sql`strict`)
		.execute();

	await database.schema
		.createIndex('members_campaign_idx')
		.on('play_members')
		.column('campaign_id')
		.execute();
}

export async function down(database: Kysely<unknown>): Promise<void> {
	await database.schema.dropTable('play_members').ifExists().execute();
	await database.schema.dropTable('play_sessions').ifExists().execute();
	await database.schema.dropTable('play_accounts').ifExists().execute();
}
