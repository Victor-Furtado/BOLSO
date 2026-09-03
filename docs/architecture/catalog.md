# Catalog Data Model — Architecture Rule

## 1. Purpose

The Catalog is the canonical repository of all game content available to the Character Creator.

The Catalog represents **what exists**, not what a character has selected or what is currently enabled for a character.

The Catalog must support:

- Pathfinder 2e Remaster content
- official content
- homebrew content
- custom content
- future content types
- relationships between catalog entries
- prerequisites
- rules/effects
- variants and replacements
- arbitrary type-specific data

The Catalog must remain extensible without requiring a database migration every time a new Pathfinder content type is introduced.

---

# 2. Core Architectural Rule

> **The Catalog stores definitions, never user state.**

The following concepts MUST NOT be stored in the Catalog:

- character selections
- character progression
- character-specific state
- whether a character owns an item
- whether a character has activated an artifact
- campaign-specific enable/disable state
- temporary effects on a character
- inventory
- equipped state
- prepared spells
- current charges
- current HP
- current conditions

Those belong to domains outside the Catalog.

The Catalog answers questions such as:

> "What is this feat?"

> "What prerequisites does this feat have?"

> "What does this item grant?"

> "What entries are related to this archetype?"

> "What official/homebrew source defines this content?"

It does NOT answer:

> "Did this character select this feat?"

---

# 3. Database Philosophy

Use a **hybrid relational/document model**.

Relational columns MUST be used for fields that are:

- commonly queried
- used for filtering
- used for sorting
- used for relationships
- part of the identity of an entry
- part of the generic game taxonomy

Type-specific or infrequently queried information MAY be stored in a JSON column.

Do NOT create one table per Pathfinder content type.

Do NOT put the entire Catalog entry into JSON.

Do NOT create a rigid schema that requires a migration for every new content type.

---

# 4. Main Entity: `catalog_entry`

Every piece of catalog content MUST be represented by a `catalog_entry`.

Recommended schema:

```sql
catalog_entry
-------------
id              TEXT PRIMARY KEY
source_id       TEXT NOT NULL
type            TEXT NOT NULL
slug            TEXT NOT NULL
name            TEXT NOT NULL
description     TEXT
level           INTEGER
rarity          TEXT
traits          TEXT
data            TEXT NOT NULL
created_at      TEXT NOT NULL
updated_at      TEXT NOT NULL
```

### Field rules

### `id`

Globally unique identifier.

Use a stable identifier that does not depend on the entry's display name.

Example:

```text
feat.fighter.power-attack
item.weapon.longsword
ancestry.human
```

The exact ID strategy may be implementation-specific, but IDs MUST remain stable across content updates.

Never use the display name as the primary key.

---

### `source_id`

References the source that owns/defines the content.

Examples:

```text
player-core
gm-core
my-homebrew
campaign-homebrew
```

An entry MUST have exactly one canonical source.

---

### `type`

Identifies the generic Catalog type.

Examples:

```text
ancestry
heritage
background
class
subclass
feat
skill
spell
item
weapon
armor
equipment
action
archetype
condition
rule
trait
```

The system MUST treat `type` as extensible.

Adding a new Catalog type SHOULD NOT require a database migration.

Application-level Zod schemas are responsible for validating type-specific data.

---

### `slug`

Human-readable stable identifier.

The slug MUST be unique within a source.

Example:

```text
power-attack
longsword
human
fighter
```

Recommended uniqueness:

```text
UNIQUE(source_id, type, slug)
```

Do not assume globally unique slugs.

---

### `name`

Display name.

The display name MUST NOT be used as an identifier.

Names may change without changing the entry ID.

---

### `description`

Human-readable description of the content.

The Catalog should store the canonical description here when the content has one.

Structured rules MUST NOT be encoded exclusively inside this field.

---

### `level`

Optional generic level.

Use this for content where level is a meaningful generic property.

Examples:

```text
feat
spell
item
archetype
```

Do not force every Catalog type to have a level.

---

### `rarity`

Optional generic rarity.

Recommended values:

```text
common
uncommon
rare
unique
```

The application MUST validate allowed values with Zod.

Do not assume every Catalog type has rarity.

---

### `traits`

Store generic Pathfinder traits in a queryable representation.

The implementation MAY use a normalized relation or SQLite JSON representation.

The preferred approach for the initial implementation is JSON unless trait-based querying becomes a major query requirement.

Example:

```json
["attack", "fighter", "flourish"]
```

---

### `data`

JSON containing type-specific data.

Example for a feat:

```json
{
	"actions": 1,
	"actionType": "single",
	"frequency": null
}
```

Example for a weapon:

```json
{
	"damage": "1d8",
	"damageType": "slashing",
	"hands": 1,
	"bulk": 1
}
```

Example for a spell:

```json
{
	"traditions": ["arcane", "primal"],
	"actions": 2,
	"range": "30 feet"
}
```

`data` MUST NOT contain:

- source identity
- entry identity
- relationships
- prerequisites that need independent querying
- timestamps
- user state

Those belong to dedicated columns/tables.

