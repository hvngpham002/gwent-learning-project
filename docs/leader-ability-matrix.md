# Leader Ability Matrix

This document is the durable cCp18 audit output, refreshed by cCp19 and
cCp20. It enumerates every official leader source record, classifies the
placeholder leaders by implementation pattern, lists local-source conflicts,
and records engine, legal-move, prompt / UI, hidden-info, AI, and simulation
implications. cCp19+ implementation specs should pull from this matrix
rather than re-running the audit.

The matrix is mostly documentation; cCp19 implemented Tranche 1 (row-wide
horn-like passives) and cCp20 implemented `double_spies` as a full-game
passive (Tranche 2 first leader). This file is updated to reflect both
landings.

## Status

- Catalog leader source count: **22** (5 Northern Realms / 5 Nilfgaard /
  5 Monsters / 5 Scoia'tael / 2 Skellige).
- Leader ability IDs registered in `src/game/catalog/constants.ts`: **21**.
  All 21 are reachable through one of the 22 catalog leader records.
  `double_close` is the only leader ability ID shared by more than one leader
  record (Eredin: Commander of the Red Riders and Francesca: Queen of Dol
  Blathanna). `clear_weather` is both a card and leader ability ID, but only
  Foltest: Lord Commander of The North uses it as a leader.
- Implemented executable leaders: **7** (each emits a legal `use_leader`
  move): `clear_weather`, `play_frost`, `play_fog`, `play_rain`,
  `play_any_weather`, `scorch_range`, `scorch_siege`.
- Implemented passive leaders: **6** after cCp20 — `weather_half_penalty`
  on King Bran (cCp15), the four cCp19 row-wide horn-like passives
  (`double_siege` on Foltest: The Siegemaster, `double_close` on Eredin:
  Commander of the Red Riders and Francesca: Queen of Dol Blathanna, and
  `double_ranged` on Francesca: The Beautiful), and `double_spies` on
  Eredin Breacc Glas: The Treacherous (cCp20).
- Placeholder leader records: **9** spanning **9** distinct ability IDs
  after cCp20. (cCp20 promoted 1 leader record and 1 ability ID out of
  placeholder.)
- `OfficialLeaderPromotionManifest.placeholderLeaderAbilityIds` remains
  **exhaustive** after cCp20 — it lists every leader ability whose
  `CATALOG_LEADER_ABILITY_METADATA.status` is still `placeholder`:
  `cancel_leader`, `discard_two_draw_one_from_deck`, `draw_extra_card`,
  `draw_opponent_discard`, `look_three_cards`, `optimize_agile_rows`,
  `random_medic`, `restore_discard_to_hand`,
  `shuffle_discards_into_decks`. (See Source Conflicts §C-7 for the cCp18
  audit finding that prompted this fix.)

## Implemented Baseline

Treat these as comparators only; cCp18 does not change their behavior.

### Active executable leaders (emit a legal `use_leader` move)

| Source ID | Name | Faction | Ability | Target shape | Notes |
|---|---|---|---|---|---|
| `northern-realms.foltest-lord-commander-of-the-north` | Foltest: Lord Commander of The North | Northern Realms | `clear_weather` | `none` | cCp7 baseline. Always emits a legal move while the leader is unused. |
| `northern-realms.foltest-king-of-temeria` | Foltest: King of Temeria | Northern Realms | `play_fog` | `deck_card_source` | cCp14. Pulls a Fog from the acting deck only. |
| `nilfgaard.emhyr-var-emreis-his-imperial-majesty` | Emhyr var Emreis: His Imperial Majesty | Nilfgaard | `play_rain` | `deck_card_source` | cCp14. Pulls a Rain from the acting deck only. |
| `monsters.eredin-king-of-the-wild-hunt` | Eredin: King of the Wild Hunt | Monsters | `play_any_weather` | `deck_card_source` | cCp14. Multiple legal moves possible (Frost / Fog / Rain / Skellige Storm); Clear Weather not eligible. |
| `scoiatael.francesca-findabair-pureblood-elf` | Francesca Findabair: Pureblood Elf | Scoia'tael | `play_frost` | `deck_card_source` | cCp14. Pulls a Frost from the acting deck only. |
| `northern-realms.foltest-son-of-medell` | Foltest: Son of Medell | Northern Realms | `scorch_range` | `none` | cCp16. Emits a legal move only when destruction is possible (row total ≥ 10 and at least one tied highest non-hero target). |
| `northern-realms.foltest-the-steel-forged` | Foltest: The Steel-Forged | Northern Realms | `scorch_siege` | `none` | cCp16. Same shape as Son of Medell but on the siege row. |

### Implemented passive leaders (no `use_leader` move)

| Source ID | Name | Faction | Ability | Effect surface | Notes |
|---|---|---|---|---|---|
| `skellige.king-bran` | King Bran | Skellige | `weather_half_penalty` | scoring pipeline | cCp15. Derived from leader identity through `getWeatherPolicyBySeat`; never sets `seat.leaderUsed` and never emits `leader_used`. |
| `northern-realms.foltest-the-siegemaster` | Foltest: The Siegemaster | Northern Realms | `double_siege` | scoring pipeline | cCp19. Derived from leader identity through `getRowHornPolicyBySeat`; doubles non-hero units on the friendly siege row at the horn stage; suppressed by any Commander's Horn on that row; never sets `seat.leaderUsed` and never emits `leader_used`. |
| `monsters.eredin-commander-of-the-red-riders` | Eredin: Commander of the Red Riders | Monsters | `double_close` | scoring pipeline | cCp19. Same shape as `double_siege` but on the friendly close row. |
| `scoiatael.francesca-findabair-queen-of-dol-blathanna` | Francesca Findabair: Queen of Dol Blathanna | Scoia'tael | `double_close` | scoring pipeline | cCp19. Shares the `double_close` policy with Eredin: Commander of the Red Riders. Selection is by leader identity, not faction. |
| `scoiatael.francesca-findabair-the-beautiful` | Francesca Findabair: The Beautiful | Scoia'tael | `double_ranged` | scoring pipeline | cCp19. Same shape as `double_siege` but on the friendly ranged row. |
| `monsters.eredin-breacc-glas-the-treacherous` | Eredin Breacc Glas: The Treacherous | Monsters | `double_spies` | scoring pipeline | cCp20. Derived from leader identity through `getDoubleSpiesPolicyBySeat`; whole-match passive that applies a ×2 multiplier to every battlefield non-hero Spy unit, on both board sides and all rows, regardless of owner or controller. Heroes remain immune. The multiplier does not stack ×4 if both seats somehow have the policy. The score breakdown's `modifiers` list carries `"leader_double_spies"` when the multiplier applies. Never sets `seat.leaderUsed` and never emits `leader_used`. |

## Placeholder Leader Matrix

After cCp19, ten leader source records remain unimplemented. Four leader
records (Foltest: The Siegemaster, Eredin: Commander of the Red Riders,
Francesca Findabair: Queen of Dol Blathanna, Francesca Findabair: The
Beautiful) were promoted to `implemented` passive in cCp19; they are kept in
the matrix below for cross-reference but their `Ability metadata status`
fields read `implemented` rather than `placeholder`. Catalog descriptions
come from `src/data/catalog/leaders/*.ts`. "Local rule / source text" is the
single-line summary cross-referencing `docs/gwent-rules.md`,
`audit/scrapes/2026-04-29-game8-gwent-cards.json`, and
`audit/scrapes/2026-04-30-witcher-fandom/`.

Marker conventions:

- *Derived* — the behavior is inferred from a card-text snippet rather than
  a normative rules paragraph.
- *Conflict §C-#* — see Source Conflicts.

### Foltest: The Siegemaster — `double_siege`

| Field | Value |
|---|---|
| Source ID | `northern-realms.foltest-the-siegemaster` |
| Faction | Northern Realms |
| Ability metadata status | `implemented` (cCp19) |
| Catalog description | "Doubles the strength of all your Siege units (unless a Commander's Horn is also present on that row)." |
| Local rule / source text | Persistent passive Commander's-Horn-equivalent on the friendly Siege row, suppressed if a Commander's Horn is already on that row. |
| Likely official behavior | *Derived*: while Foltest: The Siegemaster is the seat's leader, the seat's siege row receives a Commander's-Horn-equivalent ×2 to non-hero unit strength, but only when no Commander's Horn (`commanders_horn` special or unit horn) is present on that row. Hero units are unaffected (Hero immunity). |
| Active vs passive vs setup | Passive ongoing row modifier. |
| Expected legal move shape | None (no `use_leader` move). |
| Expected command transaction shape | None (passive scoring derivation, mirroring King Bran). |
| Prompt / choice UI need | None. |
| Hidden-info risk | None. |
| Implementation difficulty | low |
| Recommended tranche | Tranche 1 (Low ambiguity / passive horn-like). |
| Unresolved questions | Whether Foltest: The Siegemaster suppresses its ×2 when a Commander's Horn is *also* the leader effect (no current source). Whether the suppression rule reads "any Commander's Horn on the row" (special card or unit horn) — assume yes per card text and §17.6 stacking guidance. |

### Eredin: Commander of the Red Riders — `double_close`

| Field | Value |
|---|---|
| Source ID | `monsters.eredin-commander-of-the-red-riders` |
| Faction | Monsters |
| Ability metadata status | `implemented` (cCp19) |
| Catalog description | "Doubles the strength of all your Close Combat units (unless a Commander's Horn is also present on that row)." |
| Local rule / source text | Same shape as `double_siege` but on the friendly close row. |
| Likely official behavior | *Derived*: passive ongoing Horn-equivalent on the friendly close row, suppressed by an existing Commander's Horn on that row, hero-immune. |
| Active vs passive vs setup | Passive ongoing row modifier. |
| Expected legal move shape | None. |
| Expected command transaction shape | None (passive). |
| Prompt / choice UI need | None. |
| Hidden-info risk | None. |
| Implementation difficulty | low |
| Recommended tranche | Tranche 1. |
| Unresolved questions | Same as `double_siege`. |

### Francesca Findabair: Queen of Dol Blathanna — `double_close`

| Field | Value |
|---|---|
| Source ID | `scoiatael.francesca-findabair-queen-of-dol-blathanna` |
| Faction | Scoia'tael |
| Ability metadata status | `implemented` (cCp19) |
| Catalog description | "Doubles the strength of all your Close Combat units (unless a Commander's Horn is also present on that row)." |
| Local rule / source text | Same as Eredin: Commander of the Red Riders. Two leaders share `double_close`. |
| Likely official behavior | Same as Eredin: Commander. |
| Active vs passive vs setup | Passive ongoing row modifier. |
| Expected legal move shape | None. |
| Expected command transaction shape | None (passive). |
| Prompt / choice UI need | None. |
| Hidden-info risk | None. |
| Implementation difficulty | low |
| Recommended tranche | Tranche 1. |
| Unresolved questions | Whether Scoia'tael's first-player rule (§17.15) interacts with the leader's passive timing. Expected answer: no, the passive runs every scoring pass regardless of turn order. |

### Francesca Findabair: The Beautiful — `double_ranged`

| Field | Value |
|---|---|
| Source ID | `scoiatael.francesca-findabair-the-beautiful` |
| Faction | Scoia'tael |
| Ability metadata status | `implemented` (cCp19) |
| Catalog description | "Doubles the strength of all your Ranged Combat units (unless a Commander's Horn is also present on that row)." |
| Local rule / source text | Same as `double_siege`/`double_close` but on the friendly ranged row. |
| Likely official behavior | *Derived*: passive ongoing Horn-equivalent on the friendly ranged row, suppressed by an existing Commander's Horn on that row, hero-immune. |
| Active vs passive vs setup | Passive ongoing row modifier. |
| Expected legal move shape | None. |
| Expected command transaction shape | None (passive). |
| Prompt / choice UI need | None. |
| Hidden-info risk | None. |
| Implementation difficulty | low |
| Recommended tranche | Tranche 1. |
| Unresolved questions | None beyond the shared `double_*` row-horn questions. |

### Eredin: Destroyer of Worlds — `discard_two_draw_one_from_deck`

| Field | Value |
|---|---|
| Source ID | `monsters.eredin-destroyer-of-worlds` |
| Faction | Monsters |
| Ability metadata status | `placeholder` |
| Catalog description | "Discard 2 cards, then draw 1 card from your deck." |
| Local rule / source text | Catalog text + `docs/gwent-rules.md` §16 conflict — see Source Conflicts §C-1. |
| Likely official behavior | *Derived*: active leader; player chooses 2 cards to discard from hand, then draws 1 card from the top of (or by choice from) deck. The catalog wording does not specify whether the draw is random or chosen. The Game8 staging label `discard_two_draw_one_from_deck` matches "discard cost, deck draw" semantics. The cCp18 product decision needed: chosen-discard plus blind-top-draw vs chosen-discard plus chosen-draw. |
| Active vs passive vs setup | Active one-shot. |
| Expected legal move shape | One `use_leader` move per legal target combination — needs a new prompt-based flow. Likely encoded as a `use_leader` command that opens a `pendingPrompt` of kind `choose_card` with two-step selection (choose 2 to discard, then optionally choose 1 to draw). Engine simpler shape: emit a single `use_leader` with `target.kind === "none"` that immediately opens a multi-step prompt. |
| Expected command transaction shape | `UseLeader` → opens prompt → multi-step `ChoosePromptOption`. Final state: 2 hand cards discarded; 1 deck card revealed and moved to hand; `leaderUsed` set after both prompt steps resolve. |
| Prompt / choice UI need | New product prompt: choose 2 hand cards to discard, then optionally choose deck draw. cEp8 leader-choice menu is insufficient. |
| Hidden-info risk | Medium. Discard step is from acting hand (already visible to that player), but the deck draw exposes deck card identity; if AI uses a blind top-draw, deck ordering reveals to acting seat only. Opponent must not see acting seat's hand pre-discard or deck order post-search. |
| Implementation difficulty | medium-high |
| Recommended tranche | Tranche 2 (prompt-heavy hand+deck). |
| Unresolved questions | (1) Is the deck draw chosen or blind? (2) Are the two discards required (illegal if hand has < 2)? (3) Does the leader still consume if no card was drawable (empty deck)? (4) Does the discard count for Skellige round-three return triggers? Per §17.18 the round-three return picks one card from discard; pre-discard via leader feeds that pool. |

### Eredin: Bringer of Death — `restore_discard_to_hand`

| Field | Value |
|---|---|
| Source ID | `monsters.eredin-bringer-of-death` |
| Faction | Monsters |
| Ability metadata status | `placeholder` |
| Catalog description | "Restore a card from your discard pile to your hand." |
| Local rule / source text | Catalog text + `docs/gwent-rules.md` §16 conflict — see Source Conflicts §C-1. |
| Likely official behavior | *Derived*: active leader; player chooses one card from their own discard pile and returns it to hand. Per §17.1 / §16 rulebook FAQ, heroes are eligible (no hero exclusion in the leader text — Golden Rule). |
| Active vs passive vs setup | Active one-shot. |
| Expected legal move shape | `use_leader` plus a discard-card target. Either: (a) emit one `use_leader` move per discard candidate with `target.kind === "discard_card"` (new shape), or (b) emit a single `use_leader` that opens a `choose_card` prompt over discard candidates. Path (b) reuses existing prompt machinery and is recommended. |
| Expected command transaction shape | `UseLeader` opens `choose_card` prompt over the acting seat's discard pile; `ChoosePromptOption` moves the chosen card from discard to hand and consumes the leader. |
| Prompt / choice UI need | New product prompt: discard-pile card selection. The cEp3 discard browser already renders discard piles; reuse those visuals. |
| Hidden-info risk | Low. Acting seat's own discard is already public per §13 / §17.5 ("discard piles are face-up"). |
| Implementation difficulty | medium |
| Recommended tranche | Tranche 2. |
| Unresolved questions | (1) Heroes eligible? Spec answer: yes per §17.1 — the leader text says "a card from your discard pile" without exclusion. (2) Does it grab Special / weather cards as well as units? Spec answer: yes, the catalog text says "card", not "unit", aligning with the Eredin: Destroyer of Worlds FAQ entry in §16. (3) If the discard is empty, does the leader produce no legal move? Recommended: yes, emit no `use_leader` move so the once-per-game leader cannot no-op. |

### Emhyr var Emreis: The Relentless — `draw_opponent_discard`

| Field | Value |
|---|---|
| Source ID | `nilfgaard.emhyr-var-emreis-the-relentless` |
| Faction | Nilfgaard |
| Ability metadata status | `placeholder` |
| Catalog description | "Draw a card from your opponent's discard pile." |
| Local rule / source text | Catalog text + `docs/gwent-rules.md` §16 / §17.1 conflict — see Source Conflicts §C-2. |
| Likely official behavior | This is the source of conflict §C-2: the catalog calls this leader an "opponent-discard restore", while §16/§17.1 describes Emhyr var Emreis: The Relentless as a deck tutor ("Draw a Unit Card or Special Card of the player's choice **from their deck**, then shuffle"). One of the two needs a product decision (catalog vs rulebook). |
| Active vs passive vs setup | Active one-shot. |
| Expected legal move shape | If the catalog interpretation wins: `use_leader` opens a prompt over opponent discard. If the rulebook interpretation wins: `use_leader` opens a prompt over acting deck (a tutor). Either way, opens a `choose_card` prompt. |
| Expected command transaction shape | `UseLeader` → `ChoosePromptOption` → card moved from chosen zone to acting hand (or discard, depending on rule decision); leader consumed. |
| Prompt / choice UI need | New product prompt: opponent-discard browser (already rendered by cEp3 — visible to all players) OR own-deck browser (NEW; deck contents are hidden info, only the acting seat sees them in the UI). |
| Hidden-info risk | (Catalog interpretation) low — opponent discard is already public. (Rulebook interpretation) HIGH — deck contents are hidden; the acting seat would see all 20+ deck identities, which is a brand-new hidden-info surface. AI safe-mode would need observation redaction. |
| Implementation difficulty | medium under catalog interpretation; high under rulebook interpretation. |
| Recommended tranche | Defer until conflict §C-2 is resolved by product. Place in Tranche 2 if catalog interpretation is chosen, or Tranche 3 if rulebook interpretation is chosen (because of hidden-info impact). |
| Unresolved questions | See conflict §C-2. The text in `docs/gwent-rules.md` §16 attributes the deck-tutor effect to "Emhyr var Emreis, The Relentless" — but the catalog ability ID `draw_opponent_discard` says otherwise. The cCp18 audit flags this for product owner. |

### Emhyr var Emreis: Emperor of Nilfgaard — `look_three_cards`

| Field | Value |
|---|---|
| Source ID | `nilfgaard.emhyr-var-emreis-emperor-of-nilfgaard` |
| Faction | Nilfgaard |
| Ability metadata status | `placeholder` |
| Catalog description | (none — leader has no `description` field; catalog ability description is "Looks at random cards in the opponent hand.") |
| Local rule / source text | The Emperor's classic Witcher 3 leader text reads "Look at 3 random cards from your opponent's hand." This is opponent-hand information disclosure, not card movement. |
| Likely official behavior | *Derived*: active leader; reveals 3 random opponent hand cards to the acting player only. The opponent hand is otherwise hidden from both seats; this leader temporarily lifts that veil for the acting seat for some bounded duration (typically the rest of the game in Witcher 3 / Gwent rules). |
| Active vs passive vs setup | Active one-shot, but with a persistent observation effect on `MatchState`. |
| Expected legal move shape | `use_leader` with `target.kind === "none"`. Engine selects 3 random opponent hand instances using the seeded RNG and stores them on the acting seat's observation manifest (a new state field). |
| Expected command transaction shape | `UseLeader` → mark leader used → record three opponent card instance IDs into a new `seat.revealedOpponentHand` (or similar) tracker. New `card_revealed` event for each disclosed card. |
| Prompt / choice UI need | None at choice time (no decision). UI must surface the revealed cards inside the acting seat's view of the opponent hand from then on. |
| Hidden-info risk | HIGH. This leader is the engine's first explicit hidden-info disclosure. The simulation export contract must continue to redact the same identities for the *opponent* observer. The AI policy `legal-heuristic-v0` only sees its own hand; the new disclosure must extend its observation only when it is the acting seat. |
| Implementation difficulty | high |
| Recommended tranche | Tranche 4 (Hidden-info / suppression). |
| Unresolved questions | (1) Is the disclosure permanent for the rest of the match, or only for the current round? (2) Does redrawing during the ongoing round (e.g. Foltest: King of Temeria pulling from deck via `play_fog`, no — that doesn't draw to hand; but Skellige round-three return *does* move cards into discard, not hand) affect the disclosure list? (3) Does mulligan invalidate the disclosure? Recommendation: leader is once-per-game and used after mulligan, so this is moot; if used at game start, simply pick from the current hand snapshot. (4) Are heroes eligible? Yes — the leader picks "cards" from hand without exclusion. |

### Emhyr var Emreis: The White Flame — `cancel_leader`

| Field | Value |
|---|---|
| Source ID | `nilfgaard.emhyr-var-emreis-the-white-flame` |
| Faction | Nilfgaard |
| Ability metadata status | `placeholder` |
| Catalog description | (none on the leader source; catalog ability description is "Cancels the opponent leader ability.") |
| Local rule / source text | The classic Witcher 3 / Gwent text reads "Cancel your opponent's Leader ability." If the opponent is using a passive (e.g. King Bran, `weather_half_penalty`), it disables the passive. If the opponent's leader is active, it locks them out of using it. |
| Likely official behavior | *Derived*: active leader; flips a per-seat "leader-cancelled" flag on the opponent. The opponent's leader produces no legal `use_leader` move from then on; passive effects (e.g. `weather_half_penalty`, the future `double_*` row horns) stop applying. |
| Active vs passive vs setup | Active one-shot. |
| Expected legal move shape | `use_leader` with `target.kind === "none"`. |
| Expected command transaction shape | `UseLeader` → set opponent's `seat.leaderCancelled = true` (new `MatchSeat` field) → emit a new `leader_cancelled` event → consume acting leader. Subsequent `getLeaderMove` returns `[]` for the cancelled seat regardless of ability. Passive scoring derivations check `seat.leaderCancelled` before applying. |
| Prompt / choice UI need | None at choice time. UI must indicate cancelled state on the opponent score-card leader. |
| Hidden-info risk | None directly, but it touches every other leader implementation: every passive leader effect must check the flag. |
| Implementation difficulty | high (cross-cutting). Implementation must come *after* every other passive leader is implemented, otherwise we cannot test the cancel. |
| Recommended tranche | Tranche 4 (Hidden-info / suppression). |
| Unresolved questions | (1) If the opponent has already used their active leader before being cancelled, is the cancel a no-op? (2) If the opponent is King Bran, does retroactive un-application of `weather_half_penalty` apply mid-round, or only on the next scoring tick? Recommendation: scoring is a pure function of state; the next tick already reads `seat.leaderCancelled`. (3) Does cancelling a leader before its active ability has fired still consume the cancel acting leader? Yes — active leaders are once-per-game regardless of whether the target had ability charge left. |

### Emhyr var Emreis: Invader of the North — `random_medic`

| Field | Value |
|---|---|
| Source ID | `nilfgaard.emhyr-var-emreis-invader-of-the-north` |
| Faction | Nilfgaard |
| Ability metadata status | `placeholder` |
| Catalog description | (none on the leader source; catalog ability description is "Plays a random medic effect.") |
| Local rule / source text | Classic Witcher 3 text: "Pick a random Special Card from your discard pile and play it instantly." This is a discard-pile *Special-card* random replay, not a Medic chain. The catalog ID `random_medic` is misleading. |
| Likely official behavior | *Derived*: active leader; engine selects one random Special card from the acting seat's discard using the seeded RNG, plays it as if cast (resolving its abilities), and consumes the leader. The Witcher 3 wording "Special Card" — not "Medic" — means this is a Special-card replay, not a Medic Unit revival. The catalog ID is a misnomer. |
| Active vs passive vs setup | Active one-shot. |
| Expected legal move shape | `use_leader` with `target.kind === "none"`, but only when the acting seat's discard has at least one Special card. |
| Expected command transaction shape | `UseLeader` → seeded random pick over `seat.discard` filtered to Special-kind sources → execute the same play path as a normal special card (with engine ability resolution) → emit `card_played` and `leader_used`. |
| Prompt / choice UI need | None at choice (random). Discard browser already renders discard cards. |
| Hidden-info risk | Low — own discard is public. AI safe-mode unaffected. |
| Implementation difficulty | medium. The replay must reuse the existing Special-card play path including Scorch resolution, weather placement, etc. |
| Recommended tranche | Tranche 2. |
| Unresolved questions | (1) Catalog ability ID `random_medic` is a documentation conflict — see §C-3. The implementation will not be a Medic clone. (2) If the discard has no Special cards, the leader emits no legal move. (3) Does the random pick have to skip Decoy because a Decoy needs a target? Yes — engine should filter Specials to those whose play is *legal at that moment* (no targets needed, or auto-selectable target). Or: just exclude Decoy entirely as a documentation rule. Product decision needed. |

### Eredin Breacc Glas: The Treacherous — `double_spies`

| Field | Value |
|---|---|
| Source ID | `monsters.eredin-breacc-glas-the-treacherous` |
| Faction | Monsters |
| Ability metadata status | `implemented` (cCp20) |
| Catalog description | "Doubles the strength of all spy cards already on the battlefield." |
| Local rule / source text | The official Gwent text is "Doubles the Strength of all Spies on the battlefield." Monster faction with no Spy cards in mono-Monster decks; the leader is mostly used in mixed-faction (post-deck-builder) contexts. |
| Implemented behavior (cCp20) | **Whole-match passive**, derived from leader source identity by `getDoubleSpiesPolicyBySeat`. While the leader is the seat's leader, every battlefield non-hero card whose source includes the `spy` ability receives a ×2 multiplier on every scoring tick — on both board sides, all rows, regardless of owner or controller. Heroes remain immune (Hero immunity, §17.1). Spies played after the policy applies are doubled on the next scoring pass. The multiplier does not stack ×4 if both seats somehow have the same policy. The score breakdown's `modifiers` list carries the marker `"leader_double_spies"` when the multiplier applies, and `CardScoreEntry.spyMultiplier` / `CardScoreEntry.afterSpyMultiplier` record the explicit factor. |
| Active vs passive vs setup | **Passive ongoing modifier** (post-cCp18 product decision: passive for the entire game). |
| Expected legal move shape | None (no `use_leader` move). |
| Expected command transaction shape | None (passive scoring derivation, mirroring King Bran and the cCp19 row-horn passives). |
| Prompt / choice UI need | None. |
| Hidden-info risk | None. |
| Implementation difficulty | low — re-uses the cCp15 / cCp19 passive helper pattern. |
| Recommended tranche | Tranche 2 (implemented in cCp20). |
| Settled questions | (1) The doubling applies to **all battlefield Spies, including future ones** (settled product decision §9 — passive for the entire game). The earlier "snapshot at fire time" wording is superseded. (2) The multiplier composes through the standard scoring pipeline: Weather → Double Spies → Tight Bond → Morale Boost → Horn (per §15 and §17.12e). (3) Hero Spies are **not** affected (Hero immunity, §17.1). |

### Francesca Findabair: Hope of the Aen Seidhe — `optimize_agile_rows`

| Field | Value |
|---|---|
| Source ID | `scoiatael.francesca-findabair-hope-of-the-aen-seidhe` |
| Faction | Scoia'tael |
| Ability metadata status | `placeholder` |
| Catalog description | "Move all your Agile units to the row that yields the most strength." |
| Local rule / source text | Classic Witcher 3 leader text: "Move all your Agile Units to the row of your choice." (Scoia'tael Witcher 3 wording.) The catalog says "to the row that yields the most strength" — that auto-selection is a modern Gwent simplification, not the rulebook text. See conflict §C-4. |
| Likely official behavior | *Derived* per the rulebook + official Gwent online wording: active leader, player picks a target row, every friendly Agile unit on the seat's board moves to that row. The catalog's "yields most strength" is an automation; the canonical text is "row of your choice". |
| Active vs passive vs setup | Active one-shot. |
| Expected legal move shape | If "row of your choice": one `use_leader` move per row that contains at least one current Agile unit (or per row period). Target shape `target.kind === "board_row"` with `seatId === actingSeatId`. If "auto-optimal": single `use_leader` with `target.kind === "none"`, engine computes optimal row server-side. |
| Expected command transaction shape | `UseLeader` → for each Agile unit on seat board, move it to chosen row → emit `card_moved` events with reason `"leader_optimize_agile"` (new) → consume leader. |
| Prompt / choice UI need | If "row of your choice": cEp8 leader-choice menu pattern works (3 rows ≤ 3 options). If "auto-optimal": no prompt. |
| Hidden-info risk | None. |
| Implementation difficulty | medium. Agile is already implemented for placement; the leader's bulk-move semantics need a new code path. |
| Recommended tranche | Tranche 2 (prompt-light; row-choice selection). |
| Unresolved questions | See §C-4 — product decision: row-choice (canonical) vs auto-optimal (catalog). Recommendation: implement row-choice, update catalog description to match, and surface the choice through cEp8's leader-choice menu. |

### Francesca Findabair: Daisy of the Valley — `draw_extra_card`

| Field | Value |
|---|---|
| Source ID | `scoiatael.francesca-findabair-daisy-of-the-valley` |
| Faction | Scoia'tael |
| Ability metadata status | `placeholder` |
| Catalog description | "Draw 1 extra card at the start of the battle." |
| Local rule / source text | Classic Witcher 3 / Gwent text: "Draw 1 extra card at the beginning of the battle." Setup-time event, fires before the mulligan or during initial draw. |
| Likely official behavior | *Derived*: setup-time effect that increases the seat's initial hand size from 10 to 11 *before* the mulligan window opens. Does not produce a legal `use_leader` move; never sets `leaderUsed`. |
| Active vs passive vs setup | Setup-time event. |
| Expected legal move shape | None. |
| Expected command transaction shape | None at runtime. The effect is wired into `setup.ts` initial-draw computation; the seat draws 11 cards instead of 10. |
| Prompt / choice UI need | None. |
| Hidden-info risk | None. |
| Implementation difficulty | low. Just a setup-time hand-size adjustment. |
| Recommended tranche | Tranche 3 (Setup / passive). |
| Unresolved questions | (1) Does the extra card come from the deck top or a chosen card? Recommendation: deck top, deterministic with the existing seeded RNG. (2) Does the mulligan budget grow accordingly (3 redraws instead of 2)? No — the rulebook gives 2 redraws regardless of hand size. (3) Interaction with Crach an Craite (`shuffle_discards_into_decks`) — not relevant; that's a separate active leader. |

### King Bran (already implemented, listed above)

— omitted from the placeholder matrix.

### Crach an Craite — `shuffle_discards_into_decks`

| Field | Value |
|---|---|
| Source ID | `skellige.crach-an-craite` |
| Faction | Skellige |
| Ability metadata status | `placeholder` |
| Catalog description | "Shuffles both discard piles back into their respective decks." |
| Local rule / source text | Gwent classic text: "Shuffle both Discard piles into their respective decks." Active leader, fires once per game and recycles both seats' discards back into their decks. |
| Likely official behavior | *Derived*: active leader; both seats' discard piles become empty, and their cards are appended to their respective decks, then each deck is shuffled with the seeded RNG. |
| Active vs passive vs setup | Active one-shot. |
| Expected legal move shape | `use_leader` with `target.kind === "none"`. Engine emits the move while leader is unused (regardless of whether a discard pile is empty — even single-pile recycling is useful). |
| Expected command transaction shape | `UseLeader` → for each seat: pop every card in `seat.discard` → push into `seat.deck` → shuffle `seat.deck` using a derived sub-seed of `state.rng` → emit per-card `card_moved` events with reason `"leader_shuffle_into_deck"` (new) and a `deck_shuffled` event per seat (new). Consume leader. |
| Prompt / choice UI need | None. |
| Hidden-info risk | Low. The contents of both discard piles are already public; once shuffled into the deck, they become hidden again, but the *count* in each deck is public and no individual card identity is exposed beyond what was already public. |
| Implementation difficulty | medium. Engine has not previously needed to mutate decks at runtime, so this is the first runtime deck shuffle (the Game8 staging draw / weather-pull leaders only *remove* from deck, never refill it). The seeded RNG must produce a deterministic shuffle. |
| Recommended tranche | Tranche 2. |
| Unresolved questions | (1) If both discard piles are empty, is the leader still legal (no-op)? Recommendation: emit no `use_leader` move — once-per-game leaders should not no-op (matches `play_*` weather and `scorch_*` row policies). (2) Does the Skellige round-three return §17.18 still trigger after Crach has shuffled discards back into the deck? Yes — round-three return triggers on round-end discard, post-shuffle discards re-fill normally. (3) Does Crach affect "removed from game" cards (e.g. transformed Berserkers)? No — only `seat.discard`, not `seat.removedFromGame`. |

## Shared Implementation Patterns

The fourteen placeholder leader records group into nine implementation
patterns. Each group shares command and legal-move shape, prompt needs,
hidden-info risk, AI implications, and simulation export implications.

### Pattern 1 — Row-wide Horn-Like Passives

| Members | Ability IDs |
|---|---|
| Foltest: The Siegemaster, Eredin: Commander of the Red Riders, Francesca: Queen of Dol Blathanna, Francesca: The Beautiful | `double_siege`, `double_close` (×2), `double_ranged` |

- Trigger: passive, derived from leader identity through scoring (mirror of
  King Bran's `getWeatherPolicyBySeat`).
- Effect: ×2 effective strength to non-hero units on the friendly mapped
  row, suppressed by `commanders_horn` on that row.
- Engine surfaces:
  - new shared helper `getRowHornPolicyBySeat(state, leaders) → Map<seatId,
    {row?: CatalogRow; suppressIfHorn: true}>` analogous to the King Bran
    helper.
  - `calculateScores` reads the policy and applies ×2 multipliers per row,
    after weather and Hero immunity, before Tight Bond / Morale Boost (per
    §15 — Horn comes after weather but before final summation, modeled
    through the existing Horn pipeline).
  - the existing `commanders_horn` row check must compose with the leader
    horn policy: if a Commander's Horn is already on the row, the leader
    horn does not stack (per card text "unless a Commander's Horn is also
    present on that row").
- Legal-move shape: none.
- Command shape: none (passive).
- Prompt / UI: cEp8 menu unchanged. Score breakdown labels add
  `leader:double_close`, `leader:double_ranged`, `leader:double_siege` so
  the inspector can show provenance.
- Hidden-info risk: none.
- AI: `legal-heuristic-v0` already evaluates total row strength; the leader
  passive automatically improves the heuristic without code change. No
  policy update needed.
- Simulation export: passive; observation shape is unchanged. No new export
  fields required.
- Effect classification: ongoing row modifier.

### Pattern 2 — Whole-Match Spy Score Passive (IMPLEMENTED in cCp20)

| Members | Ability IDs |
|---|---|
| Eredin Breacc Glas: The Treacherous | `double_spies` |

**Status:** Implemented in cCp20 (see
`audit/reports/2026-05-02-cCp20-report.md`). The earlier "snapshot at fire
time" wording in this matrix has been corrected per the settled product
decision §9 — `double_spies` is passive for the entire game.

- Trigger: passive, derived from leader identity through scoring (mirror of
  King Bran's `getWeatherPolicyBySeat` and the cCp19 row-horn helper).
- Effect: ×2 effective strength to every battlefield non-hero Spy unit
  (`abilities` includes `spy`) on either board side, regardless of owner /
  controller, for the entire match. Hero Spies are excluded under §17.1.
  Future Spies are picked up on the next scoring pass automatically.
- Engine surfaces:
  - new shared helper
    `getDoubleSpiesPolicyBySeat(state, leaders) → Partial<Record<SeatId, true>>`
    analogous to `getWeatherPolicyBySeat` and `getRowHornPolicyBySeat`.
  - `calculateScores` reads the policy and applies a ×2 multiplier to every
    non-hero Spy unit when at least one seat has the policy. The multiplier
    does not stack: even if both seats somehow have `double_spies`, the
    factor stays ×2.
  - `CalculateScoresInput` exposes an optional explicit
    `doubleSpiesPolicyBySeat` override for focused tests.
  - `CardScoreEntry` records `spyMultiplier` and `afterSpyMultiplier` for
    transparency. Modifier order in `CardScoreEntry.modifiers` lists
    `"leader_double_spies"` when the multiplier applies.
- Legal-move shape: none (passive — mirrors King Bran and cCp19 row-horn).
- Command shape: none (passive). Manual `UseLeader` attempts raise the
  existing `unsupported_command` rule error without consuming the leader.
- Prompt / UI: none. Score breakdown carries `"leader_double_spies"` so
  inspectors can show provenance.
- Hidden-info risk: none. Spies sit on the public battlefield.
- AI: `legal-heuristic-v0` already evaluates effective row strength; the
  passive automatically improves the heuristic's evaluation of a Spy
  without code change. No policy update needed.
- Simulation export: passive; observation shape is unchanged. No new
  export fields required.
- Effect classification: ongoing whole-match scoring modifier.

### Pattern 3 — Deck Tutor / Discard Cost (multi-step prompt)

| Members | Ability IDs |
|---|---|
| Eredin: Destroyer of Worlds | `discard_two_draw_one_from_deck` |

- Trigger: active one-shot.
- Effect: discard 2 hand cards (chosen) → draw 1 deck card. Whether the
  draw is chosen or blind is a product decision.
- Engine surfaces:
  - new `pendingPrompt.kind === "leader_multi_step"` (or extend
    `choose_card` with a multi-stage payload).
  - `executeLeader` opens a `pendingPrompt` of two stages: stage 1 expects
    two `card_instance` selections from acting hand; stage 2 expects either
    no input (blind top-of-deck) or one `deck_card_source` selection.
- Legal-move shape: `use_leader` opens prompt; stages emit
  `ChoosePromptOption` legal moves.
- Command shape: `UseLeader` → opens prompt → multiple
  `ChoosePromptOption` commands → finalize.
- Prompt / UI: significant new product UI for hand multi-select and
  optional deck browse. The existing cEp3 prompt panel shows one option
  list at a time; multi-select is new.
- Hidden-info risk: medium for chosen deck draw (acting deck contents
  exposed to acting seat); none for blind top-draw. AI hand details remain
  hidden from the human under all paths.
- AI: `legal-heuristic-v0` would need to score multi-stage prompts; the
  current implementation is one-shot per legal move.
- Simulation export: new prompt-stage rows; encoding must keep stage IDs
  stable.
- Effect classification: one-shot active with prompt chain.

### Pattern 4 — Discard Restore (single-step prompt)

| Members | Ability IDs |
|---|---|
| Eredin: Bringer of Death, (Emhyr: The Relentless under catalog interpretation §C-2) | `restore_discard_to_hand`, possibly `draw_opponent_discard` |

- Trigger: active one-shot.
- Effect: choose one card from a discard pile (own or opponent), move it
  back to the acting seat's hand.
- Engine surfaces:
  - `pendingPrompt.kind === "choose_card"` over discard candidates.
  - `executeLeader` opens the prompt; `ChoosePromptOption` resolves move.
- Legal-move shape: `use_leader` opens prompt only when the relevant
  discard pile has at least one eligible card.
- Command shape: `UseLeader` → `ChoosePromptOption` → card moves discard
  → hand → consume leader.
- Prompt / UI: cEp3 already renders both discard piles publicly; reuse.
- Hidden-info risk: low (own discard public; opponent discard public).
- AI: `legal-heuristic-v0` would need an "evaluate discard candidate"
  scoring heuristic; not free, but tractable.
- Simulation export: prompt step shape already exists.
- Effect classification: one-shot active with single-step prompt.

### Pattern 5 — Opponent Hand Information Disclosure

| Members | Ability IDs |
|---|---|
| Emhyr: Emperor of Nilfgaard | `look_three_cards` |

- Trigger: active one-shot.
- Effect: reveals 3 random opponent hand cards to the acting seat.
- Engine surfaces:
  - new `seat.revealedOpponentHand: Set<CardInstanceId>` field.
  - `executeLeader` selects 3 random opponent hand instance IDs using
    `state.rng.fork("look_three_cards")` and adds them to the acting
    seat's reveal set.
  - new `card_revealed` event with the disclosed instance IDs and the
    reveal seat.
  - all hidden-info-safe observers (legal moves selector, simulation
    export, AI policy) must learn about reveal sets and lift the redaction
    only for the acting seat.
- Legal-move shape: `use_leader` with `target.kind === "none"`. Emit only
  if opponent hand has at least 1 card.
- Command shape: `UseLeader` → seeded random pick → record reveals →
  consume leader.
- Prompt / UI: none at choice time. UI must surface reveals on the
  acting seat's view of opponent hand backs (replacing back with face for
  revealed instances).
- Hidden-info risk: HIGH. This is the engine's first persistent hidden-info
  disclosure. Test coverage must verify the opponent perspective stays
  redacted.
- AI: only the *acting* seat's `legal-heuristic-v0` observation manifest
  changes. Redaction logic must remain seat-symmetric.
- Simulation export: every export observer (acting seat, opponent seat,
  global) must apply reveal sets independently. New export fields needed.
- Effect classification: one-shot active with persistent observation
  surface change.

### Pattern 6 — Leader Cancel / Suppression

| Members | Ability IDs |
|---|---|
| Emhyr: The White Flame | `cancel_leader` |

- Trigger: active one-shot.
- Effect: disables the opponent's leader (active or passive) for the rest
  of the match.
- Engine surfaces:
  - new `seat.leaderCancelled: boolean` field.
  - `getLeaderMove` returns `[]` for the cancelled seat regardless of
    ability.
  - every passive scoring derivation (`getWeatherPolicyBySeat`,
    `getRowHornPolicyBySeat` from Pattern 1, `doubleSpies` snapshot from
    Pattern 2) checks `seat.leaderCancelled` before applying.
  - new `leader_cancelled` event.
- Legal-move shape: `use_leader` with `target.kind === "none"`.
- Command shape: `UseLeader` → set `seat.leaderCancelled = true` on
  opponent → consume acting leader.
- Prompt / UI: none at choice time. Score-card leader display shows
  cancelled state.
- Hidden-info risk: none directly; cross-cuts every other leader.
- AI: heuristic must learn "opponent leader will not fire any more". Not a
  blocker — `legal-heuristic-v0` already only reasons over current legal
  moves.
- Simulation export: new state field; existing observers add it to the
  acting seat / opponent seat observation manifests as appropriate.
- Effect classification: one-shot active that flips a persistent
  suppression flag.

### Pattern 7 — Setup-Time Hand-Size Modifier

| Members | Ability IDs |
|---|---|
| Francesca: Daisy of the Valley | `draw_extra_card` |

- Trigger: setup-time event during initial draw.
- Effect: seat draws 11 cards instead of 10 before mulligan opens.
- Engine surfaces:
  - `setup.ts` initial-draw counts must consult leader identity and bump
    by 1 when the seat's leader is `draw_extra_card`.
  - mulligan budget unchanged (still 2 redraws).
- Legal-move shape: none.
- Command shape: none.
- Prompt / UI: none.
- Hidden-info risk: none.
- AI: no change.
- Simulation export: hand sizes already exposed in observations; one extra
  hand entry is invisible to the schema.
- Effect classification: setup-time event.

### Pattern 8 — Random Special Replay From Discard

| Members | Ability IDs |
|---|---|
| Emhyr: Invader of the North | `random_medic` |

- Trigger: active one-shot.
- Effect: random Special card from the acting seat's discard is played.
- Engine surfaces:
  - `executeLeader` filters `seat.discard` to Special-kind cards →
    `state.rng.fork("random_medic").pickIndex(...)` → execute the same
    play path as a normal special card cast.
- Legal-move shape: `use_leader` with `target.kind === "none"`. Emit only
  if the acting seat's discard has at least one Special.
- Command shape: `UseLeader` → seeded pick → cast as if played → consume
  leader.
- Prompt / UI: none at choice time. The replay's downstream effects
  (Scorch, weather, etc.) follow normal paths.
- Hidden-info risk: low (own discard public).
- AI: heuristic does not need to choose; the engine picks. Heuristic only
  needs to value firing the leader — which is information already on the
  table.
- Simulation export: per-special replay event. Consider whether the leader
  should be allowed to replay Decoy (target needed); recommendation: skip
  Decoy at filter step.
- Effect classification: one-shot active; downstream effects are normal
  Special-card resolution.

### Pattern 9 — Bulk Move Friendly Agile Units

| Members | Ability IDs |
|---|---|
| Francesca: Hope of the Aen Seidhe | `optimize_agile_rows` |

- Trigger: active one-shot.
- Effect: every friendly Agile unit moves to a chosen row (canonical) or
  the optimal row (catalog reading).
- Engine surfaces:
  - `executeLeader` iterates the acting seat's board, moves every unit
    whose source has `agile` to the chosen row, fires `card_moved` per
    unit with reason `"leader_optimize_agile"`.
- Legal-move shape: row-choice — one `use_leader` per legal target row;
  auto-optimal — single `use_leader` with `target.kind === "none"`.
- Command shape: `UseLeader` → bulk move → consume leader.
- Prompt / UI: row-choice fits cEp8's leader-choice menu pattern. The
  metadata fallback chain (`targetCardName → targetLabel → sourceId →
  move.label`) needs a new label for board-row targets; recommendation:
  emit `metadata.targetLabel = "<row name>"`.
- Hidden-info risk: none.
- AI: heuristic does not need to choose — auto-optimal is decidable from
  public state. If row-choice, the heuristic picks the highest-strength
  row.
- Simulation export: emits N `card_moved` rows per fire.
- Effect classification: one-shot active; instantaneous board mutation.

### Pattern 10 — Both-Discard Recycle

| Members | Ability IDs |
|---|---|
| Crach an Craite | `shuffle_discards_into_decks` |

- Trigger: active one-shot.
- Effect: empty both seats' discard piles into their respective decks and
  shuffle.
- Engine surfaces:
  - `executeLeader` for both seats: append discard to deck, then shuffle
    using a deterministic sub-seed of `state.rng`.
  - new `deck_shuffled` event per seat.
- Legal-move shape: `use_leader` with `target.kind === "none"`. Emit only
  if at least one seat's discard is non-empty (avoid pure no-op).
- Command shape: `UseLeader` → recycle both → consume leader.
- Prompt / UI: none.
- Hidden-info risk: low (discard contents already public; deck order
  hidden, but shuffle uses seeded RNG so replay is deterministic).
- AI: heuristic should value recycling Spies and big units, but
  `legal-heuristic-v0` does not currently score deck composition; that's
  policy concern, not correctness.
- Simulation export: emits per-card moves; size could be large.
- Effect classification: one-shot active with bulk state mutation.

## Source Conflicts

This table compares catalog leader descriptions, leader ability metadata,
`docs/gwent-rules.md`, and the committed scrape artifacts.

### §C-1 — Eredin: Destroyer of Worlds vs Eredin: Bringer of Death

- `docs/gwent-rules.md` §16 reads:
  > | **Eredin, Destroyer of Worlds** | Restore a Unit Card **or** Special
  > Card of the player's choice from their discard pile. |
- The catalog assigns `discard_two_draw_one_from_deck` to
  `monsters.eredin-destroyer-of-worlds` and `restore_discard_to_hand` to
  `monsters.eredin-bringer-of-death`.
- Game8 staging (`audit/scrapes/2026-04-29-game8-gwent-cards.json`) agrees
  with the catalog (Destroyer → `discard_two_draw_one_from_deck`,
  Bringer → `restore_discard_to_hand`).
- Witcher Fandom snapshot does not discriminate the leaders' subtitles
  beyond the leader page; no contradicting evidence found in the local
  scrape.
- **Classification: confirmed rules-doc bug.** §16's "Eredin, Destroyer of
  Worlds" entry is using the *Bringer of Death*'s effect text. The
  rulebook text is from a printed Gwent rulebook table that conflated the
  two leaders by subtitle.
- **Recommendation:** documentation-only correction in
  `docs/gwent-rules.md` §16 — relabel the discard-restore entry to
  "Eredin, Bringer of Death" (see also conflict §C-2 for the related
  Emhyr entry). Defer the actual rule change to cCp19. The cCp18 audit
  flags this as a deferred edit and does not modify §16 in this phase
  per the spec's "documentation-only" clause for non-matrix files
  (cCp18 may touch `docs/gwent-rules.md` "only for short cross-reference
  notes or clearly documentation-only corrections discovered by the
  matrix audit"; this single-row table fix qualifies but is left for
  cCp19 to bundle with the implementation).

### §C-2 — Emhyr var Emreis: The Relentless

- `docs/gwent-rules.md` §16 reads:
  > | **Emhyr var Emreis, The Relentless** | Draw a Unit Card or Special
  > Card of the player's choice **from their deck**, then shuffle the
  > deck. (Effectively a tutor for any card type.) |
- The catalog assigns `draw_opponent_discard` to
  `nilfgaard.emhyr-var-emreis-the-relentless` with description "Draw a
  card from your opponent's discard pile."
- Game8 staging: `draw_opponent_discard` (matches catalog).
- Witcher Fandom snapshot does not include leader effect text in the
  parsed pages.
- **Classification: local sources disagree; product decision needed.**
  The catalog vs `docs/gwent-rules.md` are inconsistent. Without a
  third authoritative source (the Witcher 3 in-game rule), the cCp18
  audit cannot pick a winner.
- **Recommendation:** ask the product owner. Two options:
  - **Option A — Catalog wins.** Implement `draw_opponent_discard` as a
    discard-restore on the *opponent*'s discard pile (Pattern 4
    variant). Update `docs/gwent-rules.md` §16 to attribute the deck-
    tutor effect to a different (perhaps unimplemented) leader, OR
    delete the §16 row.
  - **Option B — Rulebook wins.** Re-purpose the catalog ability ID and
    description to "Tutor: draw a card of your choice from your deck,
    then shuffle." This becomes a new pattern (Pattern 11) — own-deck
    tutor with hidden-info implications. Update the catalog
    description in `nilfgaard.ts` accordingly.
- The cCp18 audit recommends **Option B (rulebook wins)** because the
  rulebook is generally treated as the authority in the project, but
  this is a product decision, not a code decision.

### §C-3 — `random_medic` ID is a misnomer

- The catalog ability ID `random_medic` lives on
  `nilfgaard.emhyr-var-emreis-invader-of-the-north`, with description
  "Plays a random medic effect."
- The classic Witcher 3 / Gwent text is "Pick a random Special Card from
  your discard pile and play it instantly." This is a Special-card
  random replay, not a Medic Unit revival.
- Game8 staging: ID is `random_medic` (matches catalog).
- Witcher Fandom snapshot: no contradicting evidence.
- **Classification: confirmed catalog bug (description-level only).**
  The ability ID and human-readable description are misleading. The
  effect is "random Special replay from discard", not Medic.
- **Recommendation:** keep the ability ID `random_medic` for backward
  catalog stability, but rewrite the catalog ability description in
  `src/game/catalog/abilities.ts` to "Plays a random Special card from
  your discard pile" when cCp19 implements it. Defer the description
  change to cCp19 per spec scope.

### §C-4 — `optimize_agile_rows` text "yields most strength" vs "row of your choice"

- Catalog description on `scoiatael.francesca-findabair-hope-of-the-aen-seidhe`
  says "Move all your Agile units to the row that yields the most strength."
- Classic Witcher 3 / Gwent leader text: "Move all your Agile Units to the
  row of your choice."
- Game8 staging: ability ID `optimize_agile_rows` (matches catalog ID).
  The Game8 scrape does not include raw effect text; only the ability ID
  and image.
- Witcher Fandom snapshot: no leader-page effect text in the local scrape.
- **Classification: local sources disagree; product decision needed.**
- **Recommendation:** implement "row of your choice" as the canonical
  rulebook reading. The "yields most strength" wording is an automation
  shortcut from the catalog, not the printed leader text. Update the
  catalog description in cCp19 to match.

### §C-5 — `look_three_cards` description vs canonical text

- Catalog ability description says "Looks at random cards in the opponent
  hand."
- The canonical text says specifically 3 cards.
- Game8 staging ability ID: `look_three_cards` (encodes 3 in the ID).
- **Classification: minor catalog wording bug.** The description should
  read "Look at 3 random cards in your opponent's hand." Fix in cCp19
  along with implementation.

### §C-6 — Leader source records have inconsistent `description` fields

- Northern Realms, Monsters, Scoia'tael, and Skellige leader source
  records all carry a `description` field.
- The five Nilfgaard leader source records (`nilfgaard.ts`) have NO
  `description` field except `Emhyr var Emreis: The Relentless`.
- The `CatalogLeaderSource` type makes `description` optional, so the
  catalog validates, but UI / display metadata inspection
  (`getLeaderAbilityDisplay`) defaults to the *ability* description
  (which exists on every entry). The leader-record description is
  therefore decorative.
- **Classification: cosmetic catalog inconsistency.**
- **Recommendation:** when cCp19 implements each Nilfgaard leader, add a
  `description` field aligned with the `CATALOG_LEADER_ABILITY_METADATA`
  description so inspector views are consistent.

### §C-7 — `placeholderLeaderAbilityIds` manifest is incomplete

- `OfficialLeaderPromotionManifest.placeholderLeaderAbilityIds` lists
  only the 8 ability IDs introduced by cBp5: `double_close`,
  `discard_two_draw_one_from_deck`, `restore_discard_to_hand`,
  `double_spies`, `optimize_agile_rows`, `double_ranged`,
  `draw_extra_card`, `shuffle_discards_into_decks`.
- The 5 pre-cBp5 placeholder ability IDs (`double_siege`,
  `look_three_cards`, `cancel_leader`, `draw_opponent_discard`,
  `random_medic`) are also `placeholder` in
  `CATALOG_LEADER_ABILITY_METADATA` but are not in the manifest array.
- The official leader promotion test
  (`tests/data/officialLeaderPromotion.test.ts:167`) uses
  `expect.arrayContaining(...)` so the test passes regardless of the
  pre-cBp5 omissions.
- **Classification: confirmed manifest bug (cosmetic).** The manifest's
  array is named `placeholderLeaderAbilityIds` but contains only a subset.
- **Recommendation:** when cCp19 lands, treat the manifest as a tracking
  list and either rename the array to `cBp5IntroducedPlaceholderAbilityIds`
  or extend it to include all placeholder ability IDs. Either change is
  documentation-only and can be bundled with the cCp19 catalog edits.

### §C-8 — Game8 staging mistakenly labels `draw_opponent_discard` etc.

- Game8 staging IDs `cancel_leader`, `look_three_cards`,
  `draw_opponent_discard`, `random_medic` ship with `status:
  "catalog_id"` (meaning "the staging tool found a known catalog
  ability ID for this leader"), but the underlying behavior may not
  match the rulebook (see §C-2 / §C-3).
- **Classification: scrape provenance, not a bug.** The Game8 staging
  tool only validates that the ability ID maps to a registered catalog
  ID, not that the implementation matches the printed text.
- **Recommendation:** no action; cCp19 implementations are bound by the
  catalog + rule-decision matrix, not the staging label.

### §C-9 — `Emhyr var Emreis: Emperor of Nilfgaard` has no `description`

- See §C-6. Specifically, the Emperor leader has neither a leader-record
  `description` nor (uniquely) a clear `CATALOG_LEADER_ABILITY_METADATA`
  description that mirrors the canonical "Look at 3 random cards" text.
- The metadata description currently says "Looks at random cards in the
  opponent hand."
- **Classification: cosmetic catalog wording bug.** Same as §C-5.
- **Recommendation:** fix in cCp19 along with implementation.

### §C-10 — Witcher Fandom scrape has no leader effect text

- The Witcher Fandom scrape under
  `audit/scrapes/2026-04-30-witcher-fandom/` covers cards in detail but
  the leader pages were not parsed for effect text in
  `fandom-card-snapshot.json`.
- **Classification: scrape coverage gap, not a bug.**
- **Recommendation:** treat the catalog leader descriptions plus
  `docs/gwent-rules.md` §16 as the local authority. If §16 vs catalog
  disagree (as in §C-1 / §C-2), record the conflict and ask the product
  owner.

## Engine And UI Implications

| Pattern | Legal target shape | New `pendingPrompt` kind | cEp8 menu sufficient | New product modal | Hidden-info exposure | AI-safe under `legal-heuristic-v0` | Simulation export new fields | Effect classification |
|---|---|---|---|---|---|---|---|---|
| 1. Row-Horn Passives | none (passive) | none | n/a | none | none | yes | none (passive) | ongoing row modifier |
| 2. Double Spies (whole-match passive) | none (passive) | none | n/a | none | none | yes | none (passive) | ongoing whole-match scoring modifier |
| 3. Discard Two / Draw One | `target.kind === "none"` opens prompt | new `leader_multi_step` (or extended `choose_card`) | no | yes (multi-stage hand select) | medium (deck-draw choice) | needs multi-stage policy update | new prompt-stage rows | one-shot active w/ prompt chain |
| 4. Discard Restore | `target.kind === "none"` opens prompt | `choose_card` over discard | yes (cEp3 discard browser already exists) | minor enhancement | low (discard already public) | needs discard-evaluation heuristic | none beyond standard prompt rows | one-shot active w/ single-step prompt |
| 5. Look Three Cards | `target.kind === "none"` | none | n/a | UI overlay on opponent-hand backs | HIGH (first persistent reveal) | acting-seat only; redaction logic must be seat-aware | new reveal sets in observations | one-shot active w/ persistent observation surface |
| 6. Leader Cancel | `target.kind === "none"` | none | n/a | leader display update | none directly; cross-cuts every passive | yes | new `seat.leaderCancelled` flag | one-shot active w/ persistent suppression flag |
| 7. Setup Draw Extra | none | none | n/a | none | none | yes | none beyond standard hand size | setup-time event |
| 8. Random Special Replay | `target.kind === "none"` | none (engine selects) | yes | none | low (own discard public) | yes | per-special replay rows | one-shot active w/ replay |
| 9. Optimize Agile Rows | `board_row` per legal row OR `target.kind === "none"` | none | yes (cEp8 menu fits 1-3 rows) | minor row-label change | none | yes | per-card move rows | one-shot active w/ instantaneous board mutation |
| 10. Shuffle Discards Into Decks | `target.kind === "none"` | none | yes | none | low (deck order hidden post-shuffle, but contents previously public) | yes | per-card move + deck_shuffled event | one-shot active w/ bulk state mutation |

Notes:

- For Patterns 4 and 5, the engine must support a `discard_card` legal
  target shape OR continue to use prompt-mediated choice. Recommendation:
  **continue with the prompt path** — it reuses the existing
  `pendingPrompt` machinery and keeps `LegalMoveTarget` minimal. A new
  `discard_card` target kind would be a larger ripple through
  `actionEncoding`, `playMoveHelpers`, simulation export schema, etc.
- The cEp8 leader-choice menu is sufficient for any pattern where the
  number of legal moves is small and the choice is "which row" or "which
  weather". For prompt-mediated choices, the existing prompt panel is the
  correct surface.
- AI is bounded by `legal-heuristic-v0`. None of the placeholder leaders
  break that contract — they all expose a finite set of legal moves at
  each decision point, which is the heuristic's input shape.
- Simulation export remains hidden-info-safe as long as: (a) reveal sets
  and `leaderCancelled` flags are added to per-seat observations rather
  than the global state row, (b) prompt-mediated choices follow the
  existing `legal-action-v1` encoding, and (c) `look_three_cards`
  disclosures are projected per observer seat.

## Recommended Implementation Tranches

cCp19+ tranches are ordered by ambiguity, blast radius, value to official
starter decks, UI / prompt complexity, hidden-info risk, and testability.
Each tranche is recommended as one cCp phase.

### Tranche 1 — Row-Wide Horn-Like Passives (IMPLEMENTED in cCp19)

**Members:** `double_siege`, `double_close` (×2), `double_ranged`.

**Status:** Implemented in cCp19 (see
`audit/reports/2026-05-02-cCp19-report.md`). The new helper
`getRowHornPolicyBySeat(state, leaders)` mirrors the cCp15
`getWeatherPolicyBySeat` pattern, derives a per-seat row-horn policy from
leader identity, and is wired into `calculateScores` with an explicit
`rowHornPolicyBySeat` override for focused tests. The score breakdown uses a
distinct `"leader_horn"` modifier when the leader passive applies and the
existing `"commanders_horn"` modifier when a physical horn applies.
Suppression by physical Commander's Horn (special card or unit/hero
`commanders_horn` source) is implemented; horn effects do not stack.
Heroes remain immune as receivers.

**Why first (retained for context):**

- Smallest engine surface area: a single new helper
  `getRowHornPolicyBySeat` mirroring the cCp15 `getWeatherPolicyBySeat`
  pattern.
- Zero hidden-info risk.
- No new prompt or modal UI.
- Includes 4 leader records spread across Northern Realms, Monsters, and
  Scoia'tael — high official starter deck reach.
- Testability is excellent: pure scoring tests over construction
  fixtures.

**Out of scope (deferred to later tranches):** Suppression interaction with
`cancel_leader` (Tranche 4) is documented but not exercised in Tranche 1.

### Tranche 2 — Active Score Modifier and Single-Step Prompt Leaders

**Members:** `double_spies` (IMPLEMENTED in cCp20), `restore_discard_to_hand`,
`optimize_agile_rows`, `shuffle_discards_into_decks`, `random_medic`. Plus,
contingent on §C-2 resolution, `draw_opponent_discard` (under catalog
interpretation).

**Status:** First member (`double_spies`) implemented in cCp20 as a
whole-match passive (see `audit/reports/2026-05-02-cCp20-report.md`).
Remaining members are still placeholder. After cCp20, six implemented
passive leader records exist (King Bran + four cCp19 row-horn + cCp20
Treacherous), and nine leader records remain placeholder.

**Why second (retained for context):**

- All five (or six) are one-shot actives or whole-match passives, no
  multi-stage prompts.
- Hidden-info risk is low or none.
- They reuse the existing `pendingPrompt` machinery (Patterns 4, 8) and
  the cEp8 leader-choice menu (Pattern 9), and the cCp20 passive (Pattern
  2) re-uses the cCp15 / cCp19 passive scoring-policy helper pattern.
- Each can be implemented in a focused cCp phase (≈ one phase per
  pattern).
- Testability is good: each leader has a deterministic test seed.

**Updated ordering inside Tranche 2 (post-cCp20):**

1. `double_spies` — IMPLEMENTED in cCp20 (whole-match passive).
2. `optimize_agile_rows` — one event per moved unit, but no prompt.
3. `restore_discard_to_hand` — single-step prompt.
4. `random_medic` — random pick, plays through normal Special-card path.
5. `shuffle_discards_into_decks` — bulk move, requires deterministic
   shuffle.
6. (`draw_opponent_discard` if §C-2 is resolved by Catalog Wins.)

### Tranche 3 — Setup-Time Event and Multi-Step Prompt

**Members:** `draw_extra_card` (Pattern 7), `discard_two_draw_one_from_deck`
(Pattern 3).

**Why third:**

- `draw_extra_card` is trivial to implement (one branch in `setup.ts`)
  but gives a complete cross-tranche test exercise: setup-time leaders
  must not produce a `use_leader` move and must not flip `leaderUsed`,
  same as King Bran.
- `discard_two_draw_one_from_deck` requires the engine's first
  multi-stage prompt. The work is non-trivial but isolated; doing it
  here keeps the first hidden-info-disclosure leaders (Tranche 4) free
  of prompt-stage churn.

### Tranche 4 — Hidden-Info Disclosure and Suppression

**Members:** `look_three_cards` (Pattern 5), `cancel_leader` (Pattern 6).
Plus `draw_opponent_discard` if §C-2 is resolved by Rulebook Wins (own-
deck tutor with hidden-info ramifications).

**Why last:**

- `look_three_cards` is the engine's first persistent hidden-info
  disclosure, requiring an observation-manifest update and broad test
  coverage.
- `cancel_leader` cross-cuts every passive leader implemented in
  Tranches 1-3 and must come after they exist or the test fixtures
  cannot demonstrate suppression.
- Hidden-info testing is the highest-risk bucket; doing it last lets
  Tranches 1-3 land first as a smaller integration set.

### Optional follow-ups after Tranche 4

- AI policy upgrade (`legal-heuristic-v1`) that values leader actions
  more accurately with the new abilities online.
- Catalog description alignment fixes per §C-1, §C-3, §C-4, §C-5,
  §C-6, §C-7, §C-9.
- Simulation export schema bump if the new reveal sets / leader-cancel
  flag are to live in `sim-export-v1` rather than v2.

## Settled Product Decisions (post-cCp18 review)

These are the cCp18 open product questions, settled by the product owner on
2026-05-02 and recorded here so future specs do not re-open them. cCp19
implements only the row-horn subset (Tranche 1); the other settled
decisions are tracked here for the relevant later tranche.

1. **Conflict §C-2 — Emhyr: The Relentless.** **Settled: catalog wins.**
   `nilfgaard.emhyr-var-emreis-the-relentless` is the
   `draw_opponent_discard` leader: draw a card from the **opponent's**
   discard pile. The earlier rulebook deck-tutor wording is superseded.
   `docs/gwent-rules.md` §16 was updated in cCp19 to match the catalog.
2. **Conflict §C-1 — Eredin: Destroyer of Worlds rulebook entry.**
   **Settled: confirmed rules-doc bug.** `docs/gwent-rules.md` §16's
   restore-from-discard row belongs to *Eredin: Bringer of Death*
   (`restore_discard_to_hand`), not *Eredin: Destroyer of Worlds*.
   *Destroyer of Worlds* is the discard-cost / deck-draw leader
   (`discard_two_draw_one_from_deck`). cCp19 corrected the rulebook
   table accordingly.
3. **Conflict §C-4 — `optimize_agile_rows` choice vs auto.**
   **Settled: auto-place** (catalog wording). The leader does not
   open a row-choice prompt; the engine selects the row that yields the
   most strength. UI work is deferred to the implementation tranche.
4. **`discard_two_draw_one_from_deck` flow.** **Settled: discard up to two
   cards from hand, then show all remaining deck cards, choose any one
   card to draw, then shuffle the remaining deck.** Implementable with at
   least one card in hand; zero cards in hand makes it unusable. Hidden-info
   redaction must keep the deck identities visible only to the acting seat.
5. **`random_medic` ability ID.** **Settled: passive mutation of Medic
   effects.** The leader does not play a random Special card from
   discard. Instead, while it is the seat's leader, every Medic effect
   (including chained Medic revivals) selects a **random non-hero unit**
   from the discard pile rather than letting the player choose. It does
   not affect hero sources that have Medic.
6. **`look_three_cards` reveal duration / dismissal.** **Settled: one-time
   modal.** The acting seat sees the three random opponent hand cards
   in a single modal disclosure; if dismissed it cannot be reopened.
   Implementation-time UI work captures the snapshot once and discards it.
7. **`look_three_cards` and mulligan / setup-time use.** **Settled:
   leaders fire in the play phase only.** Same gate as today's
   implemented leaders (`getLeaderMove` returns no move during
   mulligan).
8. **`cancel_leader` semantics.** **Settled: reaction / current-round
   suppression.** `cancel_leader` can be played as a reaction; it
   suppresses the opponent's leader effect for the current round only.
   If it cancels an active leader, that leader is still consumed (no
   refund). If it suppresses a passive, scoring recalculates immediately
   for the current round through the existing pure-function pipeline.
   Reaction window timing is part of the implementation tranche.
9. **`double_spies` duration.** **Settled: passive for the entire game.**
   The leader's effect is on for the rest of the match while the leader is
   on the seat; it doubles every battlefield non-hero Spy currently on the
   board and any future battlefield Spies. Hero Spies remain immune (Hero
   immunity, §17.1). **Implemented in cCp20** as a passive scoring derivation
   without a `use_leader` move; see §17.12e.
10. **`shuffle_discards_into_decks` empty-discards policy.** **Settled:
    unusable when both discard piles are empty.** When both seats'
    discards are empty, the leader emits no legal `use_leader` move
    (mirrors the `play_*` weather and `scorch_*` row "no no-op" policy).
    A single non-empty discard pile is enough to enable the move.

These ten decisions are now locked. The relevant tranches (Tranche 2-4)
should treat them as inputs and not re-open them.

## Cross-Reference Index

The following catalog and rule documents are the local authority for
cCp19+ implementation:

- Catalog leader records: [src/data/catalog/leaders/index.ts](../src/data/catalog/leaders/index.ts).
- Catalog ability metadata: [src/game/catalog/abilities.ts](../src/game/catalog/abilities.ts).
- Catalog ability ID list: [src/game/catalog/constants.ts](../src/game/catalog/constants.ts).
- Promotion manifest: [src/data/catalog/leaders/official-promotion.ts](../src/data/catalog/leaders/official-promotion.ts).
- Rule documentation: [docs/gwent-rules.md](gwent-rules.md), §16, §17.1, §17.12a, §17.12b, §17.12c, §17.23.
- Engine leader entrypoints: [src/game/core/legalMoves.ts](../src/game/core/legalMoves.ts) (`getLeaderMove`), [src/game/core/commands.ts](../src/game/core/commands.ts) (`executeLeader`).
- Game8 staging: [audit/scrapes/2026-04-29-game8-gwent-cards.json](../audit/scrapes/2026-04-29-game8-gwent-cards.json).
- Witcher Fandom scrape: [audit/scrapes/2026-04-30-witcher-fandom/](../audit/scrapes/2026-04-30-witcher-fandom/).

## Change Log

- 2026-05-02 (cCp18): initial matrix per `docs/spec/2026-05-02-cCp18-specs.md`.
- 2026-05-02 (cCp19): Tranche 1 implemented. `double_siege`, `double_close`
  (×2), and `double_ranged` promoted from `placeholder` to `implemented`
  passive. New helper `getRowHornPolicyBySeat`, new `"leader_horn"` score
  modifier, official promotion manifest extended with the four passive
  leader source IDs and the placeholder ability list backfilled to be
  exhaustive. Settled the ten cCp18-blocker product decisions and
  recorded them in this matrix's *Settled Product Decisions* section.
- 2026-05-02 (cCp20): `double_spies` (Eredin Breacc Glas: The Treacherous)
  promoted from `placeholder` to `implemented` as a **whole-match passive**
  (Pattern 2). New helper `getDoubleSpiesPolicyBySeat`, new
  `"leader_double_spies"` score modifier, new `CardScoreEntry.spyMultiplier`
  / `afterSpyMultiplier` fields. Modifier order is now Weather → Double
  Spies → Tight Bond → Morale → Horn. The official promotion manifest
  adds `monsters.eredin-breacc-glas-the-treacherous` to
  `implementedPassiveLeaderSourceIds` (now 6) and removes `double_spies`
  from `placeholderLeaderAbilityIds` (now 9). The earlier "snapshot at
  fire time" wording in this matrix has been corrected. After cCp20, nine
  leader records remain placeholder.
  See `audit/reports/2026-05-02-cCp19-report.md` for details.
