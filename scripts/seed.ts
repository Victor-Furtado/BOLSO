import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { type Kysely, sql, type Transaction } from 'kysely';
import { db } from './db.ts';

/**
 * Import `.data` into the catalog tables.
 *
 * Pack identity comes from system.pf2e.json (`packs[].name`), not the directory
 * under `.data`. See docs/catalog-database-schema.md, Import.
 *
 * Usage: npm run db:seed -- [pack-name-or-dir...]
 * Full import when no pack is given. PF2E_ROOT overrides the sibling pf2e checkout
 * that holds system.pf2e.json and build/duplicates.json.
 */

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataRoot = path.join(repoRoot, '.data');
const pf2eRoot = process.env.PF2E_ROOT ?? path.resolve(repoRoot, '../pf2e');

const PLAYER_PACKS = new Set([
	'actionspf2e',
	'ancestries',
	'ancestryfeatures',
	'backgrounds',
	'classes',
	'classfeatures',
	'familiar-abilities',
	'feats-srd',
	'heritages',
	'spells-srd',
	'equipment-srd',
	'deities'
]);

const EQUIPMENT_TYPES = new Set([
	'weapon',
	'armor',
	'shield',
	'consumable',
	'equipment',
	'treasure',
	'ammo',
	'backpack'
]);

const UUID_RE = /@UUID\[([^\]]+)\](?:\{([^}]*)\})?/g;
const COMPENDIUM_RE = /^Compendium\.pf2e\.([^.]+)\.([^.]+)\.(.+)$/;

type Audience = 'player' | 'gm' | 'engine';
type Doc = Record<string, unknown>;
type Database = Kysely<Record<string, Record<string, unknown>>>;
type Trx = Transaction<Record<string, Record<string, unknown>>>;

interface PackMeta {
	name: string;
	label: string;
	documentClass: string;
	path: string;
	dirName: string;
	audience: Audience;
}

interface CatalogIndex {
	byUuid: Set<string>;
	byId: Map<string, string>;
	byName: Map<string, string>;
	bySlug: Map<string, string>;
}

interface WarningRow {
	source_path: string;
	message: string;
}

const database = db as unknown as Database;

function audienceFor(name: string): Audience {
	if (
		name.endsWith('-effects') ||
		name === 'action-macros' ||
		name === 'pf2e-macros' ||
		name === 'rollable-tables' ||
		name === 'conditionitems'
	) {
		return 'engine';
	}
	if (PLAYER_PACKS.has(name)) return 'player';
	return 'gm';
}

function sluggify(name: string): string {
	return name
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');
}

function asRecord(value: unknown): Doc | null {
	return value !== null && typeof value === 'object' && !Array.isArray(value)
		? (value as Doc)
		: null;
}

function asString(value: unknown): string | null {
	return typeof value === 'string' && value.length > 0 ? value : null;
}

function asNumber(value: unknown): number | null {
	return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function asArray(value: unknown): unknown[] {
	return Array.isArray(value) ? value : [];
}

function readJson(filePath: string): unknown {
	return JSON.parse(fs.readFileSync(filePath, 'utf8')) as unknown;
}

function loadPacks(): PackMeta[] {
	const manifestPath = path.join(pf2eRoot, 'system.pf2e.json');
	if (!fs.existsSync(manifestPath)) {
		throw new Error(`system.pf2e.json not found at ${manifestPath}. Set PF2E_ROOT.`);
	}
	const manifest = asRecord(readJson(manifestPath));
	const packs = asArray(manifest?.packs);
	return packs.flatMap((entry) => {
		const pack = asRecord(entry);
		const name = asString(pack?.name);
		const label = asString(pack?.label);
		const documentClass = asString(pack?.type);
		const packPath = asString(pack?.path);
		if (!name || !label || !documentClass || !packPath) return [];
		return [
			{
				name,
				label,
				documentClass,
				path: packPath,
				dirName: path.basename(packPath),
				audience: audienceFor(name)
			}
		];
	});
}

function walkDocuments(dir: string): string[] {
	const files: string[] = [];
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) files.push(...walkDocuments(full));
		else if (entry.isFile() && entry.name.endsWith('.json') && entry.name !== '_folders.json') {
			files.push(full);
		}
	}
	return files;
}

