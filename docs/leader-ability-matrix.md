# Leader Ability Matrix

This document is the durable cCp18 audit output, refreshed by cCp19,
cCp20, cCp21, cCp22, cCp23, and cCp24. It enumerates every official
leader source record, classifies the placeholder leaders by
implementation pattern, lists local-source conflicts, and records
engine, legal-move, prompt / UI, hidden-info, AI, and simulation
implications. cCp19+ implementation specs should pull from this matrix
rather than re-running the audit.

The matrix is mostly documentation; cCp19 implemented Tranche 1 (row-wide
horn-like passives), cCp20 implemented `double_spies` as a full-game
passive (Tranche 2 first leader), cCp21 implemented
`optimize_agile_rows` as the second Tranche 2 leader (active one-shot
auto-place with tied-row player choice), cCp22 implemented
`restore_discard_to_hand` as the third Tranche 2 leader (active one-shot
prompt-based restore over own discard), cCp23 implemented
`shuffle_discards_into_decks` as the fourth Tranche 2 leader (active
one-shot bulk discard-to-deck recycle with deterministic per-seat
shuffle), and cCp24 implemented `draw_opponent_discard` as the fifth
Tranche 2 leader (active one-shot prompt-based draw over the opponent's
discard pile, settling the cCp18 §C-2 conflict in favor of the catalog).
This file is updated to reflect all six landings.

## Status

