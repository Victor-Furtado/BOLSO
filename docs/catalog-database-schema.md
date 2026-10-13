# Catalog database schema

libSQL model for the catalog described in [catalog-database.md](./catalog-database.md). Source of truth remains `.data/**/*.json` plus the `packs` array in `system.pf2e.json`. This database is a read-optimized projection of that source.

libSQL has no schemas and no enums. One database file holds two table prefixes so foreign keys from characters to catalog rows still work (SQLite does not enforce foreign keys across attached files).

| Prefix     | Owns                                                                           | Written by                                    |
| ---------- | ------------------------------------------------------------------------------ | --------------------------------------------- |
| `catalog_` | Packs, documents, folders, traits, rules, links, type extracts, reprint groups | Import from JSON. Rebuilt per pack            |
| `play_`    | Characters and the instances they own                                          | The application. Never truncated by an import |

```sql
PRAGMA foreign_keys = ON;
```

Actor preparation (`RuleElementSynthetics`) is not a table. `catalog_rules` stores the program. A rules service evaluates it.

Closed vocabularies are `TEXT` plus `CHECK`. JSON columns are `TEXT` in SQLite JSON form. The importer validates shape before insert.

## Packs and folders

Pack name is `system.pf2e.json` `packs[].name` (`feats-srd`), not the directory (`.data/feats`). Links in descriptions use the pack name.

`audience` is not in the Foundry JSON. The importer sets it from the pack name: player-facing option packs (`feats`, `spells`, `equipment`, `ancestries`, `classes`, and the other option packs) are `player`; adventure and bestiary packs are `gm`; `*-effects`, `action-macros`, `macros`, and `rollable-tables` are `engine`.

```sql
CREATE TABLE catalog_packs (
    name            TEXT PRIMARY KEY,
    label           TEXT NOT NULL,
    document_class  TEXT NOT NULL CHECK (document_class IN (
                        'Actor', 'Item', 'JournalEntry', 'Macro', 'RollTable')),
    audience        TEXT NOT NULL CHECK (audience IN ('player', 'gm', 'engine')),
    source_dir      TEXT NOT NULL,          -- .data/<dir>
    system_path     TEXT NOT NULL           -- packs[].path, e.g. packs/feats
) STRICT;

CREATE TABLE catalog_folders (
    id              INTEGER PRIMARY KEY,
    pack            TEXT NOT NULL REFERENCES catalog_packs (name) ON DELETE CASCADE,
    foundry_id      TEXT NOT NULL,
    name            TEXT NOT NULL,
    parent_id       INTEGER REFERENCES catalog_folders (id) ON DELETE CASCADE,
    sort            INTEGER,
    source_path     TEXT,                   -- relative directory under the pack
    UNIQUE (pack, foundry_id)
) STRICT;

CREATE INDEX folders_parent_idx ON catalog_folders (parent_id);
```

`ON DELETE CASCADE` from `catalog_packs` is safe because a pack row is removed only when that pack is dropped from a rebuild. `play_` tables do not reference `catalog_packs`.

## Documents

One row per compendium document. `uuid` is the canonical id form:

```text
Compendium.pf2e.<pack>.<document_class>.<foundry_id>
```

Name-form links (`Compendium.pf2e.feats-srd.Item.Reactive Shield`) are stored on `catalog_links.to_ref` and resolved to this id.

```sql
CREATE TABLE catalog_documents (
    uuid            TEXT PRIMARY KEY,
    pack            TEXT NOT NULL REFERENCES catalog_packs (name) ON DELETE CASCADE,
    document_class  TEXT NOT NULL CHECK (document_class IN (
                        'Actor', 'Item', 'JournalEntry', 'Macro', 'RollTable')),
    type            TEXT NOT NULL,          -- feat, spell, npc, weapon, condition, ...
    foundry_id      TEXT NOT NULL,
    name            TEXT NOT NULL,
    name_folded     TEXT NOT NULL,          -- lower(name), indexed for lookup
    slug            TEXT,                   -- system.slug, else sluggified name
    img             TEXT,
    folder_id       INTEGER REFERENCES catalog_folders (id) ON DELETE SET NULL,
    level           INTEGER,
    rarity          TEXT CHECK (rarity IS NULL OR rarity IN (
                        'common', 'uncommon', 'rare', 'unique')),
    remaster        INTEGER CHECK (remaster IS NULL OR remaster IN (0, 1)),
    license         TEXT,                   -- ORC, OGL
    source_title    TEXT,                   -- system.publication.title
    source_path     TEXT NOT NULL,
    payload         TEXT NOT NULL CHECK (json_valid(payload)),
    imported_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    UNIQUE (pack, document_class, foundry_id),
    CHECK (uuid = 'Compendium.pf2e.' || pack || '.' || document_class || '.' || foundry_id)
) STRICT;

CREATE INDEX documents_browse_idx
    ON catalog_documents (pack, type, level, rarity);

CREATE INDEX documents_name_idx
    ON catalog_documents (name_folded);

CREATE INDEX documents_slug_idx
    ON catalog_documents (pack, slug);

CREATE INDEX documents_source_idx
    ON catalog_documents (source_title, remaster);
```

