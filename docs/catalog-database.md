# Catalog database for `.data`

How to turn the Pathfinder 2e Foundry source packs into a queryable catalog without flattening away the parts of the game that are actually dynamic.

This describes the data as it exists in this repository: JSON source under `.data/`, pack metadata in `system.pf2e.json`, and the rules engine under `src/module/rules/`.

## What the source actually is

`.data/` is about 98 compendium packs. Each pack is a directory of one JSON file per Foundry document, plus `_folders.json`. The build (`build/lib/compendium-pack.ts`) compiles those files into LevelDB compendia. A pack is a **distribution and ownership unit** (a book, an adventure bestiary, a mechanical bucket such as feats or spell effects). It is not a type.

`system.pf2e.json` declares each pack’s Foundry document class:

| Document class | Packs | What lives there                                                                                         |
| -------------- | ----: | -------------------------------------------------------------------------------------------------------- |
| Actor          |    68 | Almost all adventure and bestiary packs, plus hazards, vehicles, NPC gallery, iconics                    |
| Item           |    25 | Player options and mechanical pieces: ancestries, classes, feats, spells, equipment, conditions, effects |
| JournalEntry   |     2 | Rules text and adventure journals. Descriptions link here with `@UUID`                                   |
| Macro          |     2 | Action macros                                                                                            |
| RollTable      |     1 | Rollable tables                                                                                          |

Inside an Item or Actor, `type` is the game kind. Item types include `action`, `affliction`, `ammo`, `ancestry`, `armor`, `background`, `backpack`, `book`, `campaignFeature`, `class`, `condition`, `consumable`, `deity`, `effect`, `equipment`, `feat`, `heritage`, `kit`, `lore`, `melee`, `shield`, `spell`, `spellcastingEntry`, `treasure`, and `weapon`. Actor types include `npc`, `character`, `hazard`, `familiar`, `vehicle`, `army`, `loot`, and `party`.

A document is three layers stacked on one object:

1. **Identity.** `_id`, `name`, `img`, `folder`, `type`.
2. **Typed system data.** Shape depends on `type`. A spell has rank, traditions, area, defense, and heightening (`.data/spells/spells/rank-3/fireball.json`). A class has HP, proficiency tracks, feat slot levels, and a map of granted features (`.data/classes/fighter.json`). An ancestry has boosts, flaws, languages, speed, and vision.
3. **Behavior.** `system.rules` is a list of rule elements. `system.description.value` is HTML that may contain `@UUID[...]` links. Prerequisites on feats are display strings (`"Shield Block"`), not a predicate the engine evaluates.

Actors also embed items. A troll’s jaws are a `melee` item stored in the actor’s `items` array, with its own `_id`, traits, and damage rolls. Those strikes are not catalog entries. They exist only as part of that creature.

## Why a single content table fails

Pathfinder’s complexity in this codebase is not “lots of columns.” It is that **the same document is both a catalog card and a program**.

- **Grants are data.** Bastion Dedication’s rules are `GrantItem` of `Compendium.pf2e.feats-srd.Item.Reactive Shield`. Fighter’s `system.items` is a level-keyed map of class-feature UUIDs. Ancestries, backgrounds, and kits grant the same way.
- **Most modifiers are conditional.** Rule elements such as `FlatModifier`, `DamageDice`, and `AdjustDegreeOfSuccess` carry a `predicate`: a small boolean language over roll options (`self:class:fighter`, `item:trait:agile`, `gte: [actor:level, 5]`). `Predicate` in `src/module/system/predication.ts` tests those statements against a set built at roll time. SQL cannot answer “does this bonus apply to this strike” without reimplementing that evaluator.
- **Choices are unresolved until play.** `ChoiceSet` stores a menu (a `CONFIG.PF2E` record, an item query, or an inline list) and a `selection` that is empty in the compendium and filled on the actor.
- **The same name is not the same document.** `build/duplicates.json` records names that legitimately appear in more than one pack (remaster reprints, Starfinder reuse, adventure copies). Identity is the compendium UUID, not the display name.
- **Effects are a second catalog.** `spell-effects`, `feat-effects`, `bestiary-effects`, `equipment-effects`, and `other-effects` are items the rules grant or the UI applies. Players browse feats. The engine browses effects. Both must be stored. Only one should show up in a player-facing list.
- **Publication is part of the record.** `system.publication` carries `title`, `license` (`ORC` or `OGL`), and `remaster`. Filtering “Player Core only” or “drop pre-remaster” is a product query, not a nicety.

The catalog should store documents faithfully and index the edges the UI needs. It should not compile rule elements into a character sheet.

## Identity

Use the Foundry compendium UUID as the primary key:

