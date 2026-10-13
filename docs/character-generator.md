# Character generator from the libSQL catalog

Handoff for an agent building a Pathfinder 2e character generator on top of the database in [catalog-database-schema.md](./catalog-database-schema.md). Read that file for DDL. Read [catalog-database.md](./catalog-database.md) for why the data is shaped this way. Do not read `dist/` LevelDB packs. Do not recompute the catalog from `.data` unless a uuid is missing.

The generator records a legal-looking build. It does not produce attack bonuses, AC, or skill modifiers. Those require the rules engine in `src/module/rules/`, which evaluates `catalog_rules` against a specific character and roll. This generator does not port that engine.

## What you are building

A character is a row in `play_characters` plus rows in `play_owned_items` and `play_choices`.

| Table              | You write                                                                                            | You never write                                  |
| ------------------ | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| `play_characters`  | name, level, class / ancestry / background / heritage uuids, `build` JSON for ability boosts         |                                                  |
| `play_owned_items` | one row per granted or chosen item: catalog uuid, quantity, taken level, instance JSON (worn, runes) |                                                  |
| `play_choices`     | the user's answer for each `ChoiceSet`: `(owned_item_id, rule_position, selection)`                  |                                                  |
| `catalog_*`        | nothing                                                                                              | packs, documents, rules, links, traits, extracts |

`play_characters.id` and `play_owned_items.id` are text uuids you generate. libSQL has no `gen_random_uuid()`.

Open the database with foreign keys on:

```sql
PRAGMA foreign_keys = ON;
```

Deleting a catalog document that a character still references fails on purpose. Do not set those foreign keys to `ON DELETE CASCADE`.

## What the catalog can decide

Use SQL for everything in this list.

**Identity.** `catalog_documents.uuid` is `Compendium.pf2e.<pack>.<document_class>.<foundry_id>`. Join on that. `name` is not unique. When a search returns several rows with the same `name_folded`, prefer `remaster = 1`. `catalog_name_groups` lists names that are intentional reprints; do not drop the other rows, just do not offer both as if they were different options.

**Player-facing options only.**

```sql
SELECT d.*
FROM catalog_documents d
JOIN catalog_packs p ON p.name = d.pack
WHERE p.audience = 'player';
```

`audience = 'engine'` is effects, macros, and similar. Never offer those as picks. You may follow a `catalog_links` row of kind `effect` to show what a feat applies, but the effect is not a choice. `audience = 'gm'` is creatures and adventures. Ignore it for this generator.

**Class schedule.** `catalog_class_details` holds HP, key ability, and JSON arrays of levels: `class_feat_levels`, `ancestry_feat_levels`, `general_feat_levels`, `skill_feat_levels`. Expand them with `json_each`. A class feat slot exists at level N when some element of `class_feat_levels` equals N.

**Automatic grants.** `catalog_links` where `kind = 'grant'` and `json_extract(detail, '$.level')` is null or `<=` the character's level. Sources are `system.items` on class, ancestry, background, and kit, and `GrantItem` rule elements. Insert a `play_owned_items` row for each resolved `to_uuid`. If `to_uuid` is null, the link did not resolve; surface `to_ref` as an import bug, do not invent a document.

**Feat menu for a slot.**

```sql
SELECT d.uuid, d.name, d.level, f.category, f.action_type, f.actions, f.prerequisites
FROM catalog_documents d
JOIN catalog_packs p ON p.name = d.pack
JOIN catalog_feat_details f ON f.document_uuid = d.uuid
WHERE p.audience = 'player'
  AND d.type = 'feat'
  AND f.category = ?          -- 'class', 'ancestry', 'skill', 'general'
  AND d.level <= ?            -- the slot's character level
  AND d.rarity = 'common'     -- drop this clause when the user includes uncommon/rare/unique
```

Class feats also need the class trait. Join `catalog_traits` with `kind = 'trait'` and `trait` equal to the class trait (fighter feats have trait `fighter`). Archetype dedication feats are category `class` with traits `archetype` and `dedication`. Skill feats use category `skill`.

