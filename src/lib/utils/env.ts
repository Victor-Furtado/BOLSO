import { env as dynamicEnv } from '$env/dynamic/private';
import { z } from 'zod';

const envSchema = z.object({});

type EnvInput = z.infer<typeof envSchema>;
type Env = EnvInput;

let cached: Env | null = null;

export function getEnv(): Env {
	if (cached) return cached;

	const parsed = envSchema.safeParse(dynamicEnv);
	if (!parsed.success) {
		const msg = parsed.error.issues
			.map((e) => `${e.path.map(String).join('.')}: ${e.message}`)
			.join('; ');
		throw new Error(`Invalid environment: ${msg}`);
	}

	const env: EnvInput = parsed.data;
	cached = {
		...env
	};
	return cached;
}