function remember(
	index: CatalogIndex,
	pack: string,
	documentClass: string,
	foundryId: string,
	name: string,
	slug: string | null,
	uuid: string
): void {
	index.byUuid.add(uuid);
	const scope = `${pack}|${documentClass}|`;
	index.byId.set(scope + foundryId, uuid);
	index.byName.set(scope + name.toLowerCase(), uuid);
	if (slug) index.bySlug.set(scope + slug, uuid);
}

function resolveRef(index: CatalogIndex, ref: string): string | null {
	if (index.byUuid.has(ref)) return ref;
	const match = COMPENDIUM_RE.exec(ref);
	if (!match) return null;
	const [, pack, documentClass, rest] = match;
	const scope = `${pack}|${documentClass}|`;
	return (
		index.byId.get(scope + rest) ??
		index.byName.get(scope + rest.toLowerCase()) ??
		index.bySlug.get(scope + sluggify(rest)) ??
		null
	);
}

function levelOf(system: Doc, type: string): number | null {
	const level = asRecord(system.level);
	const fromLevel = asNumber(level?.value);
	if (fromLevel !== null) return fromLevel;
	if (type === 'npc' || type === 'hazard') {
		const details = asRecord(system.details);
		const creatureLevel = asRecord(details?.level);
		return asNumber(creatureLevel?.value);
	}
	return null;
}

function publicationOf(system: Doc): {
	remaster: number | null;
	license: string | null;
	title: string | null;
} {
	const publication = asRecord(system.publication);
	const remaster = publication?.remaster;
	return {
		remaster: remaster === true ? 1 : remaster === false ? 0 : null,
		license: asString(publication?.license),
		title: asString(publication?.title)
	};
}

function rarityOf(system: Doc): string | null {
	const traits = asRecord(system.traits);
	const rarity = asString(traits?.rarity);
	return rarity && ['common', 'uncommon', 'rare', 'unique'].includes(rarity) ? rarity : null;
}

function traitRows(
	uuid: string,
	system: Doc
): { document_uuid: string; kind: string; trait: string }[] {
	const traits = asRecord(system.traits);
	const rows: { document_uuid: string; kind: string; trait: string }[] = [];
	const push = (kind: string, values: unknown) => {
		for (const value of asArray(values)) {
			const trait = asString(value);
			if (trait) rows.push({ document_uuid: uuid, kind, trait });
		}
	};
	push('trait', traits?.value);
	push('tradition', traits?.traditions);
	push('other_tag', traits?.otherTags);
	return rows;
}

function priceCp(system: Doc): number | null {
	const price = asRecord(system.price);
	const value = asRecord(price?.value) ?? price;
	if (!value) return null;
	const gp = asNumber(value.gp);
	const sp = asNumber(value.sp);
	const cp = asNumber(value.cp);
	if (gp === null && sp === null && cp === null) return null;
	return (gp ?? 0) * 100 + (sp ?? 0) * 10 + (cp ?? 0);
}

function compendiumStrings(value: unknown, found: string[] = []): string[] {
	if (typeof value === 'string') {
		if (value.startsWith('Compendium.pf2e.')) found.push(value);
		return found;
	}
	if (Array.isArray(value)) {
		for (const entry of value) compendiumStrings(entry, found);
		return found;
	}
	const record = asRecord(value);
	if (record) {
		for (const entry of Object.values(record)) compendiumStrings(entry, found);
	}
	return found;
}