---

# 5. Source

Catalog content MUST be associated with a source.

```sql
catalog_source
--------------
id              TEXT PRIMARY KEY
slug            TEXT NOT NULL UNIQUE
name            TEXT NOT NULL
type            TEXT NOT NULL
version         TEXT
publisher       TEXT
created_at      TEXT NOT NULL
updated_at      TEXT NOT NULL
```

Recommended `type` values:

```text
official
homebrew
custom
```

Examples:

```text
player-core
gm-core
my-homebrew
```

The Source represents **where the content came from**.

It does not represent whether that content is currently enabled.

---

# 6. Catalog Relationships

Relationships between entries MUST NOT be embedded inside `catalog_entry.data`.

Use a dedicated relation table.

```sql
catalog_relation
----------------
id                  TEXT PRIMARY KEY
source_entry_id     TEXT NOT NULL
target_entry_id     TEXT NOT NULL
type                TEXT NOT NULL
data                TEXT
created_at          TEXT NOT NULL
```

The relation direction is significant.

```text
source_entry_id --type--> target_entry_id
```

Example:

```text
feat-a --requires--> feat-b
```

means:

```text
feat-a requires feat-b
```

Recommended relation types:

```text
requires
grants
modifies
replaces
upgrades
conflicts
contains
variant_of
prerequisite_of
```

New relation types MAY be introduced without changing the database schema.

The application MUST validate supported relation types with Zod.

---

# 7. Do Not Model Prerequisites as Simple Foreign Keys

A Pathfinder prerequisite is not necessarily another Catalog entry.

A prerequisite may depend on:

- level
- ability score
- skill proficiency
- class
- ancestry
- trait
- feat
- item
- multiple conditions
- OR conditions
- AND conditions
- nested conditions

Therefore prerequisites MUST be represented as structured expressions.

Create:

```sql
catalog_prerequisite
--------------------
id              TEXT PRIMARY KEY
entry_id        TEXT NOT NULL
expression      TEXT NOT NULL
created_at      TEXT NOT NULL
```

`expression` contains JSON.

Example:

```json
{
	"and": [
		{
			"type": "level",
			"operator": ">=",
			"value": 5
		},
		{
			"type": "trait",
			"value": "fighter"
		}
	]
}
```

Another example:

```json
{
	"or": [
		{
			"type": "feat",
			"value": "power-attack"
		},
		{
			"type": "feat",
			"value": "another-feat"
		}
	]
}
```

The prerequisite expression format MUST be defined and validated with Zod.

Do not encode prerequisite logic as arbitrary executable JavaScript.

Do not use `eval`.

---

# 8. Effects / Rules

Rules granted by Catalog entries MUST be represented independently from descriptive text.

Create:

```sql
catalog_effect
--------------
id              TEXT PRIMARY KEY
entry_id        TEXT NOT NULL
type            TEXT NOT NULL
data            TEXT NOT NULL
created_at      TEXT NOT NULL
```

The effect `data` is JSON validated with Zod.

Example:

```json
{
	"target": "ac",
	"operation": "add",
	"value": 1,
	"condition": {
		"type": "has_trait",
		"value": "shield"
	}
}
```

Another example:

```json
{
	"target": "skill",
	"operation": "grant_proficiency",
	"value": "athletics",
	"rank": "trained"
}
```

Effects MUST represent machine-readable game rules.

Do not rely on `description` parsing to determine mechanical effects.

---

# 9. Catalog Entry Type Schemas

The database schema is intentionally generic.

Zod is responsible for type-specific validation.

Use a discriminated union based on `type`.

Conceptually:

```ts
const CatalogEntrySchema = z.discriminatedUnion('type', [
	AncestrySchema,
	HeritageSchema,
	BackgroundSchema,
	ClassSchema,
	FeatSchema,
	SpellSchema,
	ItemSchema,
	WeaponSchema,
	ArmorSchema
	// ...
]);
```

Each type MUST define its own validation schema.

For example:

```ts
const FeatDataSchema = z.object({
	actions: z.number().int().min(0).max(3).nullable(),
	frequency: z.string().nullable()
});
```

The database remains generic while application validation remains strongly typed.

---

# 10. Zod Is the Application Boundary

Every Catalog entry entering the application MUST be validated with Zod.

Validation is required when:

- importing official content
- importing homebrew
- creating an entry
- updating an entry
- loading external JSON
- processing migrations between Catalog versions

Do not assume that SQLite type constraints are sufficient validation.

SQLite is responsible for structural persistence.

Zod is responsible for domain validation.

---

# 11. Kysely Rules

All Catalog database access MUST use Kysely.

Do not introduce a second ORM/query builder.

Queries MUST be type-safe against the Kysely database definition.

Migrations MUST be written using Kysely migrations.

Do not manually modify the Turso database schema outside migrations.

---

# 12. Turso / SQLite Rules

The Catalog MUST be compatible with SQLite/Turso.

Prefer:

```text
TEXT
INTEGER
REAL
BLOB
```

For JSON, use `TEXT` containing serialized JSON.

