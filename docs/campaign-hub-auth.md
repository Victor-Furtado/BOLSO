# Central Campaign Hub — login

Identity for RPG de Bolso. There is one campaign, **Bolso** (`play_campaigns.slug = bolso`). People do not join other tables. The catalog (`catalog_*`) and that campaign's allow-list (`play_campaign_options`) stay as they are. This document is who may open the hub and what they may change.

The hub is the board for that one wilderness: the period clock, each player's hero roster, and the hex map. The thing that moves is an **expedition**. Expeditions are created for a departure, filled, played, reported, and then closed. They are not campaigns. A closed expedition stays as history. An open one is the volatile record players and GMs act on.

## Accounts

An **account** is the person (email, password). Their role is on the Bolso campaign, not on a menu of tables.

| Role     | Meaning                                                                                                                                                                                                              |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `guest`  | Signed out, or signed in with no role yet. Can read the public board: the current period, rumor titles, and that expeditions exist. Cannot put a hero on an expedition, file a report, or see hexes still under fog. |
| `player` | Member of Bolso. Owns a hero roster and joins expeditions.                                                                                                                                                           |
| `gm`     | Runs Bolso. Opens and closes expeditions, approves reports, advances the period, marks heroes lost, posts rescue calls, reveals hexes.                                                                               |
| `admin`  | Operator of the site. Disables accounts and reads the audit log. An admin is not the GM unless their account also has the `gm` role.                                                                                 |

`player` and `gm` carry `manager`. It does nothing in the first version. Later it can let a trusted player open an expedition or close a rescue without being the GM. Store it now so that change is a check, not a migration. `guest` and `admin` have no manager flag.

The cookie proves the account. There is no campaign id in the URL to pick a seat. Every authenticated route is Bolso.

## Expeditions

An expedition is a trip leaving the Starting City: a date, a destination, a party of heroes, and later a report. It is created when someone schedules it and stops being current when the GM closes it.

| Action                                                               | Guest       | Player                 | GM            | Admin |
| -------------------------------------------------------------------- | ----------- | ---------------------- | ------------- | ----- |
| See the board and rescue alerts                                      | Titles only | Yes                    | Yes           | Yes   |
| Open an expedition                                                   |             |                        | Yes           |       |
| Put an available hero on an open expedition                          |             | Own heroes             |               |       |
| Leave an expedition before it departs                                |             | Own heroes             | Remove anyone |       |
| Write the report                                                     |             | Was on that expedition | Yes           |       |
| Approve the report (gold, XP, map, history) and close the expedition |             |                        | Yes           |       |
| Call a rescue for a stranded party                                   |             |                        | Yes           |       |

While an expedition is open, its party, notes, and draft report can change. After the GM approves the report, those rewards and the revealed hexes are copied onto the campaign. Editing the closed expedition does not move the map again.

The rest of the hub is campaign-scoped, not expedition-scoped:

| Hub surface      | Guest | Player         | GM                          | Admin              |
| ---------------- | ----- | -------------- | --------------------------- | ------------------ |
| Period clock     | Read  | Read           | Advance                     | Read               |
| Hero eligibility |       | Own roster     | Every roster                |                    |
| Fog-of-war map   |       | Revealed hexes | Full map, set danger        |                    |
| Membership       |       |                | Invite, remove, set manager | Disable an account |

Eligibility is derived from expeditions, not typed in:

- **Available.** The hero came back from their last expedition and has not gone out in the current period.
- **Used in period.** They already went on an expedition in this period.
- **Lost.** They left and were not marked returned for more than two sessions.

A period advances after 3 successful expeditions or 5 expeditions in total. "Successful" means the GM approved that expedition's report.

## Cookie session

The browser never stores the token in `localStorage`. Login sets an **HttpOnly, Secure, SameSite=Lax** cookie named `bolso_session`. JavaScript on the page cannot read it. SvelteKit reads it in `hooks.server.ts` and puts the account id on `event.locals`.

The cookie value is a short-lived JWT (15 minutes) signed with `JWT_SECRET` (HS256). Claims:

| Claim | Use                                                               |
| ----- | ----------------------------------------------------------------- |
| `sub` | Account id                                                        |
| `exp` | Expiry                                                            |
| `sid` | Session row id, so logout and "sign out everywhere" can revoke it |

The JWT does **not** carry the role, the manager flag, or any expedition id. A GM can change a role, and an expedition's party changes during play. A token minted at login would stay stale. Each request loads the account's role. Expedition routes load that expedition and check membership in its party.

A second **HttpOnly** cookie, `bolso_refresh`, lasts 30 days and holds only an opaque random id. It is path-scoped to `/auth/refresh`. The access JWT expires; the refresh cookie rotates. Reuse of an already-rotated refresh id revokes that session family.

Logout clears both cookies and deletes the session row. That works with JavaScript off: the login and logout forms are normal POST actions.

CSRF: state-changing routes require the SvelteKit form action or an `Origin` that matches the app. A cookie sent from another site must not approve a report or join an expedition.

Passwords are hashed with Argon2id. Email is unique, stored lowercased. There is no password in the JWT.

## Tables

These rows are product data. A catalog re-import must not touch them. `play_campaigns` already holds the single Bolso row. Accounts point at that row.

```text
accounts
  id            text pk
  email         text unique
  password_hash text
  admin         integer          -- 1 only for site operators
  disabled_at   text

sessions
  id            text pk          -- sid claim
  account_id    text fk accounts
  family_id     text             -- refresh rotation group
  expires_at    text
  revoked_at    text

members
  account_id    text pk fk accounts
  campaign_id   text fk play_campaigns   -- the Bolso row
  role          text                     -- player | gm
  manager       integer                  -- 0 or 1, ignored until a later feature
```

`guest` is the absence of a `members` row, not a role value stored in the table. Bolso keeps at least one `gm`. Removing the last GM is rejected.

```text
expeditions
  id            text pk
  campaign_id   text fk play_campaigns
  status        text             -- open | in_progress | reported | closed
  title         text
  departs_on    text
  created_by    text fk accounts

expedition_party
  expedition_id text fk expeditions
  hero_id       text               -- a hero on a player's roster
  primary key (expedition_id, hero_id)
```

`expedition_party` is who is on the trip. It changes until the expedition departs. The report hangs off the expedition and, once approved, updates the campaign. Heroes, periods, hexes, and report bodies are specified with those features. They are not columns on `accounts`.

## Request path

1. `hooks.server.ts` reads `bolso_session`. Valid signature and an unrevoked `sid` set `locals.account`. Otherwise `locals.account` is null and the visitor is a guest.
2. The hub loads `members` for that account. No row means guest. The campaign id is the Bolso row, not a route param.
3. An expedition route loads that expedition. Joining, leaving, and writing the draft require the account to own a hero on `expedition_party`, or to be the GM. Approving and closing require `gm`. `manager` is not consulted.

Expired access JWT with a live refresh cookie: `POST /auth/refresh` rotates both cookies and redirects back. A disabled account fails refresh and login.

## Out of scope for this login

Hero sheets, hex geometry, period math, and report bodies sit on top of this session. They are not claims in the token. The character generator's catalog filter stays on `play_campaign_options` for the Bolso campaign. Login answers who the person is. The expedition answers what they are doing this session.