`documents_slug_idx` is how the second import pass resolves name and slug links inside a pack. There is no GIN index. Screens filter on the typed columns and the extract tables. Ad-hoc containment uses `json_extract` only for one-off audits, not for the browser.

Journal pages are documents too when they are separate JSON entries. A page UUID (`...JournalEntryPage.<id>`) that only exists nested inside a journal payload is a `catalog_links.to_ref` target, not a `catalog_documents` row, unless the importer explodes pages into their own rows. Prefer exploding pages: descriptions link to pages far more often than to the parent entry. Those rows use `type = 'journal_page'` and store the parent entry id in `payload`. Their uuid is the full Foundry page uuid, which does not match `Compendium.pf2e.<pack>.<document_class>.<id>`. Give page rows a second table, or drop the uuid `CHECK` and enforce the id form in the importer for every row whose `type` is not `journal_page`.

## Traits

```sql
CREATE TABLE catalog_traits (
    document_uuid   TEXT NOT NULL REFERENCES catalog_documents (uuid) ON DELETE CASCADE,
    kind            TEXT NOT NULL CHECK (kind IN ('trait', 'tradition', 'other_tag')),
    trait           TEXT NOT NULL,
    PRIMARY KEY (document_uuid, kind, trait)
) STRICT;

CREATE INDEX traits_lookup_idx ON catalog_traits (kind, trait);
```

Load `system.traits.value` as `trait`, `system.traits.traditions` as `tradition`, and `system.traits.otherTags` as `other_tag`. Creature traits come from the actor's `system.traits.value`.

"Uncommon fire spells of rank 3":

```sql
SELECT d.uuid, d.name
FROM catalog_documents d
JOIN catalog_packs p ON p.name = d.pack
JOIN catalog_traits t ON t.document_uuid = d.uuid
WHERE p.audience = 'player'
  AND d.type = 'spell'
  AND d.level = 3
  AND d.rarity = 'uncommon'
  AND t.kind = 'trait'
  AND t.trait = 'fire';
```

## Rules

One row per `system.rules[]` element, in array order. Embedded item rules set `embedded_item_id` and leave `document_uuid` null, so a troll's strike rules are not attributed to a catalog equipment row.

SQLite allows many `NULL`s in a `UNIQUE` column, so document rules and embedded rules can each be unique on `(owner, position)`.

```sql
CREATE TABLE catalog_rules (
    id                INTEGER PRIMARY KEY,
    document_uuid     TEXT REFERENCES catalog_documents (uuid) ON DELETE CASCADE,
    embedded_item_id  INTEGER,              -- FK added after embedded items exist
    position          INTEGER NOT NULL,
    key               TEXT NOT NULL,        -- GrantItem, FlatModifier, ChoiceSet, ...
    selector          TEXT,
    predicate         TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(predicate)),
    payload           TEXT NOT NULL CHECK (json_valid(payload)),
    CHECK ((document_uuid IS NOT NULL) + (embedded_item_id IS NOT NULL) = 1),
    UNIQUE (document_uuid, position),
    UNIQUE (embedded_item_id, position)
) STRICT;

CREATE INDEX rules_key_selector_idx ON catalog_rules (key, selector);
```

Audit query for attack-roll modifiers. The result is a list of rule elements, not an attack bonus.

```sql
SELECT d.name, r.position, r.predicate, r.payload
FROM catalog_rules r
JOIN catalog_documents d ON d.uuid = r.document_uuid
WHERE r.key = 'FlatModifier'
  AND r.selector = 'attack';
```

## Links

```sql
CREATE TABLE catalog_links (
    id            INTEGER PRIMARY KEY,
    from_uuid     TEXT REFERENCES catalog_documents (uuid) ON DELETE CASCADE,
    from_embedded INTEGER,
    to_ref        TEXT NOT NULL,            -- as written in the source
    to_uuid       TEXT REFERENCES catalog_documents (uuid) ON DELETE SET NULL,
    kind          TEXT NOT NULL CHECK (kind IN (
                      'description', 'grant', 'effect', 'choice', 'embedded', 'journal')),
    detail        TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(detail)),
    CHECK (from_uuid IS NOT NULL OR from_embedded IS NOT NULL)
) STRICT;

CREATE INDEX links_from_idx ON catalog_links (from_uuid, kind);
CREATE INDEX links_to_idx ON catalog_links (to_uuid, kind);
CREATE INDEX links_unresolved_idx ON catalog_links (to_ref) WHERE to_uuid IS NULL;
```

