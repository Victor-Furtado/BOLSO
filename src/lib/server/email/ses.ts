import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';
import { getEnv } from '$lib/utils/env';

export type SimpleEmail = {
	to: string;
	subject: string;
	text: string;
};

let client: SESv2Client | null = null;

function ses(): SESv2Client {
	if (!client) client = new SESv2Client({ region: getEnv().AWS_REGION });
	return client;
}

export async function sendEmail(message: SimpleEmail): Promise<void> {
	const from = getEnv().SES_FROM_EMAIL;
	if (!from) throw new Error('SES_FROM_EMAIL is not set');

	await ses().send(
		new SendEmailCommand({
			FromEmailAddress: from,
			Destination: { ToAddresses: [message.to] },
			Content: {
				Simple: {
					Subject: { Data: message.subject, Charset: 'UTF-8' },
					Body: { Text: { Data: message.text, Charset: 'UTF-8' } }
				}
			}
		})
	);
}