function linksFromDocument(uuid: string, system: Doc, rules: Doc[]): Record<string, unknown>[] {
	const links: Record<string, unknown>[] = [];
	const description = asRecord(system.description);
	const html = asString(description?.value) ?? '';
	for (const match of html.matchAll(UUID_RE)) {
		const toRef = match[1];
		const kind = toRef.includes('.JournalEntry') ? 'journal' : 'description';
		links.push({
			from_uuid: uuid,
			from_embedded: null,
			to_ref: toRef,
			to_uuid: null,
			kind,
			detail: JSON.stringify({ text: match[2] ?? null })
		});
	}

	const items = asRecord(system.items);
	if (items) {
		for (const entry of Object.values(items)) {
			const grant = asRecord(entry);
			const toRef = asString(grant?.uuid);
			if (!toRef) continue;
			links.push({
				from_uuid: uuid,
				from_embedded: null,
				to_ref: toRef,
				to_uuid: null,
				kind: 'grant',
				detail: JSON.stringify({ level: asNumber(grant?.level) })
			});
		}
	}

	const selfEffect = asString(system.selfEffect);
	if (selfEffect) {
		links.push({
			from_uuid: uuid,
			from_embedded: null,
			to_ref: selfEffect,
			to_uuid: null,
			kind: 'effect',
			detail: '{}'
		});
	}

	rules.forEach((rule, position) => {
		const key = asString(rule.key);
		if (key === 'GrantItem') {
			const toRef = asString(rule.uuid);
			if (!toRef) return;
			links.push({
				from_uuid: uuid,
				from_embedded: null,
				to_ref: toRef,
				to_uuid: null,
				kind: 'grant',
				detail: JSON.stringify({ rule_position: position })
			});
		} else if (key === 'EphemeralEffect') {
			const toRef = asString(rule.uuid);
			if (!toRef) return;
			links.push({
				from_uuid: uuid,
				from_embedded: null,
				to_ref: toRef,
				to_uuid: null,
				kind: 'effect',
				detail: JSON.stringify({ rule_position: position })
			});
		} else if (key === 'ChoiceSet') {
			for (const toRef of compendiumStrings(rule.choices)) {
				links.push({
					from_uuid: uuid,
					from_embedded: null,
					to_ref: toRef,
					to_uuid: null,
					kind: 'choice',
					detail: JSON.stringify({ rule_position: position })
				});
			}
		}
	});

	return links;
}

function ruleRows(uuid: string, rules: Doc[]): Record<string, unknown>[] {
	return rules.map((rule, position) => ({
		document_uuid: uuid,
		embedded_item_id: null,
		position,
		key: asString(rule.key) ?? 'Unknown',
		selector: asString(rule.selector),
		predicate: JSON.stringify(asArray(rule.predicate)),
		payload: JSON.stringify(rule)
	}));
}

function featRow(uuid: string, system: Doc): Record<string, unknown> {
	const actionType = asRecord(system.actionType);
	const actionsRecord = asRecord(system.actions);
	const actionCount = asNumber(actionsRecord?.value);
	const prerequisites = asRecord(system.prerequisites);
	const texts = asArray(prerequisites?.value).flatMap((entry) => {
		const text = asString(asRecord(entry)?.value ?? entry);
		return text ? [text] : [];
	});
	return {
		document_uuid: uuid,
		category: asString(system.category) ?? 'unknown',
		action_type: asString(actionType?.value) ?? 'passive',
		actions: actionCount !== null && actionCount >= 1 && actionCount <= 3 ? actionCount : null,
		prerequisites: JSON.stringify(texts)
	};
}

function spellRow(uuid: string, system: Doc): Record<string, unknown> {
	const area = asRecord(system.area);
	const defense = asRecord(system.defense);
	const save = asRecord(defense?.save);
	const heightening = asRecord(system.heightening);
	const time = asRecord(system.time);
	return {
		document_uuid: uuid,
		area_type: asString(area?.type),
		area_value: asNumber(area?.value),
		defense: asString(save?.statistic),
		heightening_type: asString(heightening?.type),
		time: time?.value === undefined || time?.value === null ? null : String(time.value)
	};
}

function classRow(uuid: string, system: Doc): Record<string, unknown> {
	const levels = (key: string) => JSON.stringify(asArray(asRecord(system[key])?.value));
	const keyAbility = asRecord(system.keyAbility);
	const value = keyAbility?.value;
	return {
		document_uuid: uuid,
		hp: asNumber(system.hp) ?? 0,
		key_ability: Array.isArray(value) || typeof value === 'string' ? JSON.stringify(value) : null,
		class_feat_levels: levels('classFeatLevels'),
		ancestry_feat_levels: levels('ancestryFeatLevels'),
		general_feat_levels: levels('generalFeatLevels'),
		skill_feat_levels: levels('skillFeatLevels')
	};
}

function equipmentRow(uuid: string, system: Doc): Record<string, unknown> {
	const bulk = asRecord(system.bulk);
	const damage = asRecord(system.damage);
	const bulkValue = bulk?.value;
	return {
		document_uuid: uuid,
		price_cp: priceCp(system),
		bulk: bulkValue === undefined || bulkValue === null ? null : String(bulkValue),
		category: asString(system.category),
		item_group: asString(system.group),
		damage_die: asString(damage?.die),
		damage_type: asString(damage?.damageType),
		armor_category: asString(system.category)
	};
}