`ON DELETE SET NULL` leaves the edge visible as unresolved when a rebuild drops the target. The next import re-resolves it.

`detail` carries the context the columns cannot: `{"rule_position":0}` for a `GrantItem`, `{"level":1}` for a class feature in `system.items`, `{"text":"Bastion"}` for an `@UUID` label.

Class features granted at level 1:

```sql
SELECT target.name, target.uuid, l.detail
FROM catalog_links l
JOIN catalog_documents target ON target.uuid = l.to_uuid
WHERE l.from_uuid = 'Compendium.pf2e.classes.Item.<fighter id>'
  AND l.kind = 'grant'
  AND CAST(json_extract(l.detail, '$.level') AS INTEGER) = 1
ORDER BY target.name;
```

## Reprint groups

`build/duplicates.json` is a list of `{ publication, entries: { pack: [names] } }`. Flatten it.

```sql
CREATE TABLE catalog_name_groups (
    publication   TEXT,                     -- null when the source group has none
    pack          TEXT NOT NULL,
    name          TEXT NOT NULL,
    name_folded   TEXT NOT NULL,
    PRIMARY KEY (pack, name)
) STRICT;

CREATE INDEX name_groups_name_idx ON catalog_name_groups (name_folded);
```

Prefer the remaster row when a browser searches by name and several documents share it. `remaster` is `1` or `0`, so descending order puts the remaster row first.

```sql
SELECT d.uuid, d.name, d.pack, d.remaster, d.source_title
FROM catalog_documents d
JOIN catalog_packs p ON p.name = d.pack
WHERE p.audience = 'player'
  AND d.name_folded = lower('Fireball')
ORDER BY d.remaster DESC
LIMIT 1;
```

Both printings stay in `catalog_documents`. This query is a display rule, not a uniqueness constraint.

## Type extracts

Each extract is 1:1 with a document and only exists for that `type`. libSQL `CHECK` constraints cannot subquery `catalog_documents`, so the importer is what keeps a spell out of `catalog_feat_details`. On conflict, delete the document row and insert again so cascades clear the old extract, then insert the matching extract in the same transaction.

```sql
CREATE TABLE catalog_spell_details (
    document_uuid     TEXT PRIMARY KEY REFERENCES catalog_documents (uuid) ON DELETE CASCADE,
    area_type         TEXT,
    area_value        INTEGER,
    defense           TEXT,                 -- reflex, fortitude, will, or null
    heightening_type  TEXT,                 -- interval, fixed, or null
    time              TEXT
) STRICT;

CREATE TABLE catalog_feat_details (
    document_uuid   TEXT PRIMARY KEY REFERENCES catalog_documents (uuid) ON DELETE CASCADE,
    category        TEXT NOT NULL,          -- ancestry, class, skill, general, ...
    action_type     TEXT NOT NULL,          -- action, reaction, free, passive
    actions         INTEGER CHECK (actions IS NULL OR actions BETWEEN 1 AND 3),
    prerequisites   TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(prerequisites))
) STRICT;

CREATE INDEX feat_category_idx ON catalog_feat_details (category, action_type);

CREATE TABLE catalog_class_details (
    document_uuid         TEXT PRIMARY KEY REFERENCES catalog_documents (uuid) ON DELETE CASCADE,
    hp                    INTEGER NOT NULL,
    key_ability           TEXT,
    class_feat_levels     TEXT NOT NULL CHECK (json_valid(class_feat_levels)),
    ancestry_feat_levels  TEXT NOT NULL CHECK (json_valid(ancestry_feat_levels)),
    general_feat_levels   TEXT NOT NULL CHECK (json_valid(general_feat_levels)),
    skill_feat_levels     TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(skill_feat_levels))
) STRICT;

CREATE TABLE catalog_equipment_details (
    document_uuid   TEXT PRIMARY KEY REFERENCES catalog_documents (uuid) ON DELETE CASCADE,
    price_cp        INTEGER,                -- normalized to copper; null if no price
    bulk            TEXT,
    category        TEXT,
    item_group      TEXT,
    damage_die      TEXT,
    damage_type     TEXT,
    armor_category  TEXT
) STRICT;

CREATE INDEX equipment_category_idx
    ON catalog_equipment_details (category, item_group);

CREATE TABLE catalog_creature_details (
    document_uuid   TEXT PRIMARY KEY REFERENCES catalog_documents (uuid) ON DELETE CASCADE,
    size            TEXT
) STRICT;
```