- Catalog leader source count: **22** (5 Northern Realms / 5 Nilfgaard /
  5 Monsters / 5 Scoia'tael / 2 Skellige).
- Leader ability IDs registered in `src/game/catalog/constants.ts`: **21**.
  All 21 are reachable through one of the 22 catalog leader records.
  `double_close` is the only leader ability ID shared by more than one leader
  record (Eredin: Commander of the Red Riders and Francesca: Queen of Dol
  Blathanna). `clear_weather` is both a card and leader ability ID, but only
  Foltest: Lord Commander of The North uses it as a leader.
- Implemented executable leaders: **11** after cCp24 (each emits a legal
  `use_leader` move): `clear_weather`, `play_frost`, `play_fog`,
  `play_rain`, `play_any_weather`, `scorch_range`, `scorch_siege`,
  `optimize_agile_rows`, `restore_discard_to_hand`,
  `shuffle_discards_into_decks`, `draw_opponent_discard`.
- Implemented passive leaders: **6** after cCp20 — `weather_half_penalty`
  on King Bran (cCp15), the four cCp19 row-wide horn-like passives
  (`double_siege` on Foltest: The Siegemaster, `double_close` on Eredin:
  Commander of the Red Riders and Francesca: Queen of Dol Blathanna, and
  `double_ranged` on Francesca: The Beautiful), and `double_spies` on
  Eredin Breacc Glas: The Treacherous (cCp20).
- Placeholder leader records: **5** spanning **5** distinct ability IDs
  after cCp24. (cCp24 promoted 1 leader record — Emhyr var Emreis: The
  Relentless — and 1 ability ID — `draw_opponent_discard` — out of
  placeholder.)
- `OfficialLeaderPromotionManifest.placeholderLeaderAbilityIds` remains
  **exhaustive** after cCp24 — it lists every leader ability whose
  `CATALOG_LEADER_ABILITY_METADATA.status` is still `placeholder`:
  `cancel_leader`, `discard_two_draw_one_from_deck`, `draw_extra_card`,
  `look_three_cards`, `random_medic`. (See Source Conflicts §C-7 for the
  cCp18 audit finding that prompted this fix.)

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
| `scoiatael.francesca-findabair-hope-of-the-aen-seidhe` | Francesca Findabair: Hope of the Aen Seidhe | Scoia'tael | `optimize_agile_rows` | `none` (auto) **or** `board_row` (tied row choice) | cCp21. Auto-places when one movable common row ties the highest score across all candidate rows; emits one `board_row` move per tied best movable row otherwise. Pure no-op rows are not executable, and worse movable rows are not offered when the current no-op row is uniquely best. |
| `monsters.eredin-bringer-of-death` | Eredin: Bringer of Death | Monsters | `restore_discard_to_hand` | `none` (opens a `choose_card` prompt over own discard) | cCp22. Active one-shot. Emits one no-target `use_leader` move when the acting seat's own discard has at least one eligible card; opens a `choose_card` prompt without consuming the leader. The leader is consumed only after a legal prompt option resolves; restored cards return to hand without resolving their abilities. Any card kind in own discard is eligible (units, heroes, specials, weather, side-deck-only / generated). |
| `skellige.crach-an-craite` | Crach an Craite | Skellige | `shuffle_discards_into_decks` | `none` | cCp23. Active one-shot. Emits one no-target `use_leader` move when at least one seat has a non-empty discard pile; both-empty discards emit no legal move. Recycles each non-empty discard into the same seat's deck (off-owner cards follow the discard pile, not the original owner), shuffles only affected decks deterministically through the seeded RNG, leaves empty-discard seats untouched (no hidden no-op shuffle), and consumes the leader. Recycled cards do not resolve their abilities. |
| `nilfgaard.emhyr-var-emreis-the-relentless` | Emhyr var Emreis: The Relentless | Nilfgaard | `draw_opponent_discard` | `none` (opens a `choose_card` prompt over opponent discard) | cCp24. Active one-shot. Emits one no-target `use_leader` move when the opponent discard has at least one eligible card; opens a `choose_card` prompt without consuming the leader. The leader is consumed only after a legal prompt option resolves; drawn cards return to the acting hand without resolving their abilities. Any card kind in opponent discard is eligible (units, heroes, specials, weather, side-deck-only / generated, off-owner). Settles cCp18 §C-2 (catalog wins). |

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
| Ability metadata status | `implemented` (cCp22) |
| Catalog description | "Restore a card from your discard pile to your hand." |
| Local rule / source text | Catalog text + `docs/gwent-rules.md` §16 — see also Source Conflicts §C-1. |
| Implemented behavior (cCp22) | Active one-shot. The pure helper `getRestoreDiscardCandidates({ state, seatId, catalogCards })` collects every card currently in the acting seat's own discard pile whose catalog source resolves, in discard order. `getLeaderMove` emits exactly one no-target `use_leader` move when at least one candidate exists, with `target.kind === "none"`, `metadata.targetRequirement === "future_prompt"`, `metadata.targetCount === candidates.length`, and `metadata.targetLabel === "own discard"`. `executeLeader` rejects any non-`none` target, rejects if the candidate set is empty, then clones state, emits `ability_triggered`, builds a `pendingPrompt` (`kind === "choose_card"`, `abilityId === "restore_discard_to_hand"`, one option per candidate keyed `restore:<cardId>` with `label === "Restore <card name> to hand"`, `target.kind === "card_instance"` with no `row` field), sets `state.pendingPrompt`, and emits `prompt_opened` — without setting `seat.leaderUsed`, without emitting `leader_used`, without moving any discard card, and without handing off the turn. `ChoosePromptOption` validates seat ownership and option legality, validates the chosen card is still in the acting seat's discard pile (rejects with `EngineRuleError` and never consumes the leader if not), then clones state, moves the chosen card from discard to the acting seat's hand with `card_moved.reason === "leader_restore_discard_to_hand"`, sets the restored card's `controller` to the acting seat (leaving `owner` unchanged), emits `prompt_resolved`, `ability_resolved.restored_card`, sets `seat.leaderUsed = true`, emits `leader_used`, clears `state.pendingPrompt`, and hands off the turn through the existing `handoffTurn` helper. Restored cards do **not** resolve their abilities (no `card_played`, no Medic chain, no Scorch, no on-play weather effect) — they return to hand and behave normally only if played later. |
| Active vs passive vs setup | Active one-shot. |
| Implemented legal move shape | One no-target `use_leader` move (`target.kind === "none"`, `metadata.targetRequirement === "future_prompt"`). Prompt resolution emits one `choose_prompt_option` move per candidate (`target.kind === "card_instance"`, `side === "own"`, no `row` field). |
| Implemented command transaction shape | `UseLeader` opens the `choose_card` prompt without consuming the leader; `ChoosePromptOption` resolves the prompt, moves the chosen card from discard to hand, sets `seat.leaderUsed = true`, emits `leader_used`, and hands off the turn. |
| Prompt / choice UI need | The existing generic `PromptPanel` renders the `choose_card` options as plain labelled buttons (`"Restore <card name> to hand"`) with no new modal or card-tile UI. Richer discard-card prompt tiles are deferred to a later Cluster E polish phase. |
| Hidden-info risk | Low. Acting seat's own discard is already public per §13 / §17.5 ("discard piles are face-up"). AI-owned restore prompts remain hidden from the human UI because `getPromptMoves` returns `[]` for the non-acting seat and `summarizeEvents` only exposes `prompt.seatId` / `prompt.abilityId` for `prompt_opened`, never option labels or card identities. |
| Implementation difficulty | medium (delivered in cCp22). |
| Recommended tranche | Tranche 2 (implemented in cCp22). |
| Settled questions | (1) Heroes eligible? **Yes** — the leader text says "a card from your discard pile" without Medic's non-hero unit restriction. (2) Specials / weather eligible? **Yes** — the catalog text says "card", not "unit". (3) Empty discard? **No legal move** — `getLeaderMove` emits no `use_leader` move when the helper returns zero candidates, so the once-per-game leader cannot no-op. (4) Leader consumption? **Only after a legal prompt option resolves** — `UseLeader` opens the prompt without setting `seat.leaderUsed`; `ChoosePromptOption` consumes the leader. (5) Restored card abilities? **Do not resolve on restore** — the card returns to hand and resolves abilities normally only if played later. |

### Emhyr var Emreis: The Relentless — `draw_opponent_discard`

| Field | Value |
|---|---|
| Source ID | `nilfgaard.emhyr-var-emreis-the-relentless` |
| Faction | Nilfgaard |
| Ability metadata status | `implemented` (cCp24) |
| Catalog description | "Draw a card from your opponent's discard pile." |
| Local rule / source text | Catalog text. The cCp18 §C-2 conflict is **settled in favor of the catalog**; the printed-rulebook deck-tutor wording is superseded. |
| Implemented behavior (cCp24) | Active one-shot. The pure helper `getOpponentDiscardDrawCandidates({ state, seatId, catalogCards })` collects every card currently in the **opponent's** discard pile whose catalog source resolves, in opponent discard order. `getLeaderMove` emits exactly one no-target `use_leader` move when at least one candidate exists, with `target.kind === "none"`, `metadata.targetRequirement === "future_prompt"`, `metadata.targetCount === candidates.length`, and `metadata.targetLabel === "opponent discard"`. `executeLeader` rejects any non-`none` target, rejects if the candidate set is empty, then clones state, emits `ability_triggered`, builds a `pendingPrompt` (`kind === "choose_card"`, `abilityId === "draw_opponent_discard"`, one option per candidate keyed `draw-opponent-discard:<cardId>` with `label === "Draw <card name> from opponent discard"`, `target.kind === "card_instance"` with no `row` field), sets `state.pendingPrompt`, and emits `prompt_opened` — without setting `seat.leaderUsed`, without emitting `leader_used`, without moving any discard card, and without handing off the turn. `ChoosePromptOption` validates seat ownership and option legality, validates the chosen card is still in the opponent's discard pile (rejects with `EngineRuleError` and never consumes the leader if not), then clones state, moves the chosen card from the opponent discard pile to the acting seat's hand with `card_moved.reason === "leader_draw_opponent_discard_to_hand"`, sets the chosen card's `controller` to the acting seat (leaving `owner` unchanged), emits `prompt_resolved`, `ability_resolved.drew_opponent_discard`, sets `seat.leaderUsed = true`, emits `leader_used`, clears `state.pendingPrompt`, and hands off the turn through the existing `handoffTurn` helper. Drawn cards do **not** resolve their abilities (no `card_played`, no Medic chain, no Scorch, no on-play weather effect) — they enter hand and behave normally only if played later. Off-owner cards (acting-seat-owned cards physically in the opponent discard) are eligible; the chosen card moves to the acting seat's hand with `owner` preserved and `controller` reset to the acting seat. |
| Implemented legal move shape | `use_leader` with `target.kind === "none"`, `metadata.targetRequirement === "future_prompt"`, `metadata.targetCount === candidates.length` (eligible opponent-discard count), and `metadata.targetLabel === "opponent discard"`. `getPromptMoves` emits opponent-side `card_instance` targets for `draw_opponent_discard` prompt options (`{ kind: "card_instance", side: "opponent", seatId: opponentSeat, cardId }`), distinguishing them from cCp22 restore prompts whose options use `side: "own"`. |
| Implemented command transaction shape | `UseLeader { target: { kind: "none" } }` → reject if non-`none` target or empty opponent discard → clone state → emit `ability_triggered` → set `state.pendingPrompt` (`kind === "choose_card"`, `abilityId === "draw_opponent_discard"`) → emit `prompt_opened` → return without `leader_used`, without `seat.leaderUsed`, without moving cards, with `currentTurn` unchanged. `ChoosePromptOption` → validate seat / option / stale-target → clone → move from `discard:opponent` to `hand:acting` (`reason === "leader_draw_opponent_discard_to_hand"`) → set `controller = acting`, leave `owner` → emit `prompt_resolved` → clear `pendingPrompt` → emit `ability_resolved.drew_opponent_discard` → set `seat.leaderUsed = true` → emit `leader_used` → handoff. |
| Prompt / choice UI need | None new. The existing generic `PromptPanel` renders the labelled `choose_card` options. The discard browser already shows opponent discard contents (public). |
| Hidden-info risk | Low. Opponent discard contents are already public. AI-owned prompts remain hidden from the human UI through the existing prompt-move gate (`getPromptMoves` returns `[]` for any seat that does not own the prompt). `summarizeEvents` exposes only `prompt.seatId` / `prompt.abilityId` for `prompt_opened`, never option labels or card identities. |
| Implementation difficulty (delivered) | medium (delivered in cCp24). |
| Recommended tranche (implemented in cCp24) | Tranche 2. |
| Settled questions | (1) Catalog vs rulebook? **Catalog wins** (settled). The Relentless draws from opponent discard, not own deck. (2) Heroes eligible? **Yes** — the catalog text says "card", not "unit", so heroes are included. (3) Specials / weather eligible? **Yes** — same reasoning. (4) Off-owner cards? **Yes** — the rule targets the physical opponent discard pile, so an acting-seat-owned Spy sitting in opponent discard is eligible. The chosen card moves to acting hand with `owner` preserved and `controller` reset to acting. (5) Empty opponent discard? **No legal move** — `getLeaderMove` emits no move when candidates is zero, so the once-per-game leader cannot no-op. Empty opponent discard with non-empty own discard still emits no legal move (own discard is not a fall-back source). (6) Leader consumption? **Only after a legal prompt option resolves** — `UseLeader` opens the prompt without setting `seat.leaderUsed`; `ChoosePromptOption` consumes the leader. (7) Drawn card abilities? **Do not resolve on draw** — the card enters hand and resolves abilities normally only if played later. |

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
| Ability metadata status | `implemented` (cCp21) |
| Catalog description | "Move all your Agile units to the row that yields the most strength." |
| Local rule / source text | Classic Witcher 3 leader text says "Move all your Agile Units to the row of your choice." Catalog says "to the row that yields the most strength." Settled product decision §3 (refined in cCp21): **auto-place to the row that yields the highest acting-seat score; if multiple rows tie for the best score, expose only the tied best rows as legal player choices.** |
| Implemented behavior (cCp21) | Active one-shot. The pure helper `planOptimizeAgileRows(state, seatId, catalogCards, catalogLeaders)` computes a single common destination row and the eligible own-board non-hero Agile units. For each candidate row (intersection of all eligible cards' legal rows), the helper simulates moving every eligible card to that row and reads `breakdown.totalBySeat[actingSeatId]` from the central `calculateScores` pipeline. Rows where no eligible card actually moves are not executable. Candidate rows are scored before no-op filtering: if the current no-op row is uniquely best and every movable row scores lower, the leader emits no legal move instead of offering a worse move. If exactly one executable row ties the best score across all candidate rows, `getLegalMoves` exposes one `use_leader` move with `target.kind === "none"`; if multiple executable rows tie for that best score, it exposes one `use_leader` move per tied row with `target.kind === "board_row"`, `seat === actingSeatId`, and `metadata.targetLabel` like `"Close Combat"` / `"Ranged Combat"` so the cEp8 leader-choice menu renders without UI changes. Command execution moves all eligible cards in deterministic board order (`close → ranged → siege`, preserving unit order within each row), emits `card_moved.reason === "leader_optimize_agile"` per moved card (cards already on the chosen row do not move and produce no event), emits `ability_triggered` / `ability_resolved.moved` / `leader_used`, sets `seat.leaderUsed = true`, and hands off the turn. Rejection paths (no eligible, no candidate row, no executable row, only worse movable rows, non-best target row, wrong-seat target, missing target on a tie, extra target on auto) raise `EngineRuleError` and never consume the leader. Heroes are excluded as eligible cards (Hero immunity, §17.1). Opponent-board-side cards — including any hypothetical agile Spy — are excluded. |
| Active vs passive vs setup | Active one-shot. |
| Implemented legal move shape | `target.kind === "none"` for the auto path; `target.kind === "board_row"` (acting seat) for the tied-row choice path. The acting seat's `leaderUsed` is never set on rejection; both paths reject the no-op consumption case explicitly. |
| Implemented command transaction shape | `UseLeader` → engine recomputes the plan from public state → moves every eligible card to the chosen row → emits `card_moved` per moved card with `reason === "leader_optimize_agile"` → emits `ability_resolved.moved` + `leader_used` → hands off turn. |
| Prompt / choice UI need | None at engine level. cEp8's leader-choice menu (already shipped) renders the tied-row options through the existing `metadata.targetLabel` fallback. |
| Hidden-info risk | None. The plan only reads public board state and produces deterministic plans. |
| Implementation difficulty | medium (delivered in cCp21). |
| Recommended tranche | Tranche 2 (implemented in cCp21). |
| Settled questions | (1) §C-4 product decision: **auto-place to the highest-scoring common row; tied best rows become legal player choices** (refined cCp21). (2) Heroes excluded under §17.1 — even hero sources with `agile` (Kayran, Villentretenmerth) are not eligible. (3) Opponent-board-side cards excluded — even if controlled by the acting seat. (4) Pure no-op rows excluded — leader is never consumed without movement. (5) Worse movable rows are excluded when the current no-op row is uniquely best. |

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
| Ability metadata status | `implemented` (cCp23) |
| Catalog description | "Shuffles both discard piles back into their respective decks." |
| Local rule / source text | Gwent classic text: "Shuffle both Discard piles into their respective decks." Active leader, fires once per game and recycles both seats' discards back into their decks. |
| Implemented behavior (cCp23) | Active one-shot. The pure helper `getDiscardRecyclePlan({ state })` collects every non-empty discard pile in stable seat order (`seat_a` then `seat_b`), preserves discard-insertion order inside each seat plan, and skips stale missing-card entries. `getLeaderMove` emits exactly one no-target `use_leader` move when `plan.totalCardCount > 0`, with `target.kind === "none"`, `metadata.targetRequirement === "none"`, `metadata.targetCount === plan.totalCardCount`, and `metadata.targetLabel === "discard piles"`; both-empty discards emit no legal move. `executeLeader` rejects any non-`none` target, rejects when the plan is empty, then clones state, emits `ability_triggered`, processes affected seats in stable order through a single `SeededRng` instance built from `state.rng.seed` / `state.rng.state`. For each affected seat: every planned card is moved from discard to that seat's deck with `card_moved.reason === "leader_shuffle_into_deck"`, the moved card's `controller` is reset to the destination deck seat (with `owner` unchanged), then the seat's full deck is shuffled with `shuffleWithRng`, and `deck_shuffled.reason === "leader_shuffle_into_deck"` is emitted for that seat. After all affected shuffles, `state.rng.state` is updated to the RNG's final state. The transaction emits `ability_resolved` with `outcome === "shuffled_discards"`, `leader_used`, sets `seat.leaderUsed = true`, and hands off the turn through `handoffTurn`. Empty-discard seats are not shuffled and emit no `deck_shuffled` event — their hidden deck order is preserved. Recycled cards do **not** resolve their abilities (no `card_played`, no Medic chain, no Scorch, no on-play weather effect). |
| Implemented legal move shape | `use_leader` with `target.kind === "none"`, `metadata.targetRequirement === "none"`, `metadata.targetCount === plan.totalCardCount` (sum of recyclable cards across both discard piles), and `metadata.targetLabel === "discard piles"`. Hidden deck order, deck instance IDs, and shuffled order are not exposed in legal-move metadata. |
| Implemented command transaction shape | `UseLeader { target: { kind: "none" } }` → reject if either non-`none` target or empty plan → clone state → emit `ability_triggered` → for each affected seat in `[seat_a, seat_b]` order: per-card `moveCard(..., { kind: "deck", seat: seatId }, "leader_shuffle_into_deck")` (preserving discard order, resetting `controller`, leaving `owner`) then `shuffleWithRng` on the full deck and `deck_shuffled.reason === "leader_shuffle_into_deck"` → update `state.rng.state` → emit `ability_resolved.shuffled_discards`, `leader_used`, set `seat.leaderUsed = true`, hand off turn. |
| Prompt / choice UI need | None. The existing leader action button renders the no-target leader move as `use leader`. |
| Hidden-info risk | Low. Discard contents were already public; post-shuffle deck order is hidden. The engine does not expose post-shuffle deck order through legal-move metadata, AI observation, simulation export rows, or any new event payload. The new `deck_shuffled.reason "leader_shuffle_into_deck"` event carries only the seat ID and the new movement reason. |
| Implementation difficulty (delivered) | medium. Engine had not previously needed to mutate decks at runtime; cCp23 introduces the first runtime deck shuffle. The seeded RNG produces a deterministic shuffle through the existing `createSeededRngFromState` + `shuffleWithRng` helpers. |
| Recommended tranche (implemented in cCp23) | Tranche 2. |
| Settled questions | (1) Both-discards-empty is unusable per settled product decision §10. (2) Skellige round-three return §17.18 still triggers on whatever is in discard at future round-end — Crach does not create a permanent return pool. (3) Crach does **not** affect `removed_from_game`, `side_deck`, hand, board, row horns, weather zone, or leader zone — only `seat.discard`. (4) Affected-decks-only shuffle: empty-discard seats are not shuffled (no hidden no-op mutation). (5) Off-owner discard cards (Spies discarded after round cleanup on the opposite board side) recycle into the discard-pile seat's deck, not the original owner's deck — `controller` is reset to the destination seat, `owner` is preserved. |

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

### Pattern 4 — Discard Restore (single-step prompt) — `restore_discard_to_hand` IMPLEMENTED in cCp22, `draw_opponent_discard` IMPLEMENTED in cCp24

| Members | Ability IDs | Status |
|---|---|---|
| Eredin: Bringer of Death | `restore_discard_to_hand` | **IMPLEMENTED in cCp22** |
| Emhyr: The Relentless | `draw_opponent_discard` | **IMPLEMENTED in cCp24** |

**Status:** `restore_discard_to_hand` implemented in cCp22 (see
`audit/reports/2026-05-02-cCp22-report.md`); `draw_opponent_discard`
implemented in cCp24 (see `audit/reports/2026-05-03-cCp24-report.md`).
The cCp18 §C-2 conflict is settled in favor of the catalog: The
Relentless draws from opponent discard, not own deck. The two members
share the single-step `choose_card` prompt machinery; the only
differences are the candidate pile (own vs opponent discard) and the
prompt-target side (`own` vs `opponent`).

- Trigger: active one-shot.
- Effect:
  - `restore_discard_to_hand` (cCp22): choose one card from the acting
    seat's **own** discard pile and move it to the acting seat's hand.
  - `draw_opponent_discard` (cCp24): choose one card from the
    **opponent's** discard pile and move it to the acting seat's hand.
  - In both cases, the chosen card moves to the acting seat's hand; the
    chosen card's `controller` is reset to the acting seat; the
    immutable `owner` is preserved. Off-owner cards in the targeted
    discard pile are eligible. Drawn / restored cards do **not**
    trigger their abilities — they enter hand and behave normally only
    if played later.
- Engine surfaces:
  - pure helpers
    `getRestoreDiscardCandidates({ state, seatId, catalogCards })` in
    `src/game/core/leaderDiscardRestore.ts` (own discard) and
    `getOpponentDiscardDrawCandidates({ state, seatId, catalogCards })`
    in `src/game/core/leaderOpponentDiscardDraw.ts` (opponent discard).
    Both are pure, deterministic, discard-order output, skip missing
    instances / missing catalog sources, and perform no hidden-info
    reads.
  - `pendingPrompt.kind === "choose_card"` with
    `abilityId === "restore_discard_to_hand"` (cCp22) or
    `abilityId === "draw_opponent_discard"` (cCp24).
  - `PendingPromptOption.target.row` is optional. Medic (`medic_revive`)
    prompts continue to set `row`; the cCp22 / cCp24 prompts omit it.
  - `getPromptMoves` selects `target.side` by `prompt.abilityId`:
    `side: "own"` for cCp22 restore, `side: "opponent"` for cCp24
    draw. Both target shapes are `card_instance` with the appropriate
    `seatId` and `cardId`.
  - new movement reasons in the `card_moved.reason` union:
    `"leader_restore_discard_to_hand"` (cCp22) and
    `"leader_draw_opponent_discard_to_hand"` (cCp24).
  - `executeLeader` opens the prompt without consuming the leader;
    `ChoosePromptOption` validates the chosen card is still in the
    expected discard pile (own for cCp22, opponent for cCp24) before
    cloning state, then resolves the move and consumes the leader.
- Legal-move shape: one no-target `use_leader` move
  (`target.kind === "none"`,
  `metadata.targetRequirement === "future_prompt"`,
  `metadata.targetCount === candidates.length`,
  `metadata.targetLabel === "own discard"` for cCp22 or `"opponent
  discard"` for cCp24) only when the relevant discard pile has at
  least one eligible card. Empty discard emits no legal `use_leader`
  move; for cCp24, empty opponent discard with non-empty own discard
  also emits no move (own discard is not a fall-back source).
- Command shape: `UseLeader` (no target) → `pendingPrompt.choose_card`
  → `ChoosePromptOption` → card moves discard → hand → consume leader →
  hand off turn. Rejection (non-`none` target on `UseLeader`, empty
  candidate set, wrong seat on `ChoosePromptOption`, invalid option ID,
  stale target no longer in expected discard pile, missing prompt)
  raises `EngineRuleError` and never consumes the leader.
- Prompt / UI: existing generic `PromptPanel` renders the `choose_card`
  options as plain labelled buttons (`"Restore <card name> to hand"`
  for cCp22, `"Draw <card name> from opponent discard"` for cCp24). No
  new modal or card-tile UI. cEp3 discard browser already renders both
  discard piles publicly; reuse for inspection.
- Hidden-info risk: low. Both discard piles are already public per
  §13 / §17.5. AI-owned prompts remain hidden from the human UI
  because `getPromptMoves` returns `[]` for the non-acting seat and
  `summarizeEvents` only exposes `prompt.seatId` / `prompt.abilityId`
  for `prompt_opened`, never option labels or card identities.
- AI: `legal-heuristic-v0` ranks `choose_prompt_option` moves by
  `option.targetStrength ?? 0` and falls back to deterministic moveId
  order. `seatObservation` derives `targetStrength` from the catalog
  source for both flavors. cCp24 does not change strategic AI tuning.
- Simulation export: prompt step shape already exists; no new export
  fields. The new `card_moved.reason` variants join the engine event
  union and are inherited by JSONL replay infrastructure.
- Effect classification: one-shot active with single-step prompt
  (cCp22 own-discard variant; cCp24 opponent-discard variant).

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

### Pattern 9 — Bulk Move Friendly Agile Units (IMPLEMENTED in cCp21)

| Members | Ability IDs |
|---|---|
| Francesca: Hope of the Aen Seidhe | `optimize_agile_rows` |

**Status:** Implemented in cCp21 (see
`audit/reports/2026-05-02-cCp21-report.md`). The settled product
decision §3 was refined to "auto-place to the highest-scoring common
row; if tied, expose only the tied best rows as legal player choices."

- Trigger: active one-shot.
- Effect: every eligible friendly own-board non-hero Agile unit moves
  to one chosen common row, where the row is selected to maximize the
  acting seat's score through `calculateScores` simulation.
- Engine surfaces:
  - new pure helper `planOptimizeAgileRows(state, seatId, catalogCards,
    catalogLeaders)` in `src/game/core/leaderOptimizeAgile.ts` returns
    `{ outcome, currentScore, bestScore?, eligibleCards, candidates,
    bestCandidates }`.
  - `getLeaderMove` calls the helper and emits no `use_leader` move on
    `no_eligible` / `no_candidate_row` / `no_executable_row`; emits a
    single no-target `use_leader` on `auto`; emits one
    board-row-targeted `use_leader` per `bestCandidates` entry on
    `choice`.
  - `executeLeader` recomputes the plan, validates the target shape,
    moves every eligible card to the chosen row in deterministic board
    order, and emits the standard ability-resolved / leader-used /
    turn-handoff event sequence.
- Legal-move shape: `target.kind === "none"` (auto) or
  `target.kind === "board_row"` (acting seat) for tied row choice.
  `metadata.targetRequirement === "none"` (auto) or
  `metadata.targetRequirement === "agile_row_choice"` (choice).
  `metadata.targetLabel` is set to `"Close Combat"` /
  `"Ranged Combat"` / `"Siege Combat"` so the cEp8 leader-choice menu
  renders the option without UI changes.
- Command shape: `UseLeader` → recompute plan → bulk move →
  `card_moved.reason === "leader_optimize_agile"` per moved card →
  `ability_resolved.moved` → `leader_used` → handoff.
- Prompt / UI: row-choice fits cEp8's leader-choice menu pattern. The
  existing `metadata.targetLabel` fallback handles board-row targets
  with no UI churn.
- Hidden-info risk: none.
- AI: heuristic does not need to choose — auto-optimal is decidable
  from public state. For tied moves, picking any of the legal options
  is equally optimal by definition.
- Simulation export: emits N `card_moved` rows per fire (one per
  actually-moved card; cards already on the chosen row do not move
  and do not emit events).
- Effect classification: one-shot active; instantaneous board mutation.

### Pattern 10 — Both-Discard Recycle (`shuffle_discards_into_decks` IMPLEMENTED in cCp23)

| Members | Ability IDs |
|---|---|
| Crach an Craite | **IMPLEMENTED in cCp23** |

**Status:** `shuffle_discards_into_decks` implemented in cCp23 (see
`audit/reports/2026-05-03-cCp23-report.md`). The pattern is now an
**affected-decks-only** active one-shot — empty-discard seats are not
shuffled.

- Trigger: active one-shot.
- Effect: each non-empty discard pile is moved into the same seat's deck
  and that seat's deck is shuffled deterministically; empty-discard seats
  are not touched.
- Engine surfaces:
  - new pure helper `getDiscardRecyclePlan({ state })` returns the
    deterministic seat-ordered recycle plan.
  - `executeLeader` for affected seats only: append discard to deck,
    then shuffle using a single `SeededRng` instance from
    `state.rng.seed` / `state.rng.state`.
  - new `card_moved.reason "leader_shuffle_into_deck"` and new
    `deck_shuffled.reason "leader_shuffle_into_deck"` event variants.
- Legal-move shape: `use_leader` with `target.kind === "none"`,
  `metadata.targetRequirement === "none"`,
  `metadata.targetCount === plan.totalCardCount`,
  `metadata.targetLabel === "discard piles"`. Emit only if at least one
  seat's discard is non-empty (per settled product decision §10).
- Command shape: `UseLeader { target: { kind: "none" } }` → reject empty
  plan / non-none target → clone state → emit `ability_triggered` →
  per-affected-seat: `card_moved` per recycled card → `shuffleWithRng` →
  `deck_shuffled` → after all affected seats, update `state.rng.state` →
  emit `ability_resolved.shuffled_discards` → `leader_used` → handoff.
- Prompt / UI: none. Existing leader action button renders the no-target
  move as "use leader".
- Hidden-info risk: low (discard contents already public; deck order
  hidden, but shuffle uses seeded RNG so replay is deterministic). The
  engine does not expose post-shuffle deck order through legal-move
  metadata, AI observation, or event payloads.
- AI: heuristic should value recycling Spies and big units, but
  `legal-heuristic-v0` does not currently score deck composition. That's
  a policy concern, not correctness — the cCp23 implementation does not
  tune AI strategy.
- Simulation export: emits per-card `card_moved` rows plus one
  `deck_shuffled` per affected seat; size could be large.
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

### §C-2 — Emhyr var Emreis: The Relentless (SETTLED & IMPLEMENTED in cCp24)

- `docs/gwent-rules.md` §16 originally read:
  > | **Emhyr var Emreis, The Relentless** | Draw a Unit Card or Special
  > Card of the player's choice **from their deck**, then shuffle the
  > deck. (Effectively a tutor for any card type.) |
- The catalog assigns `draw_opponent_discard` to
  `nilfgaard.emhyr-var-emreis-the-relentless` with description "Draw a
  card from your opponent's discard pile."
- Game8 staging: `draw_opponent_discard` (matches catalog).
- Witcher Fandom snapshot does not include leader effect text in the
  parsed pages.
- **Classification (historical): local sources disagreed; product
  decision was needed.** The catalog vs `docs/gwent-rules.md` were
  inconsistent. The cCp18 audit could not pick a winner without a
  product-owner call.
- **Settled by product owner: catalog wins (Option A).** Implement
  `draw_opponent_discard` as a discard-restore on the **opponent's**
  discard pile (Pattern 4 variant). The deck-tutor wording in §16 is
  superseded; §16 is updated to point at the cCp24 implementation.
- **IMPLEMENTED in cCp24** as an active one-shot leader resolved
  through a single-step `choose_card` prompt over the opponent's
  discard pile. Pattern 4 / `draw_opponent_discard`. See
  `audit/reports/2026-05-03-cCp24-report.md` and §17.12i. Heroes are
  eligible (catalog text says "card", not "unit"). Off-owner cards in
  the opponent discard are eligible. Drawn cards do not trigger their
  abilities. Empty opponent discard emits no legal `use_leader` move.
  The cCp18 audit's earlier "Option B (rulebook wins)" recommendation
  was overridden by the product-owner call; this entry is preserved
  as historical context only.

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
| 4. Discard Restore / Draw (`restore_discard_to_hand` IMPLEMENTED in cCp22, `draw_opponent_discard` IMPLEMENTED in cCp24) | `target.kind === "none"` opens prompt | `choose_card` over own discard (cCp22) or opponent discard (cCp24); PendingPromptOption.target.row optional; `getPromptMoves` selects target side by abilityId | yes (existing generic PromptPanel renders labelled buttons) | none — generic `PromptPanel` handles it | low (both discard piles already public) | yes — `legal-heuristic-v0` ranks by `targetStrength ?? 0`, deterministic moveId fallback | new `card_moved.reason "leader_restore_discard_to_hand"` (cCp22) and `card_moved.reason "leader_draw_opponent_discard_to_hand"` (cCp24) join event union; standard prompt rows | one-shot active w/ single-step prompt |
| 5. Look Three Cards | `target.kind === "none"` | none | n/a | UI overlay on opponent-hand backs | HIGH (first persistent reveal) | acting-seat only; redaction logic must be seat-aware | new reveal sets in observations | one-shot active w/ persistent observation surface |
| 6. Leader Cancel | `target.kind === "none"` | none | n/a | leader display update | none directly; cross-cuts every passive | yes | new `seat.leaderCancelled` flag | one-shot active w/ persistent suppression flag |
| 7. Setup Draw Extra | none | none | n/a | none | none | yes | none beyond standard hand size | setup-time event |
| 8. Random Special Replay | `target.kind === "none"` | none (engine selects) | yes | none | low (own discard public) | yes | per-special replay rows | one-shot active w/ replay |
| 9. Optimize Agile Rows (IMPLEMENTED in cCp21) | `none` (auto) OR `board_row` (per tied row) | none | yes (cEp8 menu fits 1-3 rows) | none — `metadata.targetLabel` carries row name | none | yes | per-card move rows | one-shot active w/ instantaneous board mutation |
| 10. Shuffle Discards Into Decks (IMPLEMENTED in cCp23) | `target.kind === "none"` | none | yes | none | low (deck order hidden post-shuffle, but contents previously public) | yes — `legal-heuristic-v0` does not currently rank discard recycle, but the no-target move is unambiguous | new `card_moved.reason "leader_shuffle_into_deck"` and `deck_shuffled.reason "leader_shuffle_into_deck"` join event union; per-affected-seat moves + one `deck_shuffled` per affected seat | one-shot active w/ bulk state mutation; affected-decks-only |

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

**Members:** `double_spies` (IMPLEMENTED in cCp20),
`optimize_agile_rows` (IMPLEMENTED in cCp21),
`restore_discard_to_hand` (IMPLEMENTED in cCp22),
`shuffle_discards_into_decks` (IMPLEMENTED in cCp23),
`draw_opponent_discard` (IMPLEMENTED in cCp24),
`random_medic`.

**Status:** Five members (`double_spies` in cCp20,
`optimize_agile_rows` in cCp21, `restore_discard_to_hand` in cCp22,
`shuffle_discards_into_decks` in cCp23, `draw_opponent_discard` in
cCp24) are implemented; only `random_medic` remains. After cCp24, six
implemented passive leader records exist (King Bran + four cCp19
row-horn + cCp20 Treacherous), eleven implemented active executable
leader records exist (cCp14 weather + cCp16 row-Scorch × 2 + cCp7
clear-weather + cCp21 Hope of the Aen Seidhe + cCp22 Bringer of Death
+ cCp23 Crach an Craite + cCp24 The Relentless), and five leader
records remain placeholder.

**Why second (retained for context):**

- All members are one-shot actives or whole-match passives, no
  multi-stage prompts.
- Hidden-info risk is low or none.
- They reuse the existing `pendingPrompt` machinery (Patterns 4, 8) and
  the cEp8 leader-choice menu (Pattern 9), and the cCp20 passive (Pattern
  2) re-uses the cCp15 / cCp19 passive scoring-policy helper pattern.
- Each can be implemented in a focused cCp phase (≈ one phase per
  pattern).
- Testability is good: each leader has a deterministic test seed.

**Updated ordering inside Tranche 2 (post-cCp24):**

1. `double_spies` — IMPLEMENTED in cCp20 (whole-match passive).
2. `optimize_agile_rows` — IMPLEMENTED in cCp21 (active one-shot
   auto-place with tied-row choice).
3. `restore_discard_to_hand` — IMPLEMENTED in cCp22 (active one-shot
   single-step prompt over own discard).
4. `shuffle_discards_into_decks` — IMPLEMENTED in cCp23 (active
   one-shot bulk discard-to-deck recycle with affected-decks-only
   deterministic shuffle).
5. `draw_opponent_discard` — IMPLEMENTED in cCp24 (active one-shot
   single-step prompt over opponent discard, per settled §C-2 catalog
   wins).
6. `random_medic` — passive Medic mutation per settled §5.

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
   **Settled: auto-place to the highest-scoring common row; if tied,
   expose only the tied best rows as legal player choices** (refined
   in cCp21). The catalog "yields most strength" wording is preserved
   while the product-owner tie-break decision converts ties into a
   small set of legal `use_leader` moves. **Implemented in cCp21** as
   an active one-shot leader; see `docs/gwent-rules.md` §17.12f.
   **Note:** The companion §C-1 question (which Eredin owns the discard-restore effect)
   is reaffirmed by cCp22's `restore_discard_to_hand` implementation:
   *Eredin: Bringer of Death* owns it; *Eredin: Destroyer of Worlds*
   carries `discard_two_draw_one_from_deck`. See §17.12g.
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
- 2026-05-02 (cCp21): `optimize_agile_rows` (Francesca Findabair: Hope
  of the Aen Seidhe) promoted from `placeholder` to `implemented` as
  an **active one-shot leader** (Pattern 9). New pure helper
  `planOptimizeAgileRows(state, seatId, catalogCards, catalogLeaders)`
  in `src/game/core/leaderOptimizeAgile.ts` chooses one common
  destination row that yields the highest acting-seat score under the
  central `calculateScores` pipeline; auto-place when one row is
  uniquely best, expose tied best rows as legal `board_row` player
  choices otherwise. Pure no-op rows are not executable. Heroes and
  opponent-board-side cards are excluded as eligible cards.
  `getLeaderMove` emits `targetRequirement === "none"` (auto) or
  `targetRequirement === "agile_row_choice"` (choice) with readable
  `metadata.targetLabel` ("Close Combat" / "Ranged Combat" /
  "Siege Combat") so the cEp8 leader-choice menu renders without UI
  changes. `executeLeader` recomputes the plan, validates the target,
  moves all eligible cards in deterministic board order, emits
  `card_moved.reason === "leader_optimize_agile"` per moved card,
  emits `ability_resolved.moved` and `leader_used`, sets
  `seat.leaderUsed = true`, and hands off the turn. The official
  promotion manifest adds
  `scoiatael.francesca-findabair-hope-of-the-aen-seidhe` to
  `executableLeaderSourceIds` (now 8) and removes
  `optimize_agile_rows` from `placeholderLeaderAbilityIds` (now 8).
  Settled product decision §3 was refined from "auto-place" to
  "auto-place to the highest-scoring common row; if tied, expose only
  the tied best rows as legal player choices." After cCp21, eight
  leader records remain placeholder. See
  `audit/reports/2026-05-02-cCp21-report.md` for details.
- 2026-05-03 (cCp24): `draw_opponent_discard` (Emhyr var Emreis: The
  Relentless) promoted from `placeholder` to `implemented` as an
  **active one-shot leader** (Pattern 4 companion to cCp22). New pure
  helper `getOpponentDiscardDrawCandidates({ state, seatId,
  catalogCards })` in `src/game/core/leaderOpponentDiscardDraw.ts`
  collects every card currently in the **opponent's** discard pile
  whose catalog source resolves, in opponent discard order, skipping
  missing instances and missing catalog sources. Any card kind in
  opponent discard is eligible — units, heroes, specials, weather,
  side-deck-only / generated cards, and off-owner cards (acting-seat-
  owned cards physically in the opponent discard pile).
  `getLeaderMove` emits exactly one no-target `use_leader` move
  (`targetRequirement === "future_prompt"`,
  `targetCount === candidates.length`,
  `targetLabel === "opponent discard"`) when the opponent discard is
  non-empty; empty opponent discard emits no legal move (even if own
  discard has cards). `executeLeader` opens a `pendingPrompt`
  (`kind === "choose_card"`,
  `abilityId === "draw_opponent_discard"`, one option per candidate
  keyed `draw-opponent-discard:<cardId>` with label
  `"Draw <card name> from opponent discard"`) **without** consuming
  the leader; `currentTurn` stays on the acting seat while the prompt
  is pending. `getPromptMoves` selects opponent-side `card_instance`
  targets for `draw_opponent_discard` prompts while preserving cCp22
  restore prompts' own-side target shape and Medic prompts'
  row-bearing targets. `ChoosePromptOption` validates the chosen card
  is still in the opponent's discard pile (rejects with
  `EngineRuleError` if not — leader untouched), moves it from opponent
  discard to acting hand with the new `card_moved.reason ===
  "leader_draw_opponent_discard_to_hand"`, sets the chosen card's
  `controller` to the acting seat (leaving `owner` unchanged), emits
  `prompt_resolved`, `ability_resolved.drew_opponent_discard`,
  sets `seat.leaderUsed = true`, emits `leader_used`, clears the
  pending prompt, and hands off the turn. Drawn cards do **not**
  resolve their abilities — they enter hand and behave normally only
  if played later. The `card_moved.reason` event union grows to
  include `"leader_draw_opponent_discard_to_hand"`. The official
  promotion manifest adds
  `nilfgaard.emhyr-var-emreis-the-relentless` to
  `executableLeaderSourceIds` (now 11) and removes
  `draw_opponent_discard` from `placeholderLeaderAbilityIds` (now 5).
  Pattern 4 marked IMPLEMENTED for both members (cCp22 own-discard
  and cCp24 opponent-discard variants). Settled product decision
  §C-2 reaffirmed: catalog wins; the printed-rulebook deck-tutor
  wording is superseded. After cCp24, five leader records remain
  placeholder. See `audit/reports/2026-05-03-cCp24-report.md` for
  details.
- 2026-05-03 (cCp23): `shuffle_discards_into_decks` (Crach an Craite)
  promoted from `placeholder` to `implemented` as an **active one-shot
  leader** (Pattern 10). New pure helper
  `getDiscardRecyclePlan({ state })` in
  `src/game/core/leaderDiscardRecycle.ts` collects every non-empty
  discard pile in stable seat order (`seat_a` then `seat_b`), preserves
  discard-insertion order inside each seat plan, and skips stale
  missing-card entries. `getLeaderMove` emits exactly one no-target
  `use_leader` move (`targetRequirement === "none"`,
  `targetCount === plan.totalCardCount`,
  `targetLabel === "discard piles"`) when at least one discard pile is
  non-empty; both-empty discards emit no legal move (per settled
  product decision §10). `executeLeader` rejects any non-`none` target,
  rejects empty plans, and processes affected seats through a single
  `SeededRng` instance from `state.rng.seed` / `state.rng.state`. For
  each affected seat: every recycled card moves from discard to deck
  with `card_moved.reason === "leader_shuffle_into_deck"`, the moved
  card's `controller` is reset to the destination deck seat (with
  `owner` unchanged), then `shuffleWithRng` shuffles the seat's full
  deck and `deck_shuffled.reason === "leader_shuffle_into_deck"` is
  emitted. Empty-discard seats are not shuffled (no hidden no-op
  mutation) and emit no `deck_shuffled`. After all affected shuffles,
  `state.rng.state` is updated to the RNG's final state. The transaction
  emits `ability_resolved` with `outcome === "shuffled_discards"`,
  `leader_used`, sets `seat.leaderUsed = true`, and hands off the turn.
  Recycled cards do **not** resolve their abilities — they behave
  normally only if drawn and played later. Off-owner discard cards
  (Spies discarded after round cleanup on the opposite board side)
  recycle into the discard-pile seat's deck, not the original owner's
  deck. Removed-from-game, side deck, hand, board, row horn, weather
  zone, and leader zone are not touched. The `card_moved.reason` and
  `deck_shuffled.reason` event unions grow to include
  `"leader_shuffle_into_deck"`. The official promotion manifest adds
  `skellige.crach-an-craite` to `executableLeaderSourceIds` (now 10)
  and removes `shuffle_discards_into_decks` from
  `placeholderLeaderAbilityIds` (now 6). Pattern 10 marked IMPLEMENTED.
  After cCp23, six leader records remain placeholder. See
  `audit/reports/2026-05-03-cCp23-report.md` for details.