function creatureRow(uuid: string, system: Doc): Record<string, unknown> {
	const traits = asRecord(system.traits);
	return { document_uuid: uuid, size: asString(traits?.size) };
}

async function insertChunks(
	trx: Database | Trx,
	table: string,
	rows: Record<string, unknown>[],
	size = 40
): Promise<void> {
	for (let offset = 0; offset < rows.length; offset += size) {
		await trx
			.insertInto(table)
			.values(rows.slice(offset, offset + size))
			.execute();
	}
}

async function loadIndex(index: CatalogIndex): Promise<void> {
	const rows = await database
		.selectFrom('catalog_documents')
		.select(['uuid', 'pack', 'document_class', 'foundry_id', 'name', 'slug'])
		.execute();
	for (const row of rows) {
		remember(
			index,
			String(row.pack),
			String(row.document_class),
			String(row.foundry_id),
			String(row.name),
			row.slug === null ? null : String(row.slug),
			String(row.uuid)
		);
	}
}

async function importPack(pack: PackMeta, index: CatalogIndex): Promise<void> {
	const dir = path.join(dataRoot, pack.dirName);
	if (!fs.existsSync(dir)) throw new Error(`missing .data/${pack.dirName} for pack ${pack.name}`);

	const folderFile = path.join(dir, '_folders.json');
	const folders = fs.existsSync(folderFile) ? asArray(readJson(folderFile)) : [];
	const files = walkDocuments(dir);
	const warnings: WarningRow[] = [];

	await database.transaction().execute(async (trx) => {
		await trx
			.insertInto('catalog_packs')
			.values({
				name: pack.name,
				label: pack.label,
				document_class: pack.documentClass,
				audience: pack.audience,
				source_dir: `.data/${pack.dirName}`,
				system_path: pack.path
			})
			.onConflict((conflict) =>
				conflict.column('name').doUpdateSet({
					label: pack.label,
					document_class: pack.documentClass,
					audience: pack.audience,
					source_dir: `.data/${pack.dirName}`,
					system_path: pack.path
				})
			)
			.execute();

		await trx.deleteFrom('catalog_documents').where('pack', '=', pack.name).execute();
		await trx.deleteFrom('catalog_folders').where('pack', '=', pack.name).execute();
		await trx
			.deleteFrom('catalog_import_warnings')
			.where('source_path', 'like', `${pack.dirName}/%`)
			.execute();

		const folderIds = new Map<string, number>();
		for (const entry of folders) {
			const folder = asRecord(entry);
			const foundryId = asString(folder?._id);
			const name = asString(folder?.name);
			if (!foundryId || !name) continue;
			const inserted = await trx
				.insertInto('catalog_folders')
				.values({
					pack: pack.name,
					foundry_id: foundryId,
					name,
					parent_id: null,
					sort: Number.isInteger(folder?.sort) ? folder?.sort : null,
					source_path: null
				})
				.returning('id')
				.executeTakeFirstOrThrow();
			folderIds.set(foundryId, Number(inserted.id));
		}
		for (const entry of folders) {
			const folder = asRecord(entry);
			const foundryId = asString(folder?._id);
			const parent = asString(folder?.folder);
			if (!foundryId || !parent) continue;
			const id = folderIds.get(foundryId);
			const parentId = folderIds.get(parent);
			if (id === undefined || parentId === undefined) continue;
			await trx
				.updateTable('catalog_folders')
				.set({ parent_id: parentId })
				.where('id', '=', id)
				.execute();
		}

		const documents: Record<string, unknown>[] = [];
		const traits: Record<string, unknown>[] = [];
		const rules: Record<string, unknown>[] = [];
		const links: Record<string, unknown>[] = [];
		const spells: Record<string, unknown>[] = [];
		const feats: Record<string, unknown>[] = [];
		const classes: Record<string, unknown>[] = [];
		const equipment: Record<string, unknown>[] = [];
		const creatures: Record<string, unknown>[] = [];
		const embedded: { parentUuid: string; item: Doc; sourcePath: string }[] = [];
		const seen = new Set<string>();

		const pushDocument = (
			doc: Doc,
			sourcePath: string,
			uuid: string,
			foundryId: string,
			type: string
		) => {
			const system = asRecord(doc.system) ?? {};
			const name = asString(doc.name) ?? foundryId;
			const slug = asString(system.slug) ?? sluggify(name);
			const pub = publicationOf(system);
			const folder = asString(doc.folder);
			const ruleList = asArray(system.rules).flatMap((rule) => {
				const record = asRecord(rule);
				return record ? [record] : [];
			});
			remember(index, pack.name, pack.documentClass, foundryId, name, slug, uuid);
			seen.add(sourcePath);
			documents.push({
				uuid,
				pack: pack.name,
				document_class: pack.documentClass,
				type,
				foundry_id: foundryId,
				name,
				name_folded: name.toLowerCase(),
				slug,
				img: asString(doc.img),
				folder_id: folder ? (folderIds.get(folder) ?? null) : null,
				level: levelOf(system, type),
				rarity: rarityOf(system),
				remaster: pub.remaster,
				license: pub.license,
				source_title: pub.title,
				source_path: sourcePath,
				payload: JSON.stringify(doc)
			});
			traits.push(...traitRows(uuid, system));
			rules.push(...ruleRows(uuid, ruleList));
			links.push(...linksFromDocument(uuid, system, ruleList));
			if (type === 'spell') spells.push(spellRow(uuid, system));
			if (type === 'feat') feats.push(featRow(uuid, system));
			if (type === 'class') classes.push(classRow(uuid, system));
			if (EQUIPMENT_TYPES.has(type)) equipment.push(equipmentRow(uuid, system));
			if (type === 'npc' || type === 'hazard') creatures.push(creatureRow(uuid, system));
			if (pack.documentClass === 'Actor') {
				for (const item of asArray(doc.items)) {
					const record = asRecord(item);
					if (record) embedded.push({ parentUuid: uuid, item: record, sourcePath });
				}
			}
		};

		for (const filePath of files) {
			const sourcePath = path.relative(dataRoot, filePath).split(path.sep).join('/');
			const doc = asRecord(readJson(filePath));
			const foundryId = asString(doc?._id);
			if (!doc || !foundryId) {
				warnings.push({ source_path: sourcePath, message: 'skipped file without _id' });
				continue;
			}
			const type = asString(doc.type) ?? pack.documentClass.toLowerCase();
			const uuid = `Compendium.pf2e.${pack.name}.${pack.documentClass}.${foundryId}`;
			pushDocument(doc, sourcePath, uuid, foundryId, type);

			if (pack.documentClass === 'JournalEntry') {
				for (const page of asArray(doc.pages)) {
					const pageDoc = asRecord(page);
					const pageId = asString(pageDoc?._id);
					if (!pageDoc || !pageId) continue;
					const pageUuid = `${uuid}.JournalEntryPage.${pageId}`;
					const pageSource = `${sourcePath}#${pageId}`;
					pushDocument(
						{ ...pageDoc, parentEntryId: foundryId },
						pageSource,
						pageUuid,
						`${foundryId}.${pageId}`,
						'journal_page'
					);
				}
			}
		}

		await insertChunks(trx, 'catalog_documents', documents, 20);
		await insertChunks(trx, 'catalog_traits', traits, 80);
		await insertChunks(trx, 'catalog_rules', rules, 40);
		await insertChunks(trx, 'catalog_links', links, 40);
		await insertChunks(trx, 'catalog_spell_details', spells);
		await insertChunks(trx, 'catalog_feat_details', feats);
		await insertChunks(trx, 'catalog_class_details', classes);
		await insertChunks(trx, 'catalog_equipment_details', equipment);
		await insertChunks(trx, 'catalog_creature_details', creatures);

		const embeddedSeen = new Set<string>();
		for (const entry of embedded) {
			const foundryId = asString(entry.item._id);
			if (!foundryId) continue;
			const embeddedKey = `${entry.parentUuid}\0${foundryId}`;
			if (embeddedSeen.has(embeddedKey)) {
				warnings.push({
					source_path: entry.sourcePath,
					message: `duplicate embedded item ${foundryId} on ${entry.parentUuid}; kept the first`
				});
				continue;
			}
			embeddedSeen.add(embeddedKey);
			const inserted = await trx
				.insertInto('catalog_embedded_items')
				.values({
					parent_uuid: entry.parentUuid,
					foundry_id: foundryId,
					type: asString(entry.item.type) ?? 'unknown',
					name: asString(entry.item.name) ?? foundryId,
					sort: Number.isInteger(entry.item.sort) ? entry.item.sort : null,
					payload: JSON.stringify(entry.item)
				})
				.returning('id')
				.executeTakeFirstOrThrow();
			const embeddedId = Number(inserted.id);
			const system = asRecord(entry.item.system) ?? {};
			const ruleList = asArray(system.rules).flatMap((rule) => {
				const record = asRecord(rule);
				return record ? [record] : [];
			});
			if (ruleList.length > 0) {
				await insertChunks(
					trx,
					'catalog_rules',
					ruleList.map((rule, position) => ({
						document_uuid: null,
						embedded_item_id: embeddedId,
						position,
						key: asString(rule.key) ?? 'Unknown',
						selector: asString(rule.selector),
						predicate: JSON.stringify(asArray(rule.predicate)),
						payload: JSON.stringify(rule)
					}))
				);
			}
			const sourceUuid =
				asString(asRecord(asRecord(entry.item.flags)?.core)?.sourceId) ?? asString(entry.item.uuid);
			if (sourceUuid?.startsWith('Compendium.pf2e.')) {
				await trx
					.insertInto('catalog_links')
					.values({
						from_uuid: null,
						from_embedded: embeddedId,
						to_ref: sourceUuid,
						to_uuid: null,
						kind: 'embedded',
						detail: '{}'
					})
					.execute();
			}
		}

		if (warnings.length > 0) await insertChunks(trx, 'catalog_import_warnings', warnings);
		console.log(`✓ ${pack.name} (${pack.audience}) ${seen.size} documents`);
	});
}