Prerequisite search is `json_each`, not a GIN index:

```sql
SELECT d.name
FROM catalog_feat_details f
JOIN catalog_documents d ON d.uuid = f.document_uuid
JOIN json_each(f.prerequisites) p
WHERE p.value = 'Shield Block';
```

Price stays numeric (`price_cp`) so "items under 5 gp" is a range scan (`price_cp < 500`). The original `{gp, sp, cp}` object remains in `payload`.

Level arrays on classes stay JSON. "Does this class grant a class feat at level 4?" is

```sql
SELECT 1
FROM catalog_class_details c, json_each(c.class_feat_levels) lvl
WHERE c.document_uuid = ?
  AND CAST(lvl.value AS INTEGER) = 4;
```

## Embedded items

Strikes, NPC spells, and loot contents. Not in `catalog_documents`.

```sql
CREATE TABLE catalog_embedded_items (
    id            INTEGER PRIMARY KEY,
    parent_uuid   TEXT NOT NULL REFERENCES catalog_documents (uuid) ON DELETE CASCADE,
    foundry_id    TEXT NOT NULL,
    type          TEXT NOT NULL,
    name          TEXT NOT NULL,
    sort          INTEGER,
    payload       TEXT NOT NULL CHECK (json_valid(payload)),
    UNIQUE (parent_uuid, foundry_id)
) STRICT;

CREATE INDEX embedded_parent_idx ON catalog_embedded_items (parent_uuid, sort);

-- catalog_rules and catalog_links are created first with embedded_item_id /
-- from_embedded as plain INTEGER. After this table exists, rebuild those two
-- tables with the foreign keys below, or create them after catalog_embedded_items
-- and skip the deferred ALTER. libSQL accepts ADD CONSTRAINT only by rebuilding
-- the table, so create catalog_rules and catalog_links after catalog_embedded_items.

-- FOREIGN KEY (embedded_item_id) REFERENCES catalog_embedded_items (id) ON DELETE CASCADE
-- FOREIGN KEY (from_embedded) REFERENCES catalog_embedded_items (id) ON DELETE CASCADE
```

Create `catalog_embedded_items` before `catalog_rules` and `catalog_links` so those foreign keys exist in the original `CREATE TABLE`. The `CHECK` that requires exactly one owner still applies.

A creature and its strikes:

```sql
SELECT e.type, e.name, json_extract(e.payload, '$.system.damageRolls') AS damage
FROM catalog_embedded_items e
WHERE e.parent_uuid = 'Compendium.pf2e.pathfinder-bestiary.Actor.<troll id>'
ORDER BY e.sort;
```

## Play tables

Characters reference catalog uuids. The application generates character and owned-item ids (`crypto.randomUUID()` or equivalent). libSQL has no `gen_random_uuid()`.

`ON DELETE RESTRICT` is the default when a foreign key omits a delete action. A pack rebuild that would drop a document a character still uses fails the transaction. Record the missing uuid in `play_broken_refs` only in an explicit retire step, then delete.

```sql
CREATE TABLE play_characters (
    id              TEXT PRIMARY KEY,
    name            TEXT NOT NULL,
    level           INTEGER NOT NULL CHECK (level BETWEEN 1 AND 20),
    class_uuid      TEXT REFERENCES catalog_documents (uuid),
    ancestry_uuid   TEXT REFERENCES catalog_documents (uuid),
    background_uuid TEXT REFERENCES catalog_documents (uuid),
    heritage_uuid   TEXT REFERENCES catalog_documents (uuid) ON DELETE SET NULL,
    build           TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(build))
) STRICT;

CREATE TABLE play_owned_items (
    id              TEXT PRIMARY KEY,
    character_id    TEXT NOT NULL REFERENCES play_characters (id) ON DELETE CASCADE,
    catalog_uuid    TEXT REFERENCES catalog_documents (uuid),
    qty             INTEGER NOT NULL DEFAULT 1 CHECK (qty > 0),
    taken_level     INTEGER,
    instance        TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(instance)),
    UNIQUE (character_id, catalog_uuid, taken_level)
) STRICT;

CREATE TABLE play_choices (
    owned_item_id   TEXT NOT NULL REFERENCES play_owned_items (id) ON DELETE CASCADE,
    rule_position   INTEGER NOT NULL,
    selection       TEXT NOT NULL CHECK (json_valid(selection)),
    PRIMARY KEY (owned_item_id, rule_position)
) STRICT;

CREATE TABLE play_broken_refs (
    character_id    TEXT NOT NULL REFERENCES play_characters (id) ON DELETE CASCADE,
    catalog_uuid    TEXT NOT NULL,
    noticed_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    PRIMARY KEY (character_id, catalog_uuid)
) STRICT;
```