```text
Compendium.pf2e.<pack>.<DocumentClass>.<id>
```

Examples already in the JSON:

- `Compendium.pf2e.feats-srd.Item.Reactive Shield` (link by name; the pack build resolves names to ids)
- `Compendium.pf2e.journals.JournalEntry.vx5FGEG34AxI2dow.JournalEntryPage.C3P0TycdFCN02p9u` (journal page)

`_id` is unique inside a pack, not across the game. Store `(pack, document_class, foundry_id)` and also the slug/name form, because source links use both. Embedded actor items get a separate key: parent UUID plus the embedded `_id`. They are not pack documents.

Folders (`_folders.json` and each document’s `folder`) are a browsing tree inside one pack (feat category, spell rank, adventure chapter). Keep them. Do not treat folder path as the only taxonomy. Traits, item `type`, feat `category`, spell rank, and creature level are the filters that match how the game is used.

## Schema

Relational tables for identity, facets, and edges. JSON text for the payload that has a different shape per type. The target engine is libSQL: one database file, `STRICT` tables, `TEXT` JSON with `json_valid`, and table prefixes instead of schemas. The concrete DDL is in [catalog-database-schema.md](./catalog-database-schema.md).

### `packs`

Loaded from `system.pf2e.json` `packs[]`.

| Column           | Notes                                                                                                                                                                                        |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`           | `feats`, `spells`, `pathfinder-bestiary`, `abomination-vaults-bestiary`                                                                                                                      |
| `label`          | Display name                                                                                                                                                                                 |
| `document_class` | `Actor`, `Item`, `JournalEntry`, `Macro`, `RollTable`                                                                                                                                        |
| `audience`       | `player`, `gm`, `engine`. Feats and spells are `player`. Adventure bestiaries are `gm`. `*-effects`, conditions used only as implementations, macros, and most journals are `engine` or `gm` |

`audience` is assigned by pack name, not stored in Foundry. It is what keeps a compendium browser from listing “Effect: Courageous Anthem” next to the spell.

### `documents`

One row per source file that is a real compendium entry (skip nothing mechanical; filter with `audience` and `embedded = false` at query time).

| Column           | Notes                                                                                              |
| ---------------- | -------------------------------------------------------------------------------------------------- |
| `uuid`           | Primary key, canonical id form                                                                     |
| `pack`           | FK                                                                                                 |
| `document_class` |                                                                                                    |
| `type`           | `feat`, `spell`, `npc`, `weapon`, …                                                                |
| `foundry_id`     | `_id`                                                                                              |
| `name`           |                                                                                                    |
| `slug`           | `system.slug` when present, otherwise a sluggified name. The rules engine and many links use slugs |
| `folder_id`      | Nullable FK into `folders`                                                                         |
| `level`          | Feat level, item level, creature level, spell rank. Null when the type has none                    |
| `rarity`         | `system.traits.rarity`                                                                             |
| `remaster`       | `system.publication.remaster`                                                                      |
| `license`        | `ORC` / `OGL`                                                                                      |
| `source_title`   | `system.publication.title`                                                                         |
| `source_path`    | Path under `.data/` for rebuilds                                                                   |
| `payload`        | Full document JSON                                                                                 |

Do not split `payload` into a column per system field. Ancestry boosts, weapon runes, spell heightening, hazard complexity, and army data do not share a schema. Typed columns above are the ones every browser query needs. Type-specific extractors (below) add more columns only where a screen needs to sort or filter.

### `folders`

`pack`, `foundry_id`, `name`, `parent_id`, `sort`. Rebuild the in-pack tree. A feat’s folder might be `class/fighter/level-1` on disk and a Foundry folder id in JSON. Store both the Foundry folder and the relative source path so imports stay stable when folder ids are regenerated.

### `traits`

`document_uuid`, `trait`. Unique on that pair.

Sources, depending on type:

- `system.traits.value` (almost everything)
- `system.traits.traditions` for spells (store with a `kind` of `tradition` so arcane is not mixed with the `fire` trait)
- `system.traits.otherTags` when present
- Actor `system.traits.value` for creatures

This is the main many-to-many. “All uncommon fire spells of rank 3” is `type = spell`, `level = 3`, trait `fire`, `rarity = uncommon`.

### `links`

Every cross-document reference the source can express, extracted at import.

| Column      | Notes                                                                                                           |
| ----------- | --------------------------------------------------------------------------------------------------------------- |
| `from_uuid` |                                                                                                                 |
| `to_ref`    | Raw reference as written: UUID, name, or slug                                                                   |
| `to_uuid`   | Resolved when the target exists in this catalog. Null if it points at another system or a not-yet-imported pack |
| `kind`      | See below                                                                                                       |
| `detail`    | JSON: rule index, grant level, link text                                                                        |

`kind` values that matter:

| Kind          | Where it comes from                                                                 |
| ------------- | ----------------------------------------------------------------------------------- |
| `description` | `@UUID` in HTML description                                                         |
| `grant`       | `GrantItem` and `system.items` on ancestry, background, class, kit                  |
| `effect`      | `selfEffect`, `EphemeralEffect`, spell-effect links                                 |
| `choice`      | `ChoiceSet` entries whose value is an item UUID                                     |
| `embedded`    | Actor `items[]` that are copies of a compendium item (when the source marks a UUID) |
| `journal`     | Description links whose document class is `JournalEntry`                            |

Resolve names the way `CompendiumPack` does: within the referenced pack, name and slug map to `_id`. Keep `to_ref` even after resolution so a rebuild can show what the source said.

This table answers the questions a character builder asks without running rules: what does this class grant at level 5, what feat does this dedication add, which spells mention this condition, where is this effect applied from.

### `rules`

One row per element of `system.rules`, including rules on embedded items if you store those items.

| Column          | Notes                                                                         |
| --------------- | ----------------------------------------------------------------------------- |
| `document_uuid` |                                                                               |
| `position`      | Index in the array. Order matters; later elements see earlier choices         |
| `key`           | `GrantItem`, `FlatModifier`, `ChoiceSet`, `RollOption`, …                     |
| `selector`      | When the element has one (`attack`, `ac`, `strike-damage`, …). Null otherwise |
| `predicate`     | JSON array, or empty                                                          |
| `payload`       | The rest of the element                                                       |

The built-in keys live in `RuleElements.builtin` in `src/module/rules/index.ts`: `ActiveEffectLike`, `ActorTraits`, `AdjustDegreeOfSuccess`, `AdjustModifier`, `AdjustStrike`, `Aura`, `BaseSpeed`, `BattleForm`, `ChoiceSet`, `CraftingAbility`, `CreatureSize`, `CriticalSpecialization`, `DamageAlteration`, `DamageDice`, `DexterityModifierCap`, `EphemeralEffect`, `FastHealing`, `FlatModifier`, `GrantItem`, `Immunity`, `ItemAlteration`, `LoseHitPoints`, `MartialProficiency`, `MultipleAttackPenalty`, `Note`, `Resistance`, `RollOption`, `RollTwice`, `Sense`, `SpecialResource`, `SpecialStatistic`, `Strike`, `SubstituteRoll`, `TempHP`, `TokenEffectIcon`, `TokenImage`, `TokenLight`, `TokenMark`, `TokenName`, `Weakness`.

Index `key` and `selector`. Query “every feat that adds a modifier to attack rolls” from this table. Do not query “the fighter’s attack bonus at level 7.” That number is produced by actor preparation: class proficiency, ability modifiers, item bonuses, and every predicate that passes for that roll.

### `name_groups`

Imported from `build/duplicates.json`. A group is a display name that appears in more than one pack on purpose. Columns: `name`, `pack`, `publication` (the group’s publication label, nullable). Use it to prefer the remaster document when several rows share a name, and to avoid treating reprints as separate player options.

## Type-specific extracts

Add a narrow table only when a screen filters on fields that are not traits or level. Suggested first set:

**`spell_details`** — `traditions[]` (also in `traits`), `area_type`, `area_value`, `defense` (`reflex` / `fortitude` / `will` / null), `heightening_type` (`interval` or `fixed`), `time`. Heightening formulas stay inside `payload`.

**`feat_details`** — `category` (`ancestry`, `class`, `skill`, `general`, `archetype`, …), `action_type` (`action`, `reaction`, `free`, `passive`), `actions` (1–3 or null), `prerequisites` as the original string list. Prerequisite strings are for display and a best-effort text search. Structured eligibility is the rule elements plus traits, and even that is incomplete relative to the book text.

**`class_details`** — HP, key ability if present, and the feat-slot level arrays (`classFeatLevels`, `ancestryFeatLevels`, `generalFeatLevels`, skill feats). Granted features are `links` of kind `grant` with the level in `detail`.

**`equipment_details`** for `weapon`, `armor`, `shield`, `consumable`, `equipment`, `treasure`, `ammo`, `backpack` — price, bulk, `category`, `group`, damage die and damage type, armor category. Runes and material are JSON on the physical item; a worn weapon on a character is an instance, not a second catalog row.

**`creature_details`** for `npc` and `hazard` — level, size, and the trait list already in `traits`. Attacks, spells, and abilities stay embedded documents (below).

**`embedded_items`** — `parent_uuid`, `foundry_id`, `type`, `name`, `sort`, `payload`. Use this for bestiary strikes, NPC spells, and loot. Do not insert them into `documents`, or the equipment browser fills up with “Jaws.”

## What stays out of the database

**Actor preparation.** `RuleElementSynthetics` (`src/module/rules/synthetics.ts`) is the structure an actor fills while applying every owned item’s rules: modifiers, damage dice, resistances, senses, granted items, roll notes, proficiencies. That structure is a function of a specific character (choices made, items worn, conditions present, roll context). Recomputing it belongs in an application service that either embeds the system’s rule-element code or reimplements `Predicate` plus the subset of keys you need. The catalog feeds that service. It does not replace it.

**Roll options.** They are an open vocabulary of strings produced by items, conditions, and the strike being rolled. Store predicates as JSON. Evaluate them against an option set supplied by the caller.

**Choice selections.** A compendium `ChoiceSet` has no selection. A character record (separate from the catalog) stores `document uuid + rule position + selection`. Re-importing packs must not wipe those rows.

**Prose prerequisites and GM text.** Keep them in `payload` and in `feat_details.prerequisites` for search. Do not parse “trained in Acrobatics” into a hard gate unless you have a tested mapping. The Foundry data itself treats that line as text.

**Journal HTML.** Store the journal document and the links out of it. Rendering rules text is a reader, not a table of mechanics.

## Import

One pass over `.data/**/*.json`, using pack metadata from `system.pf2e.json` so a directory is bound to a document class.

1. Upsert `packs` and `folders`.
2. Upsert `documents` with the full JSON payload. Canonicalize UUID to the id form.
3. Extract traits, publication, level, and the type-specific row.
4. Walk `system.rules`, description HTML, and `system.items`. Insert `rules` and `links`.
5. For actors, insert `embedded_items` and their rules. If an embedded item’s rules reference a UUID, that is a `link`.
6. Load `build/duplicates.json` into `name_groups`.
7. Second pass: resolve `links.to_ref` to `to_uuid` now that every pack is loaded. Leave unresolved refs visible; adventure content sometimes points at a journal page or a pack you chose not to import.

Rebuild by pack. Source paths and foundry ids are stable enough to upsert. Delete documents whose source file disappeared in that pack.

Ignore `dist/` compendia. The JSON source is the catalog input. LevelDB is a Foundry packaging format.

## Queries the schema is for

These stay in SQL:

- Browse player options by type, level, trait, rarity, tradition, source book, remaster flag.
- List class features granted at each level, and feats granted by a dedication.
- Find every document whose rules grant a given UUID, or whose description links to a journal page.
- List rule elements by key and selector for auditing (“every `RollOption` that sets `self:rage`”).
- Show a creature with its embedded strikes and spells without mixing those strikes into the equipment list.
- Prefer one document when `name_groups` says the name is reprinted.

These stay in the rules service, with the catalog as input:

- Whether a character meets the mechanical side of a feat (proficiency ranks, owned items, attributes).
- The numeric modifier on a given strike, save, or skill.
- Heightened spell damage for a slot rank (the formula is on the spell; the slot is on the character).
- Expanding a `ChoiceSet` into legal options, which can themselves be a filtered catalog query (`Item` of type `feat` with trait `fighter` and level ≤ character level).

## Character records, kept apart

A catalog of the game and a character are different databases that share UUIDs.

A character row points at class, ancestry, background, and heritage UUIDs. Owned items point at catalog UUIDs plus instance data (quantity, runes, invested, the `ChoiceSet` selections, `level.taken` when a feat is taken later than its printed level). Conditions and effects point at catalog UUIDs and carry duration and badge values.

When a `GrantItem` rule fires, the character gains an owned item. The catalog row is unchanged. Deleting a feat from the character drops the grants that came from it. That cascade is the rule engine’s job; `links` of kind `grant` are the static picture of what _would_ be granted.

## Mapping from a source file

`.data/feats/archetype/bastion/level-2/bastion-dedication.json` becomes:

- `documents`: type `feat`, name `Bastion Dedication`, level `2`, rarity `common`, remaster true, source `Pathfinder Player Core 2`, pack `feats`.
- `traits`: `archetype`, `dedication`.
- `feat_details`: category `class`, action type `passive`, prerequisite text `Shield Block`.
- `rules`: one row, key `GrantItem`, payload `{ "uuid": "Compendium.pf2e.feats-srd.Item.Reactive Shield" }`.
- `links`: kind `grant` to Reactive Shield; kind `journal` to the Bastion journal page parsed from the description.
- `folders`: the archetype/bastion/level-2 folder chain.

Nothing in that row is a computed attack bonus. The catalog’s job is to find Bastion Dedication, show its text, and know that taking it also takes Reactive Shield.