async function resolveLinks(index: CatalogIndex): Promise<void> {
	const unresolved = await database
		.selectFrom('catalog_links')
		.select(['id', 'to_ref'])
		.where('to_uuid', 'is', null)
		.execute();
	const byTarget = new Map<string, number[]>();
	for (const link of unresolved) {
		const target = resolveRef(index, String(link.to_ref));
		if (!target) continue;
		const ids = byTarget.get(target) ?? [];
		ids.push(Number(link.id));
		byTarget.set(target, ids);
	}
	for (const [target, ids] of byTarget) {
		for (let offset = 0; offset < ids.length; offset += 200) {
			await database
				.updateTable('catalog_links')
				.set({ to_uuid: target })
				.where('id', 'in', ids.slice(offset, offset + 200))
				.execute();
		}
	}
	console.log(
		`✓ resolved ${[...byTarget.values()].reduce((sum, ids) => sum + ids.length, 0)} links`
	);
}

async function importNameGroups(): Promise<void> {
	const filePath = path.join(pf2eRoot, 'build/duplicates.json');
	if (!fs.existsSync(filePath)) {
		console.log(`skipped name groups; ${filePath} is missing`);
		return;
	}
	const groups = asArray(readJson(filePath));
	const rows: Record<string, unknown>[] = [];
	const seen = new Set<string>();
	for (const group of groups) {
		const record = asRecord(group);
		const entries = asRecord(record?.entries);
		if (!entries) continue;
		for (const [pack, names] of Object.entries(entries)) {
			for (const name of asArray(names)) {
				if (typeof name !== 'string') continue;
				const key = `${pack}\0${name}`;
				if (seen.has(key)) continue;
				seen.add(key);
				rows.push({
					publication: asString(record?.publication),
					pack,
					name,
					name_folded: name.toLowerCase()
				});
			}
		}
	}
	await database.deleteFrom('catalog_name_groups').execute();
	await insertChunks(database, 'catalog_name_groups', rows, 80);
	console.log(`✓ name groups ${rows.length}`);
}

async function seed(): Promise<void> {
	if (!fs.existsSync(dataRoot)) throw new Error(`missing ${dataRoot}`);
	const requested = new Set(process.argv.slice(2));
	const packs = loadPacks().filter(
		(pack) => requested.size === 0 || requested.has(pack.name) || requested.has(pack.dirName)
	);
	if (packs.length === 0) throw new Error('no packs matched');

	await sql`PRAGMA foreign_keys = ON`.execute(database);
	const index: CatalogIndex = {
		byUuid: new Set(),
		byId: new Map(),
		byName: new Map(),
		bySlug: new Map()
	};
	await loadIndex(index);
	for (const pack of packs) {
		await importPack(pack, index);
	}
	await resolveLinks(index);
	await importNameGroups();
	await db.destroy();
}

seed().catch(async (error: unknown) => {
	console.error(error);
	await db.destroy();
	process.exit(1);
});