`play_choices` is the compendium `ChoiceSet.selection` that the source leaves empty. Re-importing `catalog_rules` must not touch this table.

`UNIQUE (character_id, catalog_uuid, taken_level)` allows the same feat twice only when `taken_level` differs. In SQLite, `NULL` `taken_level` values do not collide, so two rows with a null taken level would both insert. Require `taken_level` for feats, or store `taken_level` as `-1` when unknown. Feats with `maxTakable > 1` that share a level need another discriminator in `instance` and a wider unique key. Read `maxTakable` from `payload` before inserting the second copy.

## Import

Run inside one transaction per pack (`BEGIN IMMEDIATE` so the writer lock is taken up front).

1. Upsert `catalog_packs` from `system.pf2e.json` (`INSERT ... ON CONFLICT(name) DO UPDATE`).
2. Replace `catalog_folders` for that pack.
3. Upsert `catalog_documents` on `(pack, document_class, foundry_id)`. Set `name_folded` to `lower(name)` in the importer.
4. Delete and reinsert traits, rules, links, and the type extract for those uuids. Deleting the document is simpler when `type` might have changed; cascades clear child rows. Then insert the document, the extract, traits, rules, and links.
5. Insert `catalog_embedded_items` for actor `items[]`, then their rules and links.
6. Delete catalog documents in that pack whose `source_path` was not seen. A `play_` foreign key with no `ON DELETE` aborts the transaction if a character still points at one.
7. After every pack: resolve `links.to_ref` to `links.to_uuid` by pack plus name or slug (`documents_slug_idx` and `documents_name_idx`). Leave `to_uuid` null when the target pack was not imported.
8. Replace `catalog_name_groups` from `build/duplicates.json`.

Do not read `dist/**` LevelDB packs. Ignore `_folders.json` as documents; they load into `catalog_folders` only.

WAL mode fits this workload (one importer, many readers):

```sql
PRAGMA journal_mode = WAL;
```

## Indexes

| Query                               | Index                                 |
| ----------------------------------- | ------------------------------------- |
| Browse by pack, type, level, rarity | `documents_browse_idx`                |
| Name search                         | `documents_name_idx` on `name_folded` |
| Trait filter                        | `traits_lookup_idx`                   |
| Grants in and out                   | `links_from_idx`, `links_to_idx`      |
| Unresolved refs after import        | partial `links_unresolved_idx`        |
| Rule audit by key and selector      | `rules_key_selector_idx`              |
| Feat category                       | `feat_category_idx`                   |
| Equipment category                  | `equipment_category_idx`              |
| Creature strikes                    | `embedded_parent_idx`                 |

Infix name search can use the `fts5` module on `catalog_documents.name` if the browser needs it. Equality and prefix lookup on `name_folded` do not.

## Integrity the database does not prove

- A `predicate` is well-formed `Predicate` syntax. Validate in the importer against `src/module/system/predication.ts`. Store the JSON either way and record importer warnings:

```sql
CREATE TABLE catalog_import_warnings (
    id           INTEGER PRIMARY KEY,
    source_path  TEXT NOT NULL,
    message      TEXT NOT NULL
) STRICT;
```

- A `rules.key` is one of `RuleElements.builtin`. Unknown keys are legal homebrew. Do not close the list with a `CHECK`.
- Prerequisite prose is satisfied by a character. That is the rules service.
- Two documents with the same name are a mistake unless `catalog_name_groups` lists them. After import, warn when `name_folded` is duplicated across `audience = 'player'` packs and the name is absent from `catalog_name_groups`.

## Backup

The catalog is derived. A copy of the libSQL file is a cache. The recovery path is re-running the import from git at a known commit.

`play_` rows are the only data that cannot be rebuilt from `.data`. Copy them out on their own schedule:

```sql
.mode insert play_characters
SELECT * FROM play_characters;
-- same for play_owned_items, play_choices, play_broken_refs
```

Or keep `play_` in the same file and snapshot the file, then treat a restore as "characters plus a catalog that must be reimported if it disagrees with the git revision you check out." Restoring a catalog snapshot without the matching git revision makes uuids and payloads disagree with `.data`.