- 2026-05-02 (cCp22): `restore_discard_to_hand` (Eredin: Bringer of
  Death) promoted from `placeholder` to `implemented` as an **active
  one-shot leader** (Pattern 4). New pure helper
  `getRestoreDiscardCandidates({ state, seatId, catalogCards })` in
  `src/game/core/leaderDiscardRestore.ts` collects the acting seat's
  own-discard cards in discard order, skipping missing instances /
  missing catalog sources. Any card kind in own discard is eligible —
  units, heroes, specials, weather, and side-deck-only / generated
  cards that physically reach discard. `getLeaderMove` emits exactly
  one no-target `use_leader` move (`targetRequirement ===
  "future_prompt"`, `targetCount === candidates.length`,
  `targetLabel === "own discard"`) when the discard is non-empty;
  empty discard emits no legal move. `executeLeader` opens a
  `pendingPrompt` (`kind === "choose_card"`,
  `abilityId === "restore_discard_to_hand"`, one option per candidate)
  without consuming the leader; `currentTurn` stays on the acting seat
  while the prompt is pending. `ChoosePromptOption` validates the
  chosen card is still in the acting seat's discard pile, moves it
  from discard to hand with the new `card_moved.reason ===
  "leader_restore_discard_to_hand"`, sets the restored card's
  `controller` to the acting seat (leaving `owner` unchanged), emits
  `prompt_resolved`, `ability_resolved.restored_card`,
  sets `seat.leaderUsed = true`, emits `leader_used`, clears the
  pending prompt, and hands off the turn. Restored cards do **not**
  resolve their abilities — they return to hand and behave normally
  only if played later. `PendingPromptOption.target.row` is now
  optional; Medic continues to set `row`, the new restore prompt
  omits it. The existing generic `PromptPanel` renders the
  `choose_card` options as plain labelled buttons; no new UI layout
  was needed. The official promotion manifest adds
  `monsters.eredin-bringer-of-death` to `executableLeaderSourceIds`
  (now 9) and removes `restore_discard_to_hand` from
  `placeholderLeaderAbilityIds` (now 7). Settled product decision §C-1
  is reaffirmed: Eredin: Bringer of Death owns the discard-restore
  effect (catalog wins the §16 conflict). After cCp22, seven leader
  records remain placeholder. See
  `audit/reports/2026-05-02-cCp22-report.md` for details.
