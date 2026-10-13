import { z } from 'zod';

const record = z.record(z.string(), z.unknown());

export const raritySchema = z.enum(['common', 'uncommon', 'rare', 'unique']);

/** Foundry stores optional numbers as `{ value }` or a bare number. */
export function readNumber(value: unknown): number | null {
	if (typeof value === 'number' && Number.isFinite(value)) return value;
	if (value && typeof value === 'object' && 'value' in value) {
		const inner = (value as { value: unknown }).value;
		if (typeof inner === 'number' && Number.isFinite(inner)) return inner;
	}
	return null;
}

export function readString(value: unknown): string | null {
	return typeof value === 'string' && value.length > 0 ? value : null;
}

export function readStringList(value: unknown): string[] {
	if (Array.isArray(value))
		return value.filter((entry): entry is string => typeof entry === 'string');
	if (value && typeof value === 'object' && 'value' in value) {
		return readStringList((value as { value: unknown }).value);
	}
	return [];
}

/** Boost and flaw maps are either arrays or `{ "0": { value: ["str"] } }`. */
export function readChoiceLists(value: unknown): string[][] {
	const entries = Array.isArray(value)
		? value
		: value && typeof value === 'object'
			? Object.values(value)
			: [];
	return entries.flatMap((entry) => {
		const raw =
			entry && typeof entry === 'object' && 'value' in entry
				? (entry as { value: unknown }).value
				: entry;
		const list = (Array.isArray(raw) ? raw : [raw]).filter(
			(item): item is string => typeof item === 'string' && item.length > 0
		);
		return list.length > 0 ? [list] : [];
	});
}

export function htmlText(html: string | null): string | null {
	if (!html) return null;
	const text = html
		.replace(/<br\s*\/?>/gi, '\n')
		.replace(/<\/p>/gi, '\n')
		.replace(/<[^>]+>/g, '')
		.replace(/&nbsp;/g, ' ')
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&#39;|&apos;/g, "'")
		.replace(/&quot;/g, '"')
		.replace(/\n{3,}/g, '\n\n')
		.trim();
	return text.length > 0 ? text : null;
}

export const systemPayloadSchema = z
	.object({
		system: record.optional()
	})
	.passthrough();

export function systemOf(payload: string): Record<string, unknown> {
	const parsed = systemPayloadSchema.safeParse(JSON.parse(payload));
	if (!parsed.success) return {};
	return parsed.data.system ?? {};
}
