import { randomBytes, randomUUID } from 'node:crypto';
import { hashPassword, hashRefreshSecret, newRefreshSecret } from '$lib/server/auth/crypto';
import { sendEmail } from '$lib/server/email/ses';
import { TEMP_SIGNUP_PASSWORD } from '$lib/server/auth/temp-password';
import { db } from '$lib/server/db/client';

const seats = {
	player: 'jogador',
	gm: 'mestre',
	admin: 'administrador'
} as const;

const INVITE_MS = 7 * 24 * 60 * 60 * 1000;

export type InviteSeat = keyof typeof seats;

export async function inviteAccount(input: {
	name: string;
	email: string;
	seat: InviteSeat;
	origin: string;
	temporary?: boolean;
}): Promise<void> {
	const campaign = await db
		.selectFrom('play_campaigns')
		.select('id')
		.where('slug', '=', 'bolso')
		.executeTakeFirst();
	if (!campaign) throw new Error('Bolso campaign is missing.');

	const id = randomUUID();
	const temporary = input.temporary === true;
	const token = temporary ? null : newRefreshSecret();
	const passwordHash = await hashPassword(
		temporary ? TEMP_SIGNUP_PASSWORD : randomBytes(32).toString('base64url')
	);
	const expiresAt = temporary ? null : new Date(Date.now() + INVITE_MS).toISOString();

	await db
		.insertInto('play_accounts')
		.values({
			id,
			email: input.email,
			display_name: input.name,
			password_hash: passwordHash,
			admin: input.seat === 'admin' ? 1 : 0,
			need_action: 'password_change',
			invite_token_hash: token ? hashRefreshSecret(token) : null,
			invite_expires_at: expiresAt
		})
		.execute();

	try {
		if (input.seat !== 'admin') {
			await db
				.insertInto('play_members')
				.values({
					account_id: id,
					campaign_id: campaign.id,
					role: input.seat,
					manager: 0
				})
				.execute();
		}

		if (temporary) return;

		const link = new URL(`/convite/${token}`, input.origin).href;
		await sendEmail({
			to: input.email,
			subject: 'Convite para o Bolso',
			text: [
				`Olá, ${input.name}.`,
				'',
				`Você foi convidado para a mesa Bolso como ${seats[input.seat]}.`,
				'',
				'Abra este link para escolher sua senha:',
				link,
				'',
				'O link vale por 7 dias. Depois de salvar a senha, você entra na mesa. Até lá, o Bolso fica nessa página.',
				'',
				'Se você não esperava este convite, ignore esta mensagem.'
			].join('\n')
		});
	} catch (error) {
		await db.deleteFrom('play_accounts').where('id', '=', id).execute();
		throw error;
	}
}

export async function accountIdForInvite(token: string): Promise<string | null> {
	const row = await db
		.selectFrom('play_accounts')
		.select(['id', 'disabled_at', 'need_action', 'invite_expires_at'])
		.where('invite_token_hash', '=', hashRefreshSecret(token))
		.executeTakeFirst();
	if (!row || row.disabled_at || row.need_action !== 'password_change') return null;
	if (!row.invite_expires_at || new Date(row.invite_expires_at).getTime() <= Date.now())
		return null;
	return row.id;
}