Do not assume PostgreSQL-specific features.

Do not introduce PostgreSQL-only types such as:

```text
JSONB
ARRAY
ENUM
UUID
```

unless they are represented in a SQLite-compatible manner.

For identifiers, use `TEXT`.

For timestamps, use a consistent ISO-8601 string representation.

---

# 13. Foreign Keys

Relationships between Catalog tables MUST use foreign keys.

For example:

```text
catalog_entry.source_id
    → catalog_source.id

catalog_relation.source_entry_id
    → catalog_entry.id

catalog_relation.target_entry_id
    → catalog_entry.id

catalog_prerequisite.entry_id
    → catalog_entry.id

catalog_effect.entry_id
    → catalog_entry.id
```

Deleting a source MUST NOT silently delete Catalog content unless explicitly required by the application.

Prefer restrictive behavior for destructive operations.

---

# 14. Indexing

Create indexes for common Catalog access patterns.

At minimum:

```text
catalog_entry(source_id)
catalog_entry(type)
catalog_entry(level)
catalog_entry(rarity)
catalog_entry(source_id, type, slug)

catalog_relation(source_entry_id)
catalog_relation(target_entry_id)
catalog_relation(type)

catalog_prerequisite(entry_id)

catalog_effect(entry_id)
catalog_effect(type)
```

Do not create indexes for every JSON property.

Only add JSON-specific indexing when there is a demonstrated query requirement.

---

# 15. Versioning

Catalog content MUST be versionable at the source level.

An update to an official or homebrew source SHOULD be represented by a source version.

Example:

```text
player-core
version = 1.0.0
```

Do not encode Catalog content versions in the primary key.

The entry ID should remain stable when the same logical entry receives a content update.

If an entry is fundamentally replaced by another entry, model that using a relationship such as:

```text
replaces
```

rather than silently changing the identity.

---

# 16. Homebrew

Homebrew MUST use exactly the same Catalog model as official content.

There MUST NOT be a separate database model for homebrew.

Example:

```text
catalog_source
---------------
id: my-homebrew
type: homebrew
```

Then:

```text
catalog_entry
--------------
source_id: my-homebrew
type: feat
slug: brutal-strike
```

Homebrew may introduce new `type`s, relationship types, and type-specific data, but those must still conform to the Catalog's generic architecture.

---

# 17. Extensibility Rule

When adding new Catalog content:

### Allowed

Add:

```text
new Catalog type
new Zod schema
new relation type
new effect type
new JSON data fields
```

### Avoid

Creating:

```text
new database table for every new content type
```

unless the new type has a strong relational/querying requirement that cannot reasonably be represented by the generic model.

The default is:

> **Generic relational shell + typed JSON payload.**

---

# 18. Separation of Concerns

The Catalog has four primary responsibilities:

```text
CatalogEntry
    ↓
"What exists?"

CatalogRelation
    ↓
"How are entries related?"

CatalogPrerequisite
    ↓
"What must be true for this entry?"

CatalogEffect
    ↓
"What mechanical rules does this entry provide?"
```

The Catalog does NOT own:

```text
Character
CharacterSelection
CharacterState
Campaign
Inventory
ActivationState
Enabled/Disabled state
```

Those belong to other domains.

---

# 19. Example

A Fighter feat might conceptually be stored as:

```text
catalog_source
    id = "player-core"

catalog_entry
    id = "feat.fighter.power-attack"
    source_id = "player-core"
    type = "feat"
    slug = "power-attack"
    name = "Power Attack"
    level = 1
    rarity = "common"
    traits = [...]
    data = {...}

catalog_prerequisite
    entry_id = "feat.fighter.power-attack"
    expression = {...}

catalog_effect
    entry_id = "feat.fighter.power-attack"
    type = "rule"
    data = {...}
```

If another feat requires Power Attack:

```text
catalog_relation
    source_entry_id = "feat.fighter.some-other-feat"
    target_entry_id = "feat.fighter.power-attack"
    type = "requires"
```

No character data is involved.

---

# 20. Non-Goals

The Catalog implementation MUST NOT implement:

- character creation
- character validation
- character progression
- character inventory
- campaign configuration
- content activation for a character
- artifact activation state
- equipped items
- prepared spells
- temporary modifiers
- current character conditions

Those systems may consume the Catalog later.

The Catalog should be designed as a **readable, immutable-by-consumer source of game definitions**.

---

# 21. Implementation Priority

Implement in this order:

1. `catalog_source`
2. `catalog_entry`
3. `catalog_relation`
4. `catalog_prerequisite`
5. `catalog_effect`
6. Zod schemas
7. Kysely database types
8. Kysely migrations
9. Catalog repository/query layer
10. import/export validation

Do not implement Character-related tables as part of the Catalog work.

---

# 22. Golden Rule

When deciding where a piece of data belongs, ask:

> **"Is this describing the game content itself, independent of any character or campaign?"**

If yes, it belongs in the Catalog.

If it describes:

> **"What a specific user/character/campaign is doing with that content?"**

it does NOT belong in the Catalog.
