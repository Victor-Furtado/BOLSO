import { z } from 'zod';

const AbilityScoreSchema = z.enum(['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA']);
const BoostSchema = z.union([AbilityScoreSchema, z.literal('FREE')]);

export const AncestryDataSchema = z.object({
	boosts: z.array(BoostSchema),
	flaws: z.array(AbilityScoreSchema),
	hp: z.number().int().nonnegative(),
	hands: z.number().int().nonnegative(),
	languages: z.array(z.string()),
	additionalLanguages: z.array(z.string()),
	size: z.enum(['tiny', 'sm', 'med', 'lg', 'huge']),
	speed: z.number().int().nonnegative(),
	vision: z.string()
});

export type AncestryData = z.infer<typeof AncestryDataSchema>;

export const HeritageDataSchema = z.object({
	versatile: z.boolean()
});

export type HeritageData = z.infer<typeof HeritageDataSchema>;

export const FeatDataSchema = z.object({
	actions: z.number().int().min(0).max(3).nullable(),
	actionType: z.enum(['single', 'two_actions', 'three_actions', 'free', 'reaction', 'passive']),
	frequency: z.string().nullable()
});

export type FeatData = z.infer<typeof FeatDataSchema>;

export const ActionDataSchema = FeatDataSchema;

export type ActionData = FeatData;

export const WeaponDataSchema = z.object({
	damage: z.string(),
	damageType: z.enum(['bludgeoning', 'piercing', 'slashing']),
	hands: z.number().int().min(1).max(2),
	bulk: z.number().nullable(),
	group: z.string().optional()
});

export const SpellDataSchema = z.object({
	traditions: z.array(z.enum(['arcane', 'divine', 'occult', 'primal'])),
	actions: z.string(),
	range: z.string().nullable(),
	target: z.string().nullable(),
	area: z.string().nullable(),
	duration: z.string().nullable(),
	defense: z.string().nullable()
});

export const BaseDataSchema = z.record(z.string(), z.unknown());

export const RaritySchema = z.enum(['common', 'uncommon', 'rare', 'unique']);

export const CatalogEntrySchema = z.discriminatedUnion('type', [
	z.object({
		type: z.literal('ancestry'),
		data: AncestryDataSchema
	}),
	z.object({
		type: z.literal('heritage'),
		data: HeritageDataSchema
	}),
	z.object({
		type: z.literal('feat'),
		data: FeatDataSchema
	}),
	z.object({
		type: z.literal('action'),
		data: ActionDataSchema
	}),
	z.object({
		type: z.literal('weapon'),
		data: WeaponDataSchema
	}),
	z.object({
		type: z.literal('spell'),
		data: SpellDataSchema
	})
]);

export type CatalogEntryValidated = z.infer<typeof CatalogEntrySchema>;
