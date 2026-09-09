import { db } from '$lib/server/db/client';
import type { CatalogEntry } from '$lib/server/db/types';
import type { Insertable, Updateable } from 'kysely';
import type { Entry } from '../types';

export async function findById(id: string) {
	return await db
		.selectFrom('catalog_entry')
		.selectAll()
		.where('id', '=', id)
		.where('enabled', '=', 1)
		.executeTakeFirst();
}

export async function findBySlug(sourceId: string, type: string, slug: string) {
	return await db
		.selectFrom('catalog_entry')
		.selectAll()
		.where('source_id', '=', sourceId)
		.where('type', '=', type)
		.where('slug', '=', slug)
		.where('enabled', '=', 1)
		.executeTakeFirst();
}

export async function findMany(filters: {
	type?: string;
	sourceId?: string;
	level?: number;
	rarity?: string;
	limit?: number;
	offset?: number;
	enabled?: boolean;
}): Promise<Entry[]> {
	let query = db.selectFrom('catalog_entry').selectAll().where('enabled', '=', 1);

	if (filters.type) {
		query = query.where('type', '=', filters.type);
	}
	if (filters.sourceId) {
		query = query.where('source_id', '=', filters.sourceId);
	}
	if (filters.level !== undefined) {
		query = query.where('level', '=', filters.level);
	}
	if (filters.rarity) {
		query = query.where('rarity', '=', filters.rarity);
	}
	if (filters.enabled !== undefined) {
		query = query.where('enabled', '=', filters.enabled ? 1 : 0);
	}

	if (filters.limit) {
		query = query.limit(filters.limit);
	}
	if (filters.offset) {
		query = query.offset(filters.offset);
	}

	return await query.execute();
}

export async function findGrantedFeatsBySourceIds(
	sourceEntryIds: string[]
): Promise<Array<Entry & { source_entry_id: string }>> {
	if (sourceEntryIds.length === 0) return [];

	return await db
		.selectFrom('catalog_relation')
		.innerJoin('catalog_entry', 'catalog_entry.id', 'catalog_relation.target_entry_id')
		.selectAll('catalog_entry')
		.select('catalog_relation.source_entry_id')
		.where('catalog_relation.type', '=', 'grants')
		.where('catalog_relation.source_entry_id', 'in', sourceEntryIds)
		.where('catalog_entry.type', '=', 'feat')
		.where('catalog_entry.enabled', '=', 1)
		.orderBy('catalog_entry.name')
		.execute();
}

export async function create(entry: Insertable<CatalogEntry>) {
	return await db
		.insertInto('catalog_entry')
		.values(entry)
		.returningAll()
		.executeTakeFirstOrThrow();
}

export async function update(id: string, entry: Updateable<CatalogEntry>) {
	return await db
		.updateTable('catalog_entry')
		.set(entry)
		.where('id', '=', id)
		.returningAll()
		.executeTakeFirstOrThrow();
}