`feat_details.prerequisites` is a JSON array of strings. Show the strings. Do not treat them as a gate. The Foundry sheet only prints them (`src/module/item/feat/document.ts`); it does not evaluate them. "Shield Block" in that array does not mean the database knows the character has Shield Block. A later version may string-match against owned item names, and that match will be wrong for prerequisites that are not item names ("trained in Acrobatics", "Strength +2").

**Traits and traditions.** Filter with `catalog_traits`, not with `json_extract` on `payload`. `kind = 'trait'` is the trait list. `kind = 'tradition'` is spell traditions (`arcane`, `divine`, `occult`, `primal`). Do not mix them.

**Spell list**, once the character has a tradition from a class feature or feat the user accepted:

```sql
SELECT d.uuid, d.name, d.level
FROM catalog_documents d
JOIN catalog_packs p ON p.name = d.pack
JOIN catalog_traits t ON t.document_uuid = d.uuid
WHERE p.audience = 'player'
  AND d.type = 'spell'
  AND d.level <= ?
  AND t.kind = 'tradition'
  AND t.trait = ?;
```

`catalog_spell_details` is display data (area, defense, time, heightening type). Heightened damage formulas stay in `payload`. Do not evaluate them.

**Equipment.** `catalog_equipment_details` for price in copper (`price_cp`), bulk, category, group, damage die, damage type, armor category. Buying gear inserts `play_owned_items` with `qty` and `instance` for runes and invested. That row is an instance. Do not copy it back into `catalog_documents`.

**Creatures.** `catalog_embedded_items` are NPC strikes and similar. Do not show them in the equipment or feat picker.

## Choices

A `ChoiceSet` is a row in `catalog_rules` with `key = 'ChoiceSet'`, attached to some document the character owns. `position` is the index in `system.rules`. The compendium payload has no selection.

When you add an owned item, read its rules:

```sql
SELECT position, key, selector, predicate, payload
FROM catalog_rules
WHERE document_uuid = ?
ORDER BY position;
```

For each `ChoiceSet`, the prompt and the options are inside `payload` (`prompt`, `choices`, `flag`, sometimes `adjustName`). Show the prompt. Write the user's answer to `play_choices`:

- `owned_item_id` is the `play_owned_items.id` of the item that owns the rule, not the catalog uuid.
- `rule_position` is `catalog_rules.position`.
- `selection` is JSON. Use the choice's `value` when the option has one.

Do not write the selection back onto `catalog_rules`. Re-importing the catalog must not touch `play_choices`.

Other rule keys (`FlatModifier`, `ActiveEffectLike`, `RollOption`, `GrantItem`, …) stay in `catalog_rules`. Follow `GrantItem` through `catalog_links` (`kind = 'grant'`). Ignore the rest for this generator. `ActiveEffectLike` paths such as `system.skills.{item|flags.system.rulesSelections.fighterSkill}.rank` are instructions to the rules engine. The `flag` on the matching `ChoiceSet` (`fighterSkill` on the fighter class) tells you which `play_choices` value that path would read. You may display "trained in &lt;chosen skill&gt;" from that pair. You may not fold it into a skill modifier.

`predicate` on a rule is a JSON array in the language implemented by `src/module/system/predication.ts`. Do not try to honor it by filtering feat lists. It applies when a roll is declared, and this generator does not declare rolls.

## Numbers you may add up

These fields are static. Read them from `payload` with `json_extract` or from the extract tables. They do not depend on predicates.

| Number                    | Source                                                                                                                                                                |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ancestry HP               | `json_extract(payload, '$.system.hp')` on the ancestry                                                                                                                |
| Class HP per level        | `catalog_class_details.hp`                                                                                                                                            |
| Hit points                | ancestry HP + class HP × level, before feats that add HP                                                                                                              |
| Key ability choices       | `json_extract(class.payload, '$.system.keyAbility.value')` — a JSON array such as `["dex","str"]`                                                                     |
| Ancestry boosts and flaws | `$.system.boosts` and `$.system.flaws` on the ancestry. Each entry is `{ "value": ["dex"] }` or a list of abilities the player picks from                             |
| Starting saves            | `$.system.savingThrows.fortitude`, `reflex`, `will` on the class. Values are proficiency ranks (0 untrained, 1 trained, 2 expert, 3 master, 4 legendary), not bonuses |
| Starting perception       | `$.system.perception` on the class, same rank scale                                                                                                                   |
| Attack and defense ranks  | `$.system.attacks` and `$.system.defenses` on the class                                                                                                               |
| Extra trained skills      | `$.system.trainedSkills.additional` on the class                                                                                                                      |

Ability boosts the player assigns (ancestry free boosts, background, class, and the levels Pathfinder grants boosts) go in `play_characters.build`, for example:

```json
{
	"abilities": { "str": 12, "dex": 16, "con": 12, "int": 10, "wis": 12, "cha": 10 },
	"boosts": [{ "source": "ancestry", "ability": "str" }]
}
```

Store the assigned abilities. Do not expect the catalog to list every boost level; the four ability boosts at levels 5, 10, 15, and 20 are game rules, not rows in `catalog_documents`.

Feats and features that add HP, skills, or speeds do so through `catalog_rules`. Leave those out of the total, or show them as an unapplied list of rule elements. Do not add `FlatModifier.value` into the ability score. Predicates and selectors make that sum wrong.

## Order of operations

1. User picks class, ancestry, background. Optionally heritage. Write the four uuids on `play_characters`. Heritage must match the ancestry: heritage `payload` links to its ancestry, or the heritage carries the ancestry trait. Check that before insert.
2. Set level. A new character starts at 1. Raising level reveals more slots and more grants. It does not delete earlier choices.
3. Insert grants for class, ancestry, and background where the link's level is null or `<=` character level. Skip a grant the character already owns (`UNIQUE (character_id, catalog_uuid, taken_level)`).
4. For each new owned item, if it has `ChoiceSet` rules, block advancement until `play_choices` has a row for every such `position`.
5. Offer feat slots whose level is `<=` character level and which do not yet have an owned feat with that `taken_level` and category. `taken_level` is the level of the slot, which can be higher than `catalog_documents.level`.
6. When the user takes a feat, insert `play_owned_items` and then apply that feat's `kind = 'grant'` links the same way as class features.
7. Offer spells only after a chosen or granted feature has established a tradition. If you cannot find a tradition on owned items' traits or rules, say so and skip the spell step rather than listing every spell.
8. Offer equipment from `audience = 'player'` and `catalog_equipment_details`.

Removing a feat deletes its `play_owned_items` row. Also delete owned items that were inserted only because of that feat's grant links. The catalog does not record the parent of a grant on the owned row, so store the granter's `play_owned_items.id` in `instance` (for example `{"grantedBy":"<owned item id>"}`) when you insert the grant. Class and ancestry grants use `{"grantedBy":"class"}` or `"ancestry"` so a level change can drop grants whose level is now above the character.

## Payload paths that matter

`catalog_documents.payload` is the Foundry document. Prefer extract columns when they exist. Use `json_extract` only for the fields with no column:

| Need                         | Path                                                                                                             |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Description HTML             | `$.system.description.value`                                                                                     |
| Class items map              | `$.system.items` — already extracted to `catalog_links`                                                          |
| Ancestry boosts              | `$.system.boosts`                                                                                                |
| Ancestry flaws               | `$.system.flaws`                                                                                                 |
| Ancestry size, speed, vision | `$.system.size`, `$.system.speed`, `$.system.vision`                                                             |
| Feat max times taken         | `$.system.maxTakable` — default 1. A second copy needs a distinct `taken_level` or the unique key will reject it |
| Publication                  | columns `source_title`, `license`, `remaster`                                                                    |

Descriptions contain `@UUID[Compendium.pf2e....]{label}` links. Those are already rows in `catalog_links` with `kind` `description` or `journal`. Render the label. Do not scrape HTML if the link row exists.

## Do not do these

- Do not query `FlatModifier` to display an attack bonus or AC.
- Do not mark a feat illegal because its prerequisite string is unmet. Show the string and let the user take it.
- Do not offer `catalog_embedded_items` or `audience = 'engine'` documents as selectable character options.
- Do not resolve "the" Fireball by `name` alone. Filter `audience = 'player'` and prefer `remaster = 1`.
- Do not update `catalog_rules.payload` when the user picks a `ChoiceSet` option.
- Do not parse prerequisite sentences into ability or skill checks.
- Do not import `.data` JSON inside the generator. If a uuid is missing, the catalog import is incomplete.
