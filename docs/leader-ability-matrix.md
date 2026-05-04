# Leader Ability Matrix

This document is the durable cCp18 audit output, refreshed by cCp19
through cCp29. It enumerates every official leader source record,
classifies the (now zero) placeholder leaders by implementation pattern,
lists local-source conflicts, and records engine, legal-move, prompt /
UI, hidden-info, AI, and simulation implications. cCp19+ implementation
specs should pull from this matrix rather than re-running the audit.

**Matrix complete: as of cCp29 every official leader ability has
implemented engine semantics.** cCp19 implemented Tranche 1 (row-wide
horn-like passives), cCp20-cCp25 closed Tranche 2 (mixed active +
passive leaders), cCp26-cCp27 closed Tranche 3 (setup-time event +
multi-stage prompt), and cCp28-cCp29 closed Tranche 4 (hidden-info
disclosure + reaction/current-round suppression). cCp29 implements
`cancel_leader` (Pattern 6) on Emhyr var Emreis: The White Flame as a
**reaction / current-round suppression** leader (Settled Product
Decision §8), completing the official leader matrix.

## Status

- Catalog leader source count: **22** (5 Northern Realms / 5 Nilfgaard /
  5 Monsters / 5 Scoia'tael / 2 Skellige).
- Leader ability IDs registered in `src/game/catalog/constants.ts`: **21**.
  All 21 are reachable through one of the 22 catalog leader records.
  `double_close` is the only leader ability ID shared by more than one leader
  record (Eredin: Commander of the Red Riders and Francesca: Queen of Dol
  Blathanna). `clear_weather` is both a card and leader ability ID, but only
  Foltest: Lord Commander of The North uses it as a leader.
- Implemented executable leaders: **14** after cCp29 (each emits a legal
  `use_leader` move): `clear_weather`, `play_frost`, `play_fog`,
  `play_rain`, `play_any_weather`, `scorch_range`, `scorch_siege`,
  `optimize_agile_rows`, `restore_discard_to_hand`,
  `shuffle_discards_into_decks`, `draw_opponent_discard`,
  `discard_two_draw_one_from_deck`, `look_three_cards`,
  `cancel_leader`. (cCp29 added Emhyr var Emreis: The White Flame
  with reaction / current-round suppression.)
- Implemented passive leaders: **7** after cCp25 (unchanged through
  cCp29) — `weather_half_penalty` on King Bran (cCp15), the four cCp19
  row-wide horn-like passives (`double_siege` on Foltest: The
  Siegemaster, `double_close` on Eredin: Commander of the Red Riders
  and Francesca: Queen of Dol Blathanna, and `double_ranged` on
  Francesca: The Beautiful), `double_spies` on Eredin Breacc Glas: The
  Treacherous (cCp20), and `random_medic` on Emhyr var Emreis: Invader
  of the North (cCp25).
- Implemented setup-time leaders: **1** after cCp26 (unchanged through
  cCp29) — `draw_extra_card` on Francesca Findabair: Daisy of the
  Valley (cCp26). This is a manifest bucket distinct from passive
  scoring policies; the leader's effect fires during `startMatch`
  initial draw rather than during play.
- Placeholder leader records: **0** after cCp29. (cCp29 promoted the
  final placeholder leader record — Emhyr var Emreis: The White Flame
  — and the final placeholder ability ID — `cancel_leader` — out of
  placeholder, completing Tranche 4 and the entire official leader
  matrix.)
- `OfficialLeaderPromotionManifest.placeholderLeaderAbilityIds` is now
  the empty list after cCp29 — every official leader ability has
  implemented engine semantics. (See Source Conflicts §C-7 for the
  cCp18 audit finding that originally tracked this set.)

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
| `nilfgaard.emhyr-var-emreis-the-white-flame` | Emhyr var Emreis: The White Flame | Nilfgaard | `cancel_leader` | `none` (proactive) **or** opens a `choose_option` reaction prompt before an opponent active leader resolves | cCp29. Active one-shot reaction / current-round suppression. Proactive: emits one no-target `use_leader` move on the seat's own turn when the opponent has a cancellable current-round leader effect (active unused or implemented passive); sets the opponent's `seat.leaderCancelledRound = state.round`, consumes White Flame, does not consume the opponent leader. Reactive: when the opponent attempts a non-`cancel_leader` active leader, the engine opens a White Flame reaction prompt before the attempted leader resolves; cancel option consumes both leaders and applies suppression (no refund), decline option resolves the attempted leader exactly once and leaves White Flame available. Suppression is current-round only and clears at round transition. White Flame cannot be used to cancel another White Flame (no recursive reaction window). Settles cCp18 Settled Product Decision §8. |

### Implemented passive leaders (no `use_leader` move)

| Source ID | Name | Faction | Ability | Effect surface | Notes |
|---|---|---|---|---|---|
| `skellige.king-bran` | King Bran | Skellige | `weather_half_penalty` | scoring pipeline | cCp15. Derived from leader identity through `getWeatherPolicyBySeat`; never sets `seat.leaderUsed` and never emits `leader_used`. |
| `northern-realms.foltest-the-siegemaster` | Foltest: The Siegemaster | Northern Realms | `double_siege` | scoring pipeline | cCp19. Derived from leader identity through `getRowHornPolicyBySeat`; doubles non-hero units on the friendly siege row at the horn stage; suppressed by any Commander's Horn on that row; never sets `seat.leaderUsed` and never emits `leader_used`. |
| `monsters.eredin-commander-of-the-red-riders` | Eredin: Commander of the Red Riders | Monsters | `double_close` | scoring pipeline | cCp19. Same shape as `double_siege` but on the friendly close row. |
| `scoiatael.francesca-findabair-queen-of-dol-blathanna` | Francesca Findabair: Queen of Dol Blathanna | Scoia'tael | `double_close` | scoring pipeline | cCp19. Shares the `double_close` policy with Eredin: Commander of the Red Riders. Selection is by leader identity, not faction. |
| `scoiatael.francesca-findabair-the-beautiful` | Francesca Findabair: The Beautiful | Scoia'tael | `double_ranged` | scoring pipeline | cCp19. Same shape as `double_siege` but on the friendly ranged row. |
| `monsters.eredin-breacc-glas-the-treacherous` | Eredin Breacc Glas: The Treacherous | Monsters | `double_spies` | scoring pipeline | cCp20. Derived from leader identity through `getDoubleSpiesPolicyBySeat`; whole-match passive that applies a ×2 multiplier to every battlefield non-hero Spy unit, on both board sides and all rows, regardless of owner or controller. Heroes remain immune. The multiplier does not stack ×4 if both seats somehow have the policy. The score breakdown's `modifiers` list carries `"leader_double_spies"` when the multiplier applies. Never sets `seat.leaderUsed` and never emits `leader_used`. |
| `nilfgaard.emhyr-var-emreis-invader-of-the-north` | Emhyr var Emreis: Invader of the North | Nilfgaard | `random_medic` | Medic resolution path | cCp25. Whole-match passive Medic mutation derived from leader identity through `hasRandomMedicPolicyForSeat`. While this leader is the seat's leader, every non-hero Medic source controlled by that seat revives a **random eligible non-hero Unit** from the seat's own discard (uniform over candidate cards through the engine's seeded RNG; deterministic row fallback `close → ranged → siege` for multi-row targets) instead of opening a player-choice Medic prompt. Spy placement still flips to the opponent board side and resolves Spy draw; `controller` becomes the acting seat with `owner` preserved. **Hero Medic sources are unaffected** and continue to use the normal Medic prompt. The leader emits no `use_leader` move and never sets `seat.leaderUsed`. Settles the cCp18 §C-3 conflict in favor of the Medic-mutation reading. |

### Implemented setup-time leaders (no `use_leader` move; effect fires during `startMatch`)

| Source ID | Name | Faction | Ability | Effect surface | Notes |
|---|---|---|---|---|---|
| `scoiatael.francesca-findabair-daisy-of-the-valley` | Francesca Findabair: Daisy of the Valley | Scoia'tael | `draw_extra_card` | `startMatch` initial draw | cCp26. Setup-time hand-size modifier derived from leader identity through the new pure helper `getInitialHandDrawCountForLeader` in `src/game/core/leaderSetup.ts`. The seat draws 11 initial cards (top of the seeded-RNG-shuffled deck) instead of 10 before mulligan opens. Mulligan budget is unchanged at two redraws. The leader emits no `use_leader` move, never sets `seat.leaderUsed`, and never emits `leader_used`. Distinct manifest bucket from passive scoring policies (`implementedSetupLeaderSourceIds`). |

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
| Ability metadata status | `implemented` (cCp27) |
| Catalog description | "Discard 2 cards, then draw 1 card from your deck." |
| Local rule / source text | Catalog text + `docs/gwent-rules.md` §16 — see also Source Conflicts §C-1 (settled). |
| Implemented behavior (cCp27) | Active one-shot multi-stage prompt — the engine's first true two-stage prompt. The pure helper module `src/game/core/leaderDiscardDraw.ts` exports `getDiscardDrawEligibility`, `buildDiscardSelectionOptions`, and `buildDeckDrawOptions`. `getLeaderMove` emits exactly one no-target `use_leader` move when the acting seat has at least 1 card in hand and at least 1 card in deck (`target.kind === "none"`, `metadata.targetRequirement === "future_prompt"`, `metadata.targetCount === handCount + deckCount`, `metadata.targetLabel === "hand then deck"`, plus diagnostic `discardMin: 1`, `discardMax: 2`, `handCount`, `deckCount`). `executeLeader` clones state, emits `ability_triggered`, and opens stage 1: a `pendingPrompt` with `kind === "choose_card_set"`, `abilityId === "discard_two_draw_one_from_deck"`, `stage === "discard_selection"`, and `context: { minDiscardCount: 1, maxDiscardCount: 2 }`. Stage 1 options: every legal 1-card discard (option ID `discard-draw:discard:<cardId>`) followed by every legal 2-card combination (option ID `discard-draw:discard:<cardIdA>+<cardIdB>`) in deterministic acting-seat hand order. Stage 1 does **not** consume the leader (`seat.leaderUsed === false`, no `leader_used`, no turn handoff, no `card_moved` yet). `ChoosePromptOption` validates seat ownership, option legality, that the selection contains 1 or 2 unique cards, and that every selected card is still in the acting seat's hand. Stage 1 resolution moves each selected card from hand to acting discard with `card_moved.reason === "leader_discard_for_draw"`, sets each discarded card's `controller` to the acting seat (preserves `owner`), emits `prompt_resolved` for stage 1, and opens stage 2: a `pendingPrompt` with `kind === "choose_card"`, `stage === "deck_draw_selection"`, `context: { discardedCardIds }`, with one option per remaining acting-seat deck card in deck order (option ID `discard-draw:draw:<cardId>`). Discarded hand cards do **not** trigger Summon, Avenger, Medic, Spy, Scorch, weather, Muster, Berserker, Mardroeme, or any other battlefield discard effect. Stage 2 validates seat ownership, option legality, and that the chosen card is still in the acting seat's deck. Stage 2 resolution moves the chosen card from deck to acting hand with `card_moved.reason === "leader_draw_from_deck"`, sets `controller` to the acting seat (preserves `owner`), shuffles the remaining acting deck through `createSeededRngFromState(state.rng.seed, state.rng.state)` + `shuffleWithRng` (RNG advances only when remaining deck length ≥ 2; deck length 0 or 1 is a deterministic no-op), emits `deck_shuffled` with `reason === "leader_discard_draw"` (a distinct reason from cCp23's `"leader_shuffle_into_deck"`), `prompt_resolved`, `ability_resolved` with `outcome === "discarded_and_drew_card"`, sets `seat.leaderUsed = true`, emits `leader_used`, clears `state.pendingPrompt`, and hands off the turn through the existing `handoffTurn` helper. Drawn cards do **not** trigger their abilities — they enter hand and behave normally only if played later. |
| Active vs passive vs setup | Active one-shot multi-stage. |
| Implemented legal move shape | `use_leader` with `target.kind === "none"`, `metadata.targetRequirement === "future_prompt"`. Stage 1 prompt moves carry `target.kind === "card_instance_set"`, `side === "own"`, `cardIds: [cardIdA] | [cardIdA, cardIdB]`. Stage 2 prompt moves carry `target.kind === "deck_card_instance"`, `side === "own"`, `cardId`. `getPromptMoves` returns `[]` to the non-acting seat for both stages. |
| Implemented command transaction shape | `UseLeader { target: { kind: "none" } }` → reject if non-`none` target, empty hand, or empty deck → clone state → emit `ability_triggered` → open stage 1 prompt (`choose_card_set` / `discard_selection`) → return without `leader_used`, without `seat.leaderUsed`, without `card_moved`, and with `currentTurn` unchanged. Stage 1 `ChoosePromptOption` → validate seat / option / 1-or-2 unique cards / cards in hand → clone → move each from hand to acting discard (`reason === "leader_discard_for_draw"`) → emit `prompt_resolved` for stage 1 → open stage 2 prompt (`choose_card` / `deck_draw_selection`) → emit `prompt_opened` → return without leader consumption or handoff (partially resolved leader state). Stage 2 `ChoosePromptOption` → validate seat / option / card in deck → clone → move from deck to acting hand (`reason === "leader_draw_from_deck"`) → shuffle remaining deck (RNG advances iff length ≥ 2) → emit `deck_shuffled` (`reason === "leader_discard_draw"`) → emit `prompt_resolved` for stage 2 → emit `ability_resolved.discarded_and_drew_card` → set `seat.leaderUsed = true` → emit `leader_used` → clear `pendingPrompt` → handoff. |
| Prompt / choice UI need | The existing generic `PromptPanel` renders the labelled `choose_card_set` / `choose_card` options as buttons (e.g. `Discard <card>`, `Discard <card A> + <card B>`, `Draw <card> from deck`). Inspectable deck-card prompt tiles are deferred to a later Cluster E polish phase. |
| Hidden-info risk | Acting seat already sees its own hand and own deck through the engine; the leader does not introduce a new public disclosure. The two prompt stages are gated to the acting seat by `getPromptMoves` (returns `[]` for non-acting seat). AI observations from `buildSeatObservation` return `pendingPrompt: null` to the wrong seat. Simulation export observation surfaces the acting seat's own deck card to the acting perspective only, via a prompt-local safe ref `own_deck_option_<index>` so raw deck instance IDs never reach the safe export. |
| Implementation difficulty (delivered) | medium-high (delivered in cCp27). |
| Recommended tranche (implemented in cCp27) | Tranche 3 (Setup-Time Event and Multi-Step Prompt; completes the tranche). |
| Settled questions | (1) Is the deck draw chosen or blind? **Chosen.** (2) Are the two discards required? **No** — discard count is "up to two", with a minimum of one. Hand size 0 makes the leader unusable. Hand size 1 means the only legal stage 1 option is to discard that one card. (3) Does the leader still consume if no draw is possible (empty deck)? **No** — empty deck makes the leader unusable. (4) Does the discard interact with Skellige round-three return? **Yes, naturally.** Discarded hand cards land in the acting seat's discard pile through the normal `card_moved`/`reason === "leader_discard_for_draw"` event flow; if Skellige's round-three return §17.18 fires later, those cards are eligible candidates from discard. The discard step itself does not trigger any on-discard ability (no Summon, Avenger, Medic, Spy, Scorch, weather, Muster, Berserker, or Mardroeme). (5) Are drawn card abilities triggered? **No** — drawn cards return to hand and behave normally only if played later. (6) Leader consumption timing? **Only after stage 2 resolves** — opening stage 1 and resolving stage 1 do not set `seat.leaderUsed` or emit `leader_used`. (7) Remaining-deck shuffle? **Yes, after the draw**, through the engine's existing seeded RNG helpers; RNG advances only when remaining deck length ≥ 2. |

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
| Ability metadata status | `implemented` (cCp28) |
| Catalog description | (none on the leader source; catalog ability description rewritten in cCp28 to describe the one-time-modal contract.) |
| Local rule / source text | The Emperor's classic Witcher 3 leader text reads "Look at 3 random cards from your opponent's hand." This is opponent-hand information disclosure, not card movement. Settled product decision §6 (one-time modal, dismissal cannot be reopened) is the chosen interpretation. |
| Implemented behavior (cCp28) | **Active one-shot hidden-info disclosure leader.** Eligible only when the opponent has at least one card in hand (empty opponent hand emits no legal `use_leader` move). On `UseLeader` with `target.kind === "none"`, the engine selects up to three opponent hand cards (`min(3, opponent hand length)`) using the deterministic seeded RNG (advances RNG only when opponent hand length > 3; for hand length 1-3, the full hand is revealed without invoking RNG and `state.rng.state` is preserved). The transaction emits `ability_triggered`, `opponent_hand_revealed { seatId, opponentSeatId, cardIds, sourceIds, reason: "look_three_cards" }`, `ability_resolved` (`outcome === "revealed_opponent_hand"`), `leader_used`, and `prompt_opened`. The leader is consumed at `UseLeader` (`seat.leaderUsed = true`). The pending acknowledgement prompt blocks the turn until the acting seat dismisses it (`kind === "choose_option"`, `stage === "opponent_hand_reveal"`, single option `look-three-cards:acknowledge` with `target.kind === "none"`, `context.revealedCardIds` carries the chosen opponent hand card IDs). On acknowledgement, the resolver emits `prompt_resolved`, clears `state.pendingPrompt` (the only place the reveal snapshot lived), and the outer command path hands off the turn. **No MatchState field retains the reveal after acknowledgement.** Revealed cards are not moved out of the opponent's hand and do not trigger their abilities. All card kinds in opponent hand are eligible — units, heroes, specials, weather, side-deck-only / generated cards if they somehow reached hand, and off-owner cards. |
| Active vs passive vs setup | Active one-shot with one-time acknowledgement modal. |
| Implemented legal move shape | `target.kind === "none"`. Metadata: `targetRequirement === "none"`, `targetCount === revealCount`, `targetLabel === "opponent hand"`, plus diagnostic `opponentHandCount` and `revealCount`. |
| Implemented command transaction shape | `UseLeader { target: { kind: "none" } }` → recompute reveal plan from public state → advance RNG only if subset selection happened → emit `ability_triggered` → `opponent_hand_revealed` → `ability_resolved.revealed_opponent_hand` → set `seat.leaderUsed = true` → emit `leader_used` → open acknowledgement prompt (no turn handoff while prompt is pending). Acknowledgement: `ChoosePromptOption { promptId, optionId: "look-three-cards:acknowledge" }` → emit `prompt_resolved` → clear `state.pendingPrompt` → outer command hands off the turn. |
| Prompt / choice UI need | One-time acknowledgement modal for human-owned reveal prompts (`authentic-look-three-cards-dialog`). Shows the revealed cards once; after dismissal, the modal disappears and cannot be reopened. AI-owned reveal prompts must not show the human hand card faces; the existing AI prompt-pending copy applies. The normal opponent hand strip stays backs/count-only — no card becomes persistently face-up. |
| Hidden-info risk | HIGH. The acting seat sees the revealed cards inside the pending prompt's `context.revealedCardIds` snapshot only. The non-acting seat must keep `pendingPrompt: null` (covered by `getPromptMoves`, `seatObservation.buildSeatObservation`, and `buildSafeSimulationObservation`) and must not receive revealed names, source IDs, or instance IDs through UI, AI observation, recent activity, or simulation export. Simulation export uses prompt-local safe refs `revealed_opponent_hand_<index>` for the acting perspective only. Recent activity renders count-only summaries ("Human looked at 3 opponent hand cards"). |
| Implementation difficulty (delivered) | medium-high (hidden-info disclosure plus one-time modal UI). |
| Recommended tranche (implemented in cCp28) | Tranche 4 (Hidden-info / suppression). |
| Settled questions | (1) §C-9 / §C-5: The catalog ability ID `look_three_cards` is preserved; the catalog metadata description is rewritten to capture the one-time-modal contract. (2) Settled Product Decision §6: **one-time modal**, no persistent face-up opponent hand state after dismissal. (3) Settled Product Decision §7: **leaders fire in the play phase only**; `getLeaderMove` returns no move during mulligan. (4) Heroes eligible? **Yes** — the rule selects "cards" from the opponent hand without exclusion. (5) RNG advancement? **Only when opponent hand length > 3.** Hand length 1, 2, or 3 reveals every card in opponent hand order without invoking RNG. (6) After acknowledgement, can the reveal be reopened? **No** — the snapshot lives only in `pendingPrompt.context.revealedCardIds` and is cleared on resolution. |

### Emhyr var Emreis: The White Flame — `cancel_leader`

| Field | Value |
|---|---|
| Source ID | `nilfgaard.emhyr-var-emreis-the-white-flame` |
| Faction | Nilfgaard |
| Ability metadata status | `implemented` (cCp29) |
| Catalog description | (none on the leader source; catalog ability description rewritten in cCp29 to capture the reaction / current-round suppression contract.) |
| Local rule / source text | The classic Witcher 3 / Gwent text reads "Cancel your opponent's Leader ability." Settled Product Decision §8: cancellation is **current-round only**, **reaction or proactive**, and **does not refund** an attempted active leader. |
| Implemented behavior (cCp29) | **Active one-shot reaction / current-round suppression.** The acting seat owns Emhyr: The White Flame and may either (1) use it proactively on its own normal turn to lock out an opponent leader (active or passive) for the current round, or (2) react before an opponent active leader resolves to consume that leader without effect. Suppression is current-round-scoped via `seat.leaderCancelledRound = state.round` and clears at round transition. Suppressed seats emit no `use_leader` legal move; passive scoring/ability policies (`weather_half_penalty`, `double_close`, `double_ranged`, `double_siege`, `double_spies`, `random_medic`) recalculate immediately for the current round when suppressed. Setup-time `draw_extra_card` already happened and is not retroactively undone. The reaction prompt is `kind === "choose_option"`, `stage === "leader_cancel_reaction"`. White Flame cannot be used to cancel another White Flame (no recursive reaction window). The acting seat's leader is consumed in both modes; in proactive mode the opponent leader is *not* consumed, just locked out for the current round. |
| Active vs passive vs setup | **Active one-shot, with both proactive and reaction-prompt entry points.** |
| Implemented legal move shape | Proactive: `use_leader` with `target.kind === "none"`, `metadata.targetRequirement === "none"`, `metadata.targetSeatId === opponentSeat`, `metadata.targetSourceId === opponentLeaderSourceId`, `metadata.targetLabel === "opponent leader"`. Reactive: no `use_leader` move; the reaction prompt opens automatically when the opposing seat owns an unused, unsuppressed `cancel_leader` and a non-`cancel_leader` active leader is attempted. |
| Implemented command transaction shape | Proactive: `UseLeader { target: { kind: "none" } }` → reject if the gate fails → `ability_triggered` → set `state.seats[opponent].leaderCancelledRound = state.round` → `leader_cancelled { mode: "proactive", round, seatId, targetSeatId, targetLeaderCardId, targetLeaderSourceId, targetAbilityId }` → `ability_resolved { outcome: "leader_cancelled" }` → `leader_used` → `turn_set` (handoff). Reactive: opponent attempts a non-`cancel_leader` active `UseLeader` → engine clones state, opens `pendingPrompt` (`choose_option`, `stage: "leader_cancel_reaction"`, `seatId: whiteFlameSeat`, two options `cancel-leader:cancel` / `cancel-leader:decline` with `target.kind === "none"`, `context.leaderCancel: { mode: "reaction", targetSeatId, targetLeaderCardId, targetLeaderSourceId, targetAbilityId, target }`) → `prompt_opened` → no leader consumed, no handoff. Cancel option resolution: `prompt_resolved` → `ability_triggered` → set target `leaderCancelledRound = state.round` → `leader_cancelled { mode: "reaction", ... }` → `ability_resolved.leader_cancelled` → `leader_used` (White Flame) → `leader_used` (cancelled target) → `turn_set` (handoff from attempted leader seat). Decline option resolution: `prompt_resolved` → clear prompt → re-execute the attempted leader exactly once with the reaction gate bypassed (preserving the original target). |
| Prompt / choice UI need | Reaction prompt: rendered through the existing generic `PromptPanel` with two no-target options (`Cancel leader` / `Let it stand`); no new modal required. Score-card leader display: shows `cancelled this round` when `seat.leaderCancelledRound === match.round` (clears at round transition). Recent activity: count-only summary `<actor> cancelled <target> leader for round N`. |
| Hidden-info risk | None. Leader identity, leader-used status, and current-round suppression are all public. The reaction prompt's `context.leaderCancel.target` is replayed only inside the engine on decline; the safe export and AI observation surfaces expose only the `cancelledThisRound: boolean` flag, not the captured target. |
| Implementation difficulty (delivered) | medium-high (cross-cutting). Reuses existing prompt machinery; passive scoring helpers gain a single suppression check; `executeLeader` adds a reaction-prompt gate before per-leader branches and an internal `bypassCancelReaction` flag for the decline-replay path. |
| Recommended tranche (implemented in cCp29) | Tranche 4 (Hidden-info / suppression). |
| Settled questions | (1) Settled Product Decision §8: **reaction / current-round suppression**, with no refund on reaction cancel. (2) Setup-time `draw_extra_card` is not retroactively undone — the extra card already entered hand at `startMatch`. (3) Proactive use against an already-used active leader with no passive policy emits no legal move (nothing to suppress). (4) Cancel of cancel is forbidden — `cancel_leader` cannot open a nested reaction prompt against another `cancel_leader`. (5) AI heuristic chooses the cancel option when it owns the reaction prompt (deterministic). |

### Emhyr var Emreis: Invader of the North — `random_medic`

| Field | Value |
|---|---|
| Source ID | `nilfgaard.emhyr-var-emreis-invader-of-the-north` |
| Faction | Nilfgaard |
| Ability metadata status | `implemented` (cCp25, passive) |
| Catalog description | (none on the leader source; catalog ability description rewritten in cCp25 to describe the Medic-mutation contract.) |
| Local rule / source text | Classic Witcher 3 text says "Pick a random Special Card from your discard pile and play it instantly." Settled product decision §5: the catalog ID `random_medic` is **kept**, but the *behavior* is a passive Medic mutation, **not** a random Special replay. The printed Witcher 3 wording is superseded. |
| Implemented behavior (cCp25) | **Whole-match passive Medic mutation.** While this leader is the seat's leader, every non-hero Medic source controlled by that seat (`source.abilities.includes("medic") && source.kind !== "hero"`) revives a **random eligible non-hero Unit** from the seat's own discard pile (uniform over candidate cards through the engine's seeded RNG; deterministic row fallback `close → ranged → siege` for multi-row targets) instead of opening a player-choice `medic_revive` prompt. The candidate set is built from `state.seats[seatId].discard`: catalog source must resolve, `kind === "unit"`, `kind !== "hero"`, with at least one playable row. Specials, weather, hero cards, opponent discard, hands, decks, side decks, removed-from-game, board rows, row horns, weather zone, and stale missing-instance / missing-catalog-source entries are excluded. Side-deck-only / generated non-hero units and off-owner non-hero units physically in own discard are eligible (with `owner` preserved on placement and `controller` reset to the acting seat). Spy placement still flips to the opponent board side and resolves Spy draw. The chain recurses: a random-revived non-hero Medic re-runs the random policy until candidates are empty. **Hero Medic sources are unaffected** and continue to use the normal `medic_revive` prompt. The leader emits no `use_leader` legal move, never sets `seat.leaderUsed`, and never emits `leader_used`. RNG advances only on a real multi-candidate roll (zero or single candidate paths leave `state.rng.state` unchanged). New `ability_resolved` outcome `"random_revived_card"` distinguishes the random path from prompt-based `"revived_card"`; no `prompt_opened` / `prompt_resolved` events are emitted for the random path. |
| Active vs passive vs setup | **Passive whole-match Medic mutation** (settled product decision §5). |
| Implemented legal move shape | None. The leader emits no `use_leader` move. |
| Implemented command transaction shape | None. The mutation is wired into `resolveMedic` through the new `leaderRandomMedic` helper. |
| Prompt / choice UI need | None for the random path; hero Medic sources still open the existing `medic_revive` prompt. |
| Hidden-info risk | None. Own discard is public; the engine does not expose unchosen candidate IDs through the event log. |
| Implementation difficulty (delivered) | low-medium. Reuses the existing Medic placement helper and seeded RNG. |
| Recommended tranche (implemented in cCp25) | Tranche 2. |
| Settled questions | (1) §C-3: catalog ID retained; behavior is Medic mutation per settled product decision §5, not random Special replay. (2) Empty own discard is a no-op — Medic emits `no_targets` and does not advance RNG. (3) Decoy and Special replay are out of scope; only non-hero Unit cards are eligible. (4) Hero Medic sources are unaffected by the policy (Hero immunity, §17.1). |

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
| Ability metadata status | `implemented` (cCp26, setup-time) |
| Catalog description | "Draw 1 extra card at the start of the battle." |
| Local rule / source text | Classic Witcher 3 / Gwent text: "Draw 1 extra card at the beginning of the battle." Setup-time event, fires during `startMatch` initial draw before the mulligan window opens. |
| Implemented behavior (cCp26) | **Setup-time initial hand-size modifier.** During `startMatch`, the engine consults the new pure helper `getInitialHandDrawCountForLeader({ leaderSourceId, catalogLeaders })` exported from `src/game/core/leaderSetup.ts`. The helper looks up the leader by source ID and returns `BASE_INITIAL_HAND_SIZE + 1` (i.e. 11) only when the resolved leader's `ability` is `draw_extra_card`; otherwise it returns the base 10. Setup uses the helper-derived count to slice the seat's already-shuffled deck top: the affected seat draws 11 initial cards (the next deterministic card off the seeded-RNG-shuffled top) and the deck shrinks by 11. Mulligan budget is unchanged — `mulligansUsed` starts at 0 and the seat can redraw at most two cards through the existing one-card mulligan flow. The leader emits no `use_leader` move, never sets `seat.leaderUsed`, and never emits `leader_used`; manual `UseLeader` rejects through the existing unsupported-leader path without state mutation. The match phase remains `mulligan` after `startMatch`. The 11th card is never chosen by prompt, kind, faction, strength, row, or ability — it is whatever the deterministic shuffle put on top. Tiny test decks shorter than 11 cards do not throw solely because of `draw_extra_card`; the existing `slice` behavior draws the available cards. |
| Active vs passive vs setup | Setup-time event. |
| Implemented legal move shape | None. The leader emits no `use_leader` move at any phase. |
| Implemented command transaction shape | None at runtime. The effect is wired into `setup.ts` initial-draw computation through the new `leaderSetup` helper module. |
| Prompt / choice UI need | None. |
| Hidden-info risk | None. Hand-size disclosure is already part of the public observation surface; the engine does not introduce a new public observation, UI label, AI observation, recent-activity summary, or simulation export field. |
| Implementation difficulty | low (delivered in cCp26). |
| Recommended tranche (implemented in cCp26) | Tranche 3 (Setup-Time Event and Multi-Step Prompt). |
| Settled questions | (1) Extra card source: **deck top** through the existing seeded RNG shuffle. No prompt and no chosen-card path. (2) Mulligan budget: **unchanged at 2 redraws** regardless of hand size. (3) No new event types, no UI prompt machinery, and no AI heuristic change required. (4) Manifest classification is **`implementedSetupLeaderSourceIds`**, a new bucket distinct from passive scoring policies and active executable leaders. |

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

### Pattern 3 — Deck Tutor / Discard Cost (multi-step prompt) — `discard_two_draw_one_from_deck` IMPLEMENTED in cCp27

| Members | Ability IDs | Status |
|---|---|---|
| Eredin: Destroyer of Worlds | `discard_two_draw_one_from_deck` | implemented (cCp27) |

- Trigger: active one-shot multi-stage prompt — the engine's first true
  two-stage prompt.
- Implemented contract (cCp27): discard one or two hand cards (chosen
  by the acting seat), then choose one deck card to draw, then shuffle
  the remaining acting deck through the seeded RNG. Settles the cCp18
  product decisions for this leader: chosen-discard plus chosen-draw;
  discard count is 1-or-2 (minimum 1, hand size 0 makes the leader
  unusable); empty deck makes the leader unusable; the leader is
  consumed only after the deck draw and shuffle complete.
- Engine surfaces:
  - new `PendingPrompt.kind === "choose_card_set"` for stage 1 with
    `target.kind === "card_instance_set"` and 1-or-2 acting-seat hand
    `cardIds`.
  - new `PendingPrompt.stage === "discard_selection" | "deck_draw_selection"`
    discriminator and an optional `context.discardedCardIds` payload
    that stage 2 carries from stage 1.
  - new prompt-option `target.kind === "deck_card_instance"` for
    stage 2, with `cardId` referring to the acting seat's deck zone.
  - new `card_moved.reason "leader_discard_for_draw"` (stage 1
    movement) and `"leader_draw_from_deck"` (stage 2 movement).
  - new `deck_shuffled.reason "leader_discard_draw"` (distinct from
    cCp23's `"leader_shuffle_into_deck"`).
  - new `ability_resolved.outcome === "discarded_and_drew_card"`.
  - extended `LegalMoveTarget` with `card_instance_set` and
    `deck_card_instance` variants (acting-seat-only, side `"own"`).
  - `getPromptMoves` returns `[]` for the non-acting seat for both
    stages.
- Legal-move shape: one no-target `use_leader` move opens stage 1.
  Stage 1 prompt moves are `choose_prompt_option` with
  `target.kind === "card_instance_set"`. Stage 2 prompt moves are
  `choose_prompt_option` with `target.kind === "deck_card_instance"`.
- Command shape: `UseLeader { target: { kind: "none" } }` opens stage 1
  without consuming the leader. `ChoosePromptOption` for stage 1
  validates 1-or-2 unique acting-hand cards and resolves into stage 2
  without consuming the leader. `ChoosePromptOption` for stage 2
  validates the chosen deck card is still in the acting deck and
  resolves into draw + shuffle, finalizing leader consumption and
  handing off the turn.
- Prompt / UI: the existing generic `PromptPanel` renders the labelled
  options as buttons (e.g. `Discard <card>`, `Discard <card A> + <card B>`,
  `Draw <card> from deck`); no new modal or card-tile UI was added in
  cCp27. Inspectable deck-card prompt tiles are deferred to a later
  Cluster E polish phase.
- Hidden-info risk: low. The acting seat already sees its own hand and
  own deck through the engine. Both stages are gated to the acting
  seat by `getPromptMoves`. AI observations from `buildSeatObservation`
  return `pendingPrompt: null` to the wrong seat. Simulation export
  surfaces the acting seat's own deck card to the acting perspective
  only, via a prompt-local safe ref `own_deck_option_<index>` so raw
  deck instance IDs never appear in the safe export.
- AI: the existing `legal-heuristic-v0` policy ranks
  `choose_prompt_option` moves by `option.targetStrength ?? 0` with a
  deterministic moveId fallback. `seatObservation` exposes per-option
  `targetStrength` for stage 1 (sum of selected hand-card strengths)
  and stage 2 (chosen deck card's catalog strength), so the heuristic
  still picks an option deterministically without strategic timing
  for the leader itself.
- Simulation export: stage-1 prompt rows expose only labels and
  aggregate `targetStrength`; stage-2 prompt rows expose the safe
  own-deck ref described above. No raw card instance IDs are
  exported. Validation continues to reject raw IDs through the
  existing redaction scanner.
- Effect classification: one-shot active with two-stage prompt chain.
- Partially resolved leader state: between stage 1 and stage 2, the
  selected hand cards are already in discard, `pendingPrompt` points
  at stage 2, and `currentTurn` remains on the acting seat with
  `seat.leaderUsed === false`. Tests cover this state explicitly.

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

### Pattern 5 — Opponent Hand Information Disclosure (IMPLEMENTED in cCp28)

| Members | Ability IDs |
|---|---|
| Emhyr: Emperor of Nilfgaard | **IMPLEMENTED in cCp28** — `look_three_cards` |

**Status:** `look_three_cards` implemented in cCp28 (see
`audit/reports/2026-05-04-cCp28-report.md`) as the engine's first
**hidden-info disclosure leader**. cCp28 opens Tranche 4. Settled
Product Decisions §6 (one-time modal; cannot be reopened after
dismissal) and §7 (play-phase only) are now both satisfied.

- Trigger: active one-shot.
- Effect: reveals up to 3 random opponent hand cards
  (`min(3, opponent hand length)`) to the acting seat once. After
  acknowledgement the reveal cannot be reopened — the engine does
  **not** persist the reveal in `MatchState` after the prompt clears.
- Engine surfaces:
  - new pure helper module `src/game/core/leaderLookThreeCards.ts`
    exporting `LOOK_THREE_CARDS_LEADER_SOURCE_ID`,
    `LOOK_THREE_CARDS_REVEAL_COUNT`,
    `getLookThreeCardsEligibility`, and `planLookThreeCardsReveal`.
  - `getLeaderMove` emits exactly one no-target `use_leader` move
    when opponent hand length ≥ 1 (`targetRequirement: "none"`,
    `targetCount: revealCount`, `targetLabel: "opponent hand"`,
    diagnostic `opponentHandCount` / `revealCount`).
  - `executeLeader` selects up to 3 opponent hand cards through
    `createSeededRngFromState(state.rng.seed, state.rng.state)` plus
    `shuffleWithRng`, advancing `state.rng.state` only when the
    opponent has more than 3 cards. The transaction emits
    `ability_triggered`, `opponent_hand_revealed { reason:
    "look_three_cards" }`, `ability_resolved.revealed_opponent_hand`,
    `leader_used`, and `prompt_opened`.
  - `pendingPrompt` carries the reveal snapshot in
    `context.revealedCardIds` while the acknowledgement is open.
    `kind === "choose_option"`, `stage === "opponent_hand_reveal"`,
    one option `look-three-cards:acknowledge` with
    `target.kind === "none"`.
  - acknowledgement (`ChoosePromptOption`) emits `prompt_resolved`,
    clears `state.pendingPrompt`, and lets `handoffTurn` transfer
    the turn. The leader was already consumed at `UseLeader`.
  - new `GameEvent` variant `opponent_hand_revealed` (internal/raw
    event log only — hidden-info-safe summaries render counts only).
  - new `PendingPromptTarget` variant `{ kind: "none" }` for the
    acknowledgement option.
  - new `PendingPromptStage` value `"opponent_hand_reveal"`.
  - new `PendingPromptContext.revealedCardIds` field.
- Legal-move shape: `use_leader` with `target.kind === "none"`. Emit
  only if opponent hand length ≥ 1.
- Command shape: `UseLeader { target: { kind: "none" } }` → seeded
  random pick (RNG advances only for hand length > 3) → emit reveal
  events → consume leader → open acknowledgement prompt. No turn
  handoff while prompt is pending.
- Prompt / UI: one-time modal (`authentic-look-three-cards-dialog`)
  for human-owned reveal prompts. Shows the revealed cards via
  existing `AuthenticCard` components, single primary `Continue`
  button. After dismissal the modal disappears and cannot be
  reopened from any visible control. AI-owned reveal prompts use the
  existing AI prompt-pending copy and never expose the human hand
  faces. The normal opponent hand strip stays backs/count-only.
- Hidden-info risk: addressed. The acting seat sees the revealed
  cards through `pendingPrompt.context.revealedCardIds` only while
  the prompt is open. The non-acting seat receives `pendingPrompt:
  null` from `seatObservation.buildSeatObservation` and
  `buildSafeSimulationObservation`, so revealed names, source IDs,
  and instance IDs cannot leak. Recent activity / event summaries
  render counts only.
- AI: `legal-heuristic-v0` is unchanged. The acting seat's
  observation gains `revealedCards` on the prompt summary so a
  future heuristic can value the disclosure; the heuristic chooses
  the only acknowledgement option through the existing prompt-move
  selection path.
- Simulation export: `SafePromptState.revealedCards` exposes
  `revealed_opponent_hand_<index>` safe refs for the acting
  perspective only. Action encoding falls back to `none` for the
  acknowledgement target. Validation/redaction scanning continues to
  block raw `seat_a:*` / `seat_b:*` instance IDs and hidden opponent
  hand identities outside the acting-seat reveal.
- Effect classification: one-shot active with one-time acknowledgement
  modal; no persistent observation state.

### Pattern 6 — Leader Cancel / Suppression (IMPLEMENTED in cCp29)

| Members | Ability IDs |
|---|---|
| Emhyr: The White Flame | **IMPLEMENTED in cCp29** — `cancel_leader` |

**Status:** `cancel_leader` implemented in cCp29 (see
`audit/reports/2026-05-04-cCp29-report.md`) as the engine's first
**reaction / current-round suppression** leader. cCp29 closes
Tranche 4. Settled Product Decision §8 (reaction / current-round
suppression, no refund) is now satisfied.

- Trigger: active one-shot, both proactive (own turn) and reactive
  (before an opponent active leader resolves).
- Effect: suppresses the opponent's leader (active or passive) for the
  current round only. Suppression clears at round transition. The
  cancel acting leader is consumed in both modes; in proactive mode the
  opponent leader is **not** consumed (just locked out for the current
  round); in reaction mode the opponent leader **is** consumed with no
  refund.
- Engine surfaces:
  - new `seat.leaderCancelledRound: number | null` field — set to
    `state.round` when the seat's leader is suppressed, cleared at round
    transition.
  - new pure helper module `src/game/core/leaderCancel.ts` exporting
    `CANCEL_LEADER_SOURCE_ID`, `isLeaderSuppressedThisRound`,
    `getLeaderCancelStatus`, `canUseCancelLeaderProactively`, and
    `canOpenCancelLeaderReaction`.
  - `getLeaderMove` returns `[]` for the suppressed seat regardless of
    ability (active leaders).
  - passive scoring derivations (`getWeatherPolicyBySeat`,
    `getRowHornPolicyBySeat`, `getDoubleSpiesPolicyBySeat`) and the
    Medic-mutation policy (`hasRandomMedicPolicyForSeat`) check
    `isLeaderSuppressedThisRound` before applying.
  - new `leader_cancelled { mode: "proactive" | "reaction", round,
    seatId, targetSeatId, targetLeaderCardId, targetLeaderSourceId,
    targetAbilityId }` event covering both proactive and reaction
    paths.
  - new `PendingPromptStage` value `"leader_cancel_reaction"` and new
    `PendingPromptContext.leaderCancel` field carrying the attempted
    leader's identity + original target for the decline-replay path.
- Legal-move shape: proactive `use_leader` with `target.kind === "none"`,
  emitted only when the seat owns an unused, unsuppressed
  `cancel_leader` and the opponent has a cancellable current-round
  leader effect. Reactive prompt opens automatically through the
  engine's reaction gate inside `executeLeader`.
- Command shape: proactive `UseLeader` → set
  `state.seats[opponent].leaderCancelledRound = state.round` →
  consume White Flame → emit events → handoff. Reactive opens a
  `choose_option` prompt with two no-target options
  (`cancel-leader:cancel`, `cancel-leader:decline`); cancel resolves
  through the same suppression path plus consuming both leaders;
  decline replays the attempted leader exactly once with the reaction
  gate bypassed.
- Prompt / UI: reaction prompt renders through the existing generic
  `PromptPanel` with two no-target options. Score-card leader display
  shows `cancelled this round` when `seat.leaderCancelledRound ===
  match.round`. Recent activity renders count-only summary:
  `<actor> cancelled <target> leader for round N`.
- Hidden-info risk: none. Leader identity and leader-used status are
  public; the cancel suppression flag (`cancelledThisRound: boolean`)
  is added to AI seat observation and safe simulation export.
- AI: `legal-heuristic-v0` chooses the cancel option deterministically
  when it owns a `cancel_leader` reaction prompt. Proactive AI use is
  bounded — the existing heuristic (`isUsefulLeaderMove`) only fires on
  `clear_weather`, so the AI does not call `cancel_leader` proactively
  in practice; the reaction-prompt path is the primary AI surface.
- Simulation export: `cancelledThisRound: boolean` added to
  `SafeSeatPrivatePublicState.leader` and `SafeOpponentPublicState.leader`.
  Action encoding for the no-target reaction options falls through the
  existing `none` branch.
- Effect classification: one-shot active with both proactive and
  reaction-prompt entry, flipping a current-round-scoped suppression
  flag that clears at round transition.

### Pattern 7 — Setup-Time Hand-Size Modifier (IMPLEMENTED in cCp26)

| Members | Ability IDs |
|---|---|
| Francesca: Daisy of the Valley | **IMPLEMENTED in cCp26** — `draw_extra_card` |

**Status:** `draw_extra_card` implemented in cCp26 (see
`audit/reports/2026-05-03-cCp26-report.md`) as a **setup-time initial
hand-size modifier**. cCp26 opens Tranche 3.

- Trigger: setup-time event during `startMatch` initial draw.
- Effect: the affected seat draws 11 cards instead of 10 before
  mulligan opens. The mulligan budget is unchanged at two redraws.
- Engine surfaces:
  - new pure helper module `src/game/core/leaderSetup.ts` exporting
    `DRAW_EXTRA_CARD_LEADER_SOURCE_ID`, `BASE_INITIAL_HAND_SIZE`, and
    `getInitialHandDrawCountForLeader({ leaderSourceId,
    catalogLeaders, baseDrawCount? })`. The helper looks up the
    leader by source ID and returns `baseDrawCount + 1` only when
    the resolved leader's `ability` is `draw_extra_card`; otherwise
    it returns the base count. Missing catalog entries, other
    abilities, or any inconsistent input fall back to the base.
  - `src/game/core/setup.ts` replaces the hard-coded `10` with the
    helper-derived per-seat draw count and keeps the rest of the
    setup pipeline unchanged (instantiate → shuffle → slice with the
    helper count → emit `card_moved.reason === "initial_draw"` per
    drawn card → emit `initial_hand_drawn` → roll initial turn → set
    phase to `mulligan`).
- Legal-move shape: none. The leader emits no `use_leader` move at
  any phase.
- Command shape: none. The setup helper runs once at `startMatch`;
  manual `UseLeader` rejects through the existing unsupported-leader
  path without state mutation.
- Prompt / UI: none. Mulligan UI naturally renders 11 cards plus the
  existing keep-hand and one-card mulligan options (1 + 11 = 12 legal
  mulligan moves on the first tick).
- Hidden-info risk: none. Hand-size disclosure is already part of the
  public observation surface; the engine does not introduce a new
  public observation, UI label, AI observation, recent-activity
  summary, or simulation export field.
- AI: no change. `legal-heuristic-v0` consumes the 11-card hand
  through the existing legal-move generator without code change.
- Simulation export: hand sizes already exposed in observations; one
  extra hand entry is invisible to the schema. No new event types.
- Effect classification: setup-time event. New manifest bucket
  `implementedSetupLeaderSourceIds` (1 entry: Daisy of the Valley)
  records this distinctly from passive scoring policies and active
  executable leaders.

### Pattern 8 — Passive Random Medic Mutation (IMPLEMENTED in cCp25)

| Members | Ability IDs |
|---|---|
| Emhyr: Invader of the North | **IMPLEMENTED in cCp25** — `random_medic` |

**Status:** `random_medic` implemented in cCp25 (see
`audit/reports/2026-05-03-cCp25-report.md`) as a **whole-match passive
Medic mutation**, settling cCp18 §C-3 and cCp18 settled product decision
§5 in favor of the Medic-mutation reading. The earlier "random Special
replay from discard" reading is historical context only.

- Trigger: passive ongoing modifier; derived from leader source identity
  through `hasRandomMedicPolicyForSeat` (mirrors the cCp15 King Bran /
  cCp19 row-horn / cCp20 `double_spies` passive pattern).
- Effect: while this leader is the seat's leader, every non-hero Medic
  source controlled by that seat revives a random eligible non-hero
  Unit from the seat's own discard, uniform over candidate cards
  through the engine's seeded RNG. Hero Medic sources are unaffected
  and keep the normal player-choice prompt. The chain recurses for
  random-revived non-hero Medics until the candidate set is empty.
- Engine surfaces:
  - new pure helper module `src/game/core/leaderRandomMedic.ts`
    exporting `hasRandomMedicPolicyForSeat`, `getRandomMedicCandidates`,
    and `chooseRandomMedicCandidate`. Helpers read only state, seat,
    and catalog data; they have no side effects beyond the explicit
    chooser writeback.
  - `resolveMedic` (in `src/game/core/abilities.ts`) checks
    `hasRandomMedicPolicyForSeat` for non-hero Medic sources and, when
    the policy applies, builds the candidate set, picks a candidate
    (advancing `state.rng.state` only on a multi-candidate roll), and
    routes through a shared internal `placeMedicRevival` helper that
    handles Spy placement, controller reset, `card_played`, the Medic
    `ability_resolved` event, child ability resolution via
    `resolveCardAbilities`, and `settleMardroemeRow`. The same
    `placeMedicRevival` helper is reused by the prompt-based
    `medic_revive` resolution path so the two flows cannot diverge.
- Legal-move shape: none. The leader emits no `use_leader` move.
- Command shape: none. The mutation lives in the Medic resolution
  path; manual `UseLeader` rejects through the existing
  unsupported-leader path without state mutation.
- Prompt / UI: random Medic emits no `prompt_opened` /
  `prompt_resolved`. Hero Medic sources still open the existing
  `medic_revive` prompt.
- Hidden-info risk: none. Own discard is already public, and the event
  log only reveals the actually revived public card.
- AI: heuristic policy does not need to choose; the engine picks.
  Heuristic still values firing the Medic source itself (no change to
  `legal-heuristic-v0`).
- Simulation export: new `ability_resolved` outcome
  `"random_revived_card"` distinguishes the random path from
  `"revived_card"` (prompt). No new event types.
- Effect classification: ongoing whole-match passive that mutates the
  Medic ability for non-hero sources controlled by the seat with this
  leader.

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

### §C-3 — `random_medic` ID is a misnomer (SETTLED & IMPLEMENTED in cCp25)

- The catalog ability ID `random_medic` lives on
  `nilfgaard.emhyr-var-emreis-invader-of-the-north`. Before cCp25 the
  catalog description was "Plays a random medic effect."
- The classic Witcher 3 / Gwent text is "Pick a random Special Card from
  your discard pile and play it instantly." That printed wording reads
  as a Special-card random replay, not a Medic Unit revival.
- Game8 staging: ID is `random_medic` (matches catalog).
- Witcher Fandom snapshot: no contradicting evidence.
- **Classification (historical): catalog ID and printed-rulebook text
  disagreed.** The cCp18 audit recorded this as a documentation
  conflict; the product owner's settled decision §5 chose the
  Medic-mutation reading, keeping the catalog ID `random_medic`.
- **Settled by product owner: Medic-mutation wins (Option A).** The
  catalog ID `random_medic` is **kept** for backward catalog stability,
  but the *behavior* is a passive Medic mutation, **not** a random
  Special replay. The Witcher 3 "Special Card" wording is superseded.
- **IMPLEMENTED in cCp25** as a whole-match passive that derives from
  leader identity. While Invader of the North is the seat's leader,
  every non-hero Medic source controlled by that seat revives a random
  eligible non-hero Unit from own discard instead of opening a
  player-choice Medic prompt. Hero Medic sources are unaffected. See
  `audit/reports/2026-05-03-cCp25-report.md` and §17.12j. The catalog
  ability description in `src/game/catalog/abilities.ts` is rewritten
  in cCp25 to describe the Medic-mutation contract; the older
  "random medic effect" description is replaced.

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
| 5. Look Three Cards (IMPLEMENTED in cCp28) | `target.kind === "none"` | `choose_option` acknowledgement prompt with `stage === "opponent_hand_reveal"` | n/a | one-time reveal modal | HIGH while prompt is open; no persistent reveal after acknowledgement | acting-seat only; redaction logic is seat-aware | prompt-local `revealed_opponent_hand_<index>` safe refs for acting perspective only | one-shot active w/ one-time acknowledgement modal |
| 6. Leader Cancel (IMPLEMENTED in cCp29) | `target.kind === "none"` proactively; reaction prompt options use `target.kind === "none"` | `choose_option` reaction prompt with `stage === "leader_cancel_reaction"` | yes for proactive/no-target; generic PromptPanel for reaction | score-card leader status update | none directly; cross-cuts every passive | yes for reaction prompt; proactive AI tuning deferred | public `cancelledThisRound` leader flag in observations/export | one-shot active w/ current-round suppression (`leaderCancelledRound`) |
| 7. Setup Draw Extra | none | none | n/a | none | none | yes | none beyond standard hand size | setup-time event |
| 8. Passive Random Medic Mutation (IMPLEMENTED in cCp25) | none (passive) | none | n/a | none | none (own discard public; only the chosen card is revealed) | yes | new `ability_resolved.outcome "random_revived_card"`; otherwise no new events | ongoing whole-match Medic mutation |
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

### Tranche 2 — Active Score Modifier and Single-Step Prompt Leaders (COMPLETE in cCp25)

**Members:** `double_spies` (IMPLEMENTED in cCp20),
`optimize_agile_rows` (IMPLEMENTED in cCp21),
`restore_discard_to_hand` (IMPLEMENTED in cCp22),
`shuffle_discards_into_decks` (IMPLEMENTED in cCp23),
`draw_opponent_discard` (IMPLEMENTED in cCp24),
`random_medic` (IMPLEMENTED in cCp25).

**Status:** All six members are implemented; **Tranche 2 is complete
after cCp25.** After cCp25, seven implemented passive leader records
exist (King Bran + four cCp19 row-horn + cCp20 Treacherous + cCp25
Invader of the North), eleven implemented active executable leader
records exist (cCp14 weather + cCp16 row-Scorch × 2 + cCp7
clear-weather + cCp21 Hope of the Aen Seidhe + cCp22 Bringer of Death
+ cCp23 Crach an Craite + cCp24 The Relentless), and four leader
records remain placeholder. The next phase should start Tranche 3 with
either `draw_extra_card` (Pattern 7, setup-time hand-size modifier) or
`discard_two_draw_one_from_deck` (Pattern 3, multi-step prompt).

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

**Final ordering inside Tranche 2 (post-cCp25, complete):**

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
6. `random_medic` — IMPLEMENTED in cCp25 (whole-match passive Medic
   mutation, per settled §5; settles §C-3).

### Tranche 3 — Setup-Time Event and Multi-Step Prompt (COMPLETE)

**Members:** `draw_extra_card` (Pattern 7, **IMPLEMENTED in cCp26**),
`discard_two_draw_one_from_deck` (Pattern 3, **IMPLEMENTED in cCp27**).

**Status: COMPLETE.** cCp26 implemented `draw_extra_card` as a
setup-time hand-size modifier on Francesca Findabair: Daisy of the
Valley. cCp27 implemented `discard_two_draw_one_from_deck` on Eredin:
Destroyer of Worlds as the engine's first true two-stage prompt
leader. Tranche 4 (hidden-info disclosure and suppression) is now
the only remaining tranche.

**Why third:**

- `draw_extra_card` is trivial to implement (one branch in `setup.ts`)
  but gives a complete cross-tranche test exercise: setup-time leaders
  must not produce a `use_leader` move and must not flip `leaderUsed`,
  same as King Bran. **Delivered in cCp26.**
- `discard_two_draw_one_from_deck` requires the engine's first
  multi-stage prompt. The work is non-trivial but isolated; doing it
  here keeps the first hidden-info-disclosure leaders (Tranche 4) free
  of prompt-stage churn. **Delivered in cCp27.**

### Tranche 4 — Hidden-Info Disclosure and Suppression (COMPLETE)

**Members:** `look_three_cards` (Pattern 5, **DELIVERED in cCp28**),
`cancel_leader` (Pattern 6, **DELIVERED in cCp29**). **Tranche 4 and
the entire official leader matrix are complete after cCp29.**

**Outcomes:**

- `look_three_cards` (cCp28) is the engine's first explicit hidden-info
  disclosure, delivered as a one-time acknowledgement modal (per
  Settled Product Decision §6) rather than a persistent observation
  state, so the engine still avoids a long-lived
  `seat.revealedOpponentHand` field.
- `cancel_leader` (cCp29) cross-cuts every passive leader implemented
  in Tranches 1-3 (must check the suppression flag on every scoring
  tick) plus active leaders (must be locked out of `getLeaderMove`
  while suppression is in effect). Settled Product Decision §8 picks
  reaction / current-round suppression with no refund. The reaction
  prompt is the AI's primary entry point; the proactive heuristic is
  intentionally kept narrow (`legal-heuristic-v0` does not call
  `cancel_leader` proactively in practice but resolves owned reaction
  prompts deterministically).
- Hidden-info testing is the highest-risk bucket; doing it last let
  Tranches 1-3 land first as a smaller integration set. cCp28-cCp29
  validate the hidden-info contracts (`getPromptMoves`,
  `seatObservation`, `buildSafeSimulationObservation`,
  `summarizeEvents`) under both a real disclosure event and a real
  suppression flag.

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
   **Implemented in cCp27** as the engine's first true two-stage prompt
   leader (Pattern 3 IMPLEMENTED, Tranche 3 COMPLETE); see
   `docs/gwent-rules.md` §17.12l.
5. **`random_medic` ability ID.** **Settled: passive mutation of Medic
   effects.** The leader does not play a random Special card from
   discard. Instead, while it is the seat's leader, every Medic effect
   (including chained Medic revivals) selects a **random non-hero unit**
   from the discard pile rather than letting the player choose. It does
   not affect hero sources that have Medic.
6. **`look_three_cards` reveal duration / dismissal.** **Settled: one-time
   modal.** The acting seat sees the (up to) three random opponent hand
   cards in a single modal disclosure; if dismissed it cannot be
   reopened. Implementation-time UI work captures the snapshot once and
   discards it. **Implemented in cCp28** as a `choose_option` /
   `opponent_hand_reveal` acknowledgement prompt with `target.kind ===
   "none"`. The reveal lives only in `pendingPrompt.context.revealedCardIds`
   and is cleared on acknowledgement; no `MatchState` field retains it.
   See `docs/gwent-rules.md` §17.12m.
7. **`look_three_cards` and mulligan / setup-time use.** **Settled:
   leaders fire in the play phase only.** Same gate as today's
   implemented leaders (`getLeaderMove` returns no move during
   mulligan). **Implemented in cCp28** — `getLeaderMove` returns no
   move outside `playing` phase for `look_three_cards`, including
   `mulligan`, `round_end`, `game_end`, and `setup`.
8. **`cancel_leader` semantics.** **Settled: reaction / current-round
   suppression.** **Implemented in cCp29.** `cancel_leader` can be
   played as a reaction or proactively on the acting seat's own turn;
   it suppresses the opponent's leader effect for the current round
   only. If it cancels an active leader through the reaction prompt,
   that leader is still consumed (no refund). If it suppresses a
   passive, scoring/ability policies recalculate immediately for the
   current round through the existing pure-function pipeline. The
   reaction window opens before the attempted opponent active leader
   resolves; the decline option resolves the attempted leader exactly
   once. White Flame cannot be used to cancel another White Flame (no
   recursive reaction window). Suppression clears at round transition.
   Setup-time `draw_extra_card` is not retroactively undone.
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

- 2026-05-04 (cCp29): `cancel_leader` (Emhyr var Emreis: The White
  Flame) promoted from `placeholder` to `implemented` as the engine's
  first **reaction / current-round suppression leader** (Pattern 6
  marked IMPLEMENTED). cCp29 closes Tranche 4 and the entire official
  leader matrix. New pure helper module
  `src/game/core/leaderCancel.ts` exporting
  `CANCEL_LEADER_SOURCE_ID`, `isLeaderSuppressedThisRound`,
  `getLeaderCancelStatus`, `canUseCancelLeaderProactively`, and
  `canOpenCancelLeaderReaction`. New `seat.leaderCancelledRound:
  number | null` field on `SeatState` (initialized to `null` in
  `startMatch`, set to `state.round` on cancel, cleared at round
  transition). New `PendingPromptStage` value
  `"leader_cancel_reaction"` and new
  `PendingPromptContext.leaderCancel: LeaderCancelReactionContext`
  field carrying the attempted leader's identity (and original
  `target`, `unknown`-typed to avoid a cycle with `LegalMoveTarget`)
  for the decline-replay path. New `GameEvent` variant
  `leader_cancelled { mode: "proactive" | "reaction", round, seatId,
  targetSeatId, targetLeaderCardId, targetLeaderSourceId,
  targetAbilityId }`. **Proactive flow:** `getLeaderMove` emits one
  no-target `use_leader` move on the White Flame seat's own turn when
  the opponent has a cancellable current-round leader effect (active
  unused or implemented passive); setup-only `draw_extra_card` and
  already-used active leaders with no passive policy are excluded;
  proactive cancel of cancel is forbidden. `executeLeader` rejects
  non-`none` targets, sets opponent
  `leaderCancelledRound = state.round`, consumes White Flame, emits
  `ability_triggered` → `leader_cancelled (proactive)` → `ability_resolved
  (leader_cancelled)` → `leader_used` → `turn_set` (handoff). The
  opponent leader is **not** consumed in proactive mode. **Reaction
  flow:** `executeLeader` adds a reaction-prompt gate before per-leader
  branches: when a non-`cancel_leader` active leader fires and the
  opposing seat owns an unused, unsuppressed `cancel_leader` and has
  not passed and is not itself suppressed, the engine clones state,
  opens `pendingPrompt` (`choose_option`,
  `stage: "leader_cancel_reaction"`, `seatId: whiteFlameSeat`, two
  no-target options `cancel-leader:cancel` / `cancel-leader:decline`,
  `context.leaderCancel`), emits `prompt_opened`, and returns without
  consuming any leader and without handing off the turn. Cancel option
  resolution (in `commands.choosePromptOption`): emits
  `prompt_resolved` → clears prompt → `ability_triggered` → sets
  target `leaderCancelledRound = state.round` → emits `leader_cancelled
  (reaction)` → `ability_resolved (leader_cancelled)` → `leader_used`
  (White Flame) → `leader_used` (cancelled target) → `turn_set`
  (handoff from attempted leader seat). Decline option resolution:
  emits `prompt_resolved` → clears prompt → re-executes
  `executeLeader` on a clone with `bypassCancelReaction: true` and
  `skipLegalCheck: true` so the attempted leader fires exactly once
  through its existing per-leader branch (no recursive reaction
  prompt). **Suppression:** every implemented active leader category is
  blocked by `getLeaderMove`'s suppression check (clear weather,
  weather-pulling, row Scorch, optimize agile, restore discard,
  shuffle discards, draw opponent discard, discard/draw, look three
  cards). Manual `UseLeader` against a suppressed seat rejects through
  the existing legal-move assertion without mutating state. Passive
  scoring/ability helpers (`getWeatherPolicyBySeat`,
  `getRowHornPolicyBySeat`, `getDoubleSpiesPolicyBySeat`,
  `hasRandomMedicPolicyForSeat`) check
  `isLeaderSuppressedThisRound` and act as if the seat has no leader
  policy for the suppressed round. `resolveRoundEnd` clears both
  seats' `leaderCancelledRound` to `null` before the next round
  starts. Promotes `cancel_leader` metadata from `placeholder` to
  `implemented` in `src/game/catalog/abilities.ts`. Updates
  `OfficialLeaderPromotionManifest`: `executableLeaderSourceIds`
  grows from 13 to 14 (adds The White Flame); `implementedLeaderSourceIds`
  grows from 21 to 22; `placeholderLeaderAbilityIds` shrinks from 1 to
  0 (removes `cancel_leader` — the list is now empty). AI: extends
  `legal-heuristic-v0`'s `choosePromptMove` so AI deterministically
  picks the cancel option from a `cancel_leader` reaction prompt.
  Observation/export: extends `SeatObservation.ownLeader` /
  `opponentLeader` and `SafeSeatPrivatePublicState.leader` /
  `SafeOpponentPublicState.leader` with `cancelledThisRound: boolean`.
  UI: existing generic `PromptPanel` renders the two no-target reaction
  options without a new modal; `ScoreCard` shows `cancelled this
  round` when the leader is suppressed (clears at round transition);
  `summarizeEvents` renders `leader_cancelled` as a count-only label
  (`<actor> cancelled <target> leader for round N`). Adds 66 focused
  tests in `tests/game/coreCancelLeader.test.ts`. Updates
  `tests/data/officialLeaderPromotion.test.ts`,
  `tests/data/officialCatalogImport.test.ts`,
  `tests/catalog/catalogValidators.test.ts`,
  `tests/components/gwent/cardStudioHelpers.test.ts`,
  `tests/components/gwent/authenticDeckBuilderViewModel.test.ts`,
  `tests/components/gwent/authenticMatchViewModel.test.ts`,
  `tests/game/coreDiscardDrawLeader.test.ts`,
  `tests/game/coreDrawExtraCardLeader.test.ts`,
  `tests/game/coreLookThreeCardsLeader.test.ts`, and
  `tests/game/coreRandomMedicLeader.test.ts` to reflect the new
  totals (14 executable + 7 passive + 1 setup = 22 implemented, 0
  placeholder) and to drop placeholder-leader fixtures (only
  `unknown_leader_ability` remains as a placeholder validator path).
  Living docs updated: this file marks Pattern 6 IMPLEMENTED; flips
  the White Flame row to `implemented (cCp29)`; refreshes Status
  counts; marks Tranche 4 COMPLETE; refines Settled Product Decision
  §8 to mark it implemented. `docs/gwent-rules.md` adds §17.12n for
  the reaction / current-round suppression contract and a §16 row for
  Emhyr: The White Flame. `docs/PROJECT_STATE.md` flips the active
  spec handoff to cCp29 implemented. No deck-builder, Card Studio,
  official porting, asset, broad AI rewrite, route promotion, or
  legacy UI migration changes.

- 2026-05-04 (cCp28): `look_three_cards` (Emhyr var Emreis: Emperor of
  Nilfgaard) promoted from `placeholder` to `implemented` as the
  engine's first **hidden-info disclosure leader** (Pattern 5 marked
  IMPLEMENTED). cCp28 opens Tranche 4. New pure helper module
  `src/game/core/leaderLookThreeCards.ts` exporting
  `LOOK_THREE_CARDS_LEADER_SOURCE_ID`,
  `LOOK_THREE_CARDS_REVEAL_COUNT`,
  `getLookThreeCardsEligibility`, and `planLookThreeCardsReveal`. The
  helper inspects opponent hand length, selects up to three opponent
  hand cards via `createSeededRngFromState` + `shuffleWithRng`, and
  returns the chosen card IDs in the opponent's natural hand order.
  RNG advances only when opponent hand length > 3; for hand length 1,
  2, or 3 the full hand is revealed without invoking RNG and
  `state.rng.state` is preserved. `getLeaderMove` emits exactly one
  no-target `use_leader` move when opponent hand length ≥ 1
  (`target.kind === "none"`, `metadata.targetRequirement === "none"`,
  `metadata.targetCount === revealCount`,
  `metadata.targetLabel === "opponent hand"`, plus diagnostic
  `opponentHandCount` / `revealCount`). Empty opponent hand emits no
  legal `use_leader` move. `executeLeader` clones state, advances
  RNG only if a real subset selection happens, emits
  `ability_triggered`, `opponent_hand_revealed { reason:
  "look_three_cards", seatId, opponentSeatId, cardIds, sourceIds }`,
  `ability_resolved.revealed_opponent_hand`, sets `seat.leaderUsed =
  true` (the leader is consumed at `UseLeader`), emits `leader_used`,
  and opens an acknowledgement prompt: `kind === "choose_option"`,
  `stage === "opponent_hand_reveal"`, single option
  `look-three-cards:acknowledge` with `target.kind === "none"`,
  `context.revealedCardIds` carries the chosen opponent hand card
  IDs. `currentTurn` stays on the acting seat while the prompt is
  pending. Acknowledgement (`ChoosePromptOption { optionId:
  "look-three-cards:acknowledge" }`) emits `prompt_resolved`, clears
  `state.pendingPrompt`, and the outer command path hands off the
  turn through the existing `handoffTurn` helper. After
  acknowledgement, **no `MatchState` field retains the reveal** — the
  snapshot lived only in `pendingPrompt.context.revealedCardIds` and
  the prompt is gone. Revealed cards are **not** moved out of the
  opponent's hand and do **not** trigger their abilities. Adds the
  new `GameEvent` variant `opponent_hand_revealed` (internal/raw event
  log only), the new `PendingPromptTarget` variant `{ kind: "none" }`,
  the new `PendingPromptStage` value `"opponent_hand_reveal"`, the
  new `PendingPromptContext.revealedCardIds` field, and new
  `UseLeaderMove.metadata` diagnostic fields `opponentHandCount` /
  `revealCount`. `getPromptMoves` returns `[]` to the non-acting seat
  for the acknowledgement prompt; the acting seat's prompt move
  carries `target.kind === "none"`. AI seat observation extended
  with `PendingPromptSummary.revealedCards` (acting seat only). Safe
  simulation export extended with `SafePromptState.revealedCards`
  using prompt-local refs `revealed_opponent_hand_<index>` (acting
  perspective only). Recent activity / event summaries render
  count-only labels ("Human looked at 3 opponent hand cards") and
  never the revealed names or source IDs. Updates
  `OfficialLeaderPromotionManifest`: `executableLeaderSourceIds`
  grows from 12 to 13 (adds Emperor of Nilfgaard);
  `implementedLeaderSourceIds` grows from 20 to 21;
  `placeholderLeaderAbilityIds` shrinks from 2 to 1 (removes
  `look_three_cards`, leaving only `cancel_leader`). Adds 43 focused
  tests in `tests/game/coreLookThreeCardsLeader.test.ts` covering
  metadata promotion, manifest accounting, helper outcomes
  (eligibility gates, hand-size 0/1/2/3/4+ reveal selection, no-RNG
  for ≤3 hand sizes, RNG advance for >3, opponent-hand-order
  preservation, determinism, missing instance / missing source
  defensive behavior), legal-move integration (one no-target move
  with correct metadata, no move on empty / used / wrong phase /
  wrong turn / passed / prompt pending), command execution (rejects
  non-`none` target without mutation, rejects empty opponent hand
  without consuming leader, full event sequence, leaderUsed=true at
  UseLeader, no turn handoff while prompt pending, prompt shape with
  context.revealedCardIds, repeated UseLeader is illegal, no card
  movement, no card abilities triggered, off-owner cards in opponent
  hand are eligible), acknowledgement (clears prompt and hands off,
  no reopenable snapshot retained, second UseLeader is illegal post-
  acknowledgement, wrong seat / invalid option ID rejection),
  hidden-info contract (`getPromptMoves` only emits to acting seat,
  `buildSeatObservation` includes revealed cards only for prompt
  owner and `pendingPrompt: null` for opponent,
  `buildSafeSimulationObservation` exposes
  `revealed_opponent_hand_<n>` refs only to acting perspective and
  no revealed instance IDs in opponent perspective), AI-owned
  prompts (human seat sees no prompt moves and `pendingPrompt: null`
  in observation while AI seat sees its own revealed cards), and a
  regression that other implemented leaders still emit their
  `use_leader` moves. Adds 6 focused UI tests in
  `tests/components/gwent/authenticMatchViewModel.test.ts` covering
  the new `buildLookThreeCardsRevealViewModel` helper (returns null
  for non-look_three_cards prompts, returns null without an
  acknowledgement move, returns null for null prompt, builds 1/2/3
  card view models from prompt context preserving order, emits a
  placeholder entry when a revealed instance is missing from the
  lookup). Updates `tests/data/officialLeaderPromotion.test.ts`
  (placeholder list shrinks to 1 entry — `cancel_leader` —
  executable list grows to 13 with Emperor of Nilfgaard, implemented
  union grows to 21, ability metadata block adds
  `look_three_cards`); updates
  `tests/data/officialCatalogImport.test.ts`
  (`unsupportedLeaderAbilityCounts.look_three_cards` is now
  `undefined`; new sentinel
  `unsupportedLeaderAbilityCounts.cancel_leader > 0`); updates
  `tests/game/coreDiscardDrawLeader.test.ts`,
  `tests/game/coreDrawExtraCardLeader.test.ts`, and
  `tests/game/coreRandomMedicLeader.test.ts` placeholder-list and
  manifest-count assertions to reflect the cCp28 totals (13 / 7 /
  1 / 21 / 1); updates
  `tests/components/gwent/authenticDeckBuilderViewModel.test.ts`
  placeholder-leader fixtures to point at `cancel_leader` (the
  only remaining placeholder Nilfgaard leader is now Emhyr: The
  White Flame); updates
  `tests/components/gwent/authenticMatchViewModel.test.ts`
  placeholder-status fixture to point at Emhyr: The White Flame
  (`cancel_leader`). Updates living docs: `docs/gwent-rules.md`
  adds §17.12m documenting the hidden-info disclosure contract,
  RNG policy, one-time modal contract, no-trigger contract for
  revealed cards, and the hidden-info safety boundaries; plus a
  §16 row for *Emhyr var Emreis, Emperor of Nilfgaard* pointing at
  §17.12m. `docs/leader-ability-matrix.md` flips the Emperor of
  Nilfgaard row to `implemented (cCp28)` with the full implemented
  contract, marks Pattern 5 IMPLEMENTED with the one-time-modal
  details replacing the older persistent-observation guidance,
  marks Tranche 4 with `look_three_cards` delivered (only
  `cancel_leader` remaining), refines Settled Product Decision §6
  and §7 to mark them as implemented, refreshes status counts
  (executable 13, passive 7 unchanged, setup 1 unchanged,
  placeholder 1), and appends this change-log entry. Pattern 5
  marked IMPLEMENTED. Tranche 4 opened with `look_three_cards`
  delivered. After cCp28, only `cancel_leader` (Pattern 6) remains
  placeholder. UI ships a one-time `authentic-look-three-cards-dialog`
  modal for human-owned reveal prompts (with new
  `authentic-look-three-cards-card` and
  `authentic-look-three-cards-ack` test IDs) and CSS hooks under
  the existing `authentic-match` namespace; AI-owned reveal
  prompts continue to surface "AI resolving prompt from legal
  moves" without exposing card faces. The normal opponent hand
  strip stays backs/count-only — no card becomes persistently
  face-up. Browser smoke (`npm run ci:browser`) coverage passes through
  the existing `tests/e2e/engine-shell-smoke.spec.ts` shell. See
  `audit/reports/2026-05-04-cCp28-report.md` for full details.
- 2026-05-03 (cCp27): `discard_two_draw_one_from_deck` (Eredin: Destroyer
  of Worlds) promoted from `placeholder` to `implemented` as the engine's
  first **active one-shot multi-stage prompt** leader (Pattern 3 marked
  IMPLEMENTED). cCp27 completes Tranche 3. New pure helper module
  `src/game/core/leaderDiscardDraw.ts` exporting
  `DISCARD_TWO_DRAW_ONE_LEADER_SOURCE_ID`, `MIN_DISCARD_COUNT`,
  `MAX_DISCARD_COUNT`, `getDiscardDrawEligibility`,
  `buildDiscardSelectionOptions`, and `buildDeckDrawOptions`.
  `getLeaderMove` emits a single no-target `use_leader` move when the
  acting seat has at least 1 hand card and at least 1 deck card,
  `target.kind === "none"`, `metadata.targetRequirement === "future_prompt"`,
  `metadata.targetCount === handCount + deckCount`,
  `metadata.targetLabel === "hand then deck"`, plus diagnostic
  `discardMin: 1`, `discardMax: 2`, `handCount`, `deckCount`. Empty
  hand or empty deck emits no legal `use_leader` move. `executeLeader`
  clones state, emits `ability_triggered`, and opens stage 1: a
  `pendingPrompt` with `kind === "choose_card_set"`,
  `stage === "discard_selection"`, `context: { minDiscardCount: 1,
  maxDiscardCount: 2 }`, and one option per legal 1-card discard
  followed by every 2-card combination in deterministic acting-seat
  hand order. Stage 1 does **not** consume the leader. `ChoosePromptOption`
  validates seat ownership, option ID legality, that the selection
  contains 1 or 2 unique cards, and that every selected card is still
  in the acting seat's hand. Stage 1 resolution moves each selected
  card from hand to acting discard with `card_moved.reason ===
  "leader_discard_for_draw"`, sets each discarded card's `controller`
  to the acting seat (preserves `owner`), emits `prompt_resolved` for
  stage 1, and immediately opens stage 2: a `pendingPrompt` with
  `kind === "choose_card"`, `stage === "deck_draw_selection"`,
  `context: { discardedCardIds }`, with one option per remaining
  acting deck card in deck order. Discarded hand cards do **not**
  trigger Summon, Avenger, Medic, Spy, Scorch, weather, Muster,
  Berserker, Mardroeme, or any other battlefield discard effect.
  Stage 2 validates seat ownership, option legality, and that the
  chosen card is still in the acting seat's deck. Stage 2 resolution
  moves the chosen card from deck to acting hand with
  `card_moved.reason === "leader_draw_from_deck"`, sets `controller`
  to the acting seat (preserves `owner`), shuffles the remaining
  acting deck through `createSeededRngFromState` + `shuffleWithRng`
  (RNG advances only when remaining deck length ≥ 2; deck length 0
  or 1 is a deterministic no-op), emits `deck_shuffled` with
  `reason === "leader_discard_draw"`, `prompt_resolved`,
  `ability_resolved.discarded_and_drew_card`, sets `seat.leaderUsed
  = true`, emits `leader_used`, clears `state.pendingPrompt`, and
  hands off the turn through the existing `handoffTurn` helper. Drawn
  cards do **not** trigger their abilities. Adds the new event
  reasons `card_moved.reason "leader_discard_for_draw"` /
  `"leader_draw_from_deck"` and `deck_shuffled.reason
  "leader_discard_draw"` (distinct from cCp23's
  `"leader_shuffle_into_deck"`). Extends `LegalMoveTarget` with two
  new acting-seat-only target kinds: `card_instance_set` (stage 1)
  and `deck_card_instance` (stage 2), both `side: "own"`. Extends
  `PendingPromptTarget` with the matching prompt-option shapes,
  introduces `PendingPromptStage`, and adds optional `stage` /
  `context` fields on `PendingPrompt`. The `PendingPrompt.kind`
  union grows to include `"choose_card_set"` for stage 1.
  `getPromptMoves` returns `[]` to the non-acting seat for both
  stages. Updates `OfficialLeaderPromotionManifest`:
  `executableLeaderSourceIds` grows from 11 to 12 (adds Eredin:
  Destroyer of Worlds); `implementedLeaderSourceIds` grows from 19 to
  20; `placeholderLeaderAbilityIds` shrinks from 3 to 2 (removes
  `discard_two_draw_one_from_deck`, leaving `cancel_leader` and
  `look_three_cards`). Adds 49 focused tests in
  `tests/game/coreDiscardDrawLeader.test.ts` covering metadata
  promotion, manifest accounting, helper outcomes, eligibility gates,
  legal-move integration, stage 1 prompt opening, stage 1 resolution
  including off-owner cards and no-trigger of battlefield discard
  effects, stage 2 resolution including controller / owner handling
  and RNG advancement, deterministic deck shuffle behavior, rejection
  paths (wrong seat, invalid option ID, stale hand card, stale deck
  card, non-`none` UseLeader target, empty hand, empty deck, prompt
  pending), legal prompt move shapes for both stages, hidden-info
  safety (non-acting seat sees no prompt moves), and regression
  guards (cCp22 restore-discard prompt, cCp24 draw-opponent-discard
  prompt, Foltest Lord Commander `clear_weather`, no `Math.random`
  in `src/game/core`). Updates `tests/data/officialLeaderPromotion.test.ts`
  (placeholder list shrinks to 2 entries, executable set grows to 12
  with Destroyer of Worlds, implemented union grows to 20, sanity
  assertion that `placeholderLeaderAbilityIds` does not contain
  `discard_two_draw_one_from_deck`); updates
  `tests/data/officialCatalogImport.test.ts`
  (`unsupportedLeaderAbilityCounts.discard_two_draw_one_from_deck` is
  undefined; new sentinel `look_three_cards.unsupported > 0`);
  updates `tests/game/coreDrawExtraCardLeader.test.ts` and
  `tests/game/coreRandomMedicLeader.test.ts` placeholder-list and
  manifest-count assertions to reflect the cCp27 totals (12 / 7 / 1
  / 20 / 2). Updates living docs: `docs/gwent-rules.md` adds §17.12l
  documenting the active multi-stage contract and a §16 row for
  Eredin: Destroyer of Worlds; `docs/leader-ability-matrix.md` flips
  the Destroyer of Worlds row to `implemented (cCp27)` with the full
  implemented contract, marks Pattern 3 IMPLEMENTED, marks Tranche 3
  COMPLETE, refines Settled Product Decision §4 status, and appends
  this change-log entry. Pattern 3 marked IMPLEMENTED. Tranche 3
  marked COMPLETE. Tranche 4 (`look_three_cards`, `cancel_leader`)
  is the only remaining tranche. After cCp27, two leader records
  remain placeholder. See `audit/reports/2026-05-03-cCp27-report.md`
  for details.
- 2026-05-03 (cCp26): `draw_extra_card` (Francesca Findabair: Daisy of
  the Valley) promoted from `placeholder` to `implemented` as a
  **setup-time initial hand-size modifier** (Pattern 7 marked
  IMPLEMENTED). New pure helper module `src/game/core/leaderSetup.ts`
  exporting `DRAW_EXTRA_CARD_LEADER_SOURCE_ID`,
  `BASE_INITIAL_HAND_SIZE`, and `getInitialHandDrawCountForLeader`.
  `src/game/core/setup.ts` replaces the hard-coded `10` with the
  helper-derived per-seat draw count, so the affected seat draws 11
  initial cards (the next deterministic card off the seeded-RNG-
  shuffled deck top) instead of 10 before mulligan opens. The
  mulligan budget is unchanged at two redraws; legal mulligan moves
  naturally include one-card mulligan options for all 11 hand cards
  (1 keep-hand + 11 one-card mulligans = 12 legal moves on the first
  tick). The leader emits no `use_leader` legal move, never sets
  `seat.leaderUsed`, and never emits `leader_used`; manual `UseLeader`
  rejects through the existing unsupported-leader path without state
  mutation. The 11th card is never chosen by prompt, kind, faction,
  strength, row, or ability — it is whatever the deterministic
  shuffle put on top. Tiny test decks shorter than 11 cards do not
  throw solely because of `draw_extra_card`; the existing `slice`
  behavior draws available cards. Setup events reuse existing types
  (`card_moved.reason === "initial_draw"` per drawn card and
  `initial_hand_drawn` with `cardIds.length === 11`); no new event
  types. The `OfficialLeaderPromotionManifest` introduces a new
  bucket `implementedSetupLeaderSourceIds` (1 entry: Daisy of the
  Valley) distinct from `executableLeaderSourceIds` and
  `implementedPassiveLeaderSourceIds`. `implementedLeaderSourceIds`
  becomes the sorted union of all three (now 11 + 7 + 1 = 19), and
  `placeholderLeaderAbilityIds` shrinks from 4 to 3 (removes
  `draw_extra_card`). Pattern 7 marked IMPLEMENTED. Tranche 3 opens;
  the remaining Tranche 3 member is `discard_two_draw_one_from_deck`
  (Pattern 3). After cCp26, three leader records remain placeholder.
  See `audit/reports/2026-05-03-cCp26-report.md` for details.
- 2026-05-03 (cCp25): `random_medic` (Emhyr var Emreis: Invader of the
  North) promoted from `placeholder` to `implemented` as a **whole-match
  passive Medic mutation** (Pattern 8, rewritten from "Random Special
  Replay From Discard" to "Passive Random Medic Mutation"). New pure
  helper module `src/game/core/leaderRandomMedic.ts` exporting
  `hasRandomMedicPolicyForSeat`, `getRandomMedicCandidates`, and
  `chooseRandomMedicCandidate`. While Invader of the North is the
  seat's leader, every non-hero Medic source controlled by that seat
  (`source.abilities.includes("medic") && source.kind !== "hero"`)
  revives a random eligible non-hero Unit from the seat's own discard
  pile (uniform over candidate cards through `createSeededRngFromState`;
  deterministic row fallback `close → ranged → siege` for multi-row
  targets) instead of opening a player-choice `medic_revive` prompt.
  Hero Medic sources are unaffected and continue to use the normal
  Medic prompt (Hero immunity, §17.1). The candidate filter excludes
  specials, weather, hero cards, opponent discard, hands, decks, side
  decks, removed-from-game, board rows, row horns, weather zone, and
  stale missing-instance / missing-catalog-source entries; side-deck-
  only / generated and off-owner non-hero units physically in own
  discard are eligible. The chain recurses for random-revived non-hero
  Medics until the candidate set is empty. RNG advances only on a real
  multi-candidate roll; zero or single candidate paths leave
  `state.rng.state` unchanged. The policy reuses a shared internal
  `placeMedicRevival` helper in `src/game/core/abilities.ts` so the
  prompt-based and random-based Medic flows share Spy placement,
  controller reset, `card_played`, child ability resolution, and
  Mardroeme settlement. The new `ability_resolved` outcome
  `"random_revived_card"` distinguishes the random path from the
  prompt-based `"revived_card"`; no `prompt_opened` or
  `prompt_resolved` events are emitted for the random path. The
  leader emits no `use_leader` legal move, never sets
  `seat.leaderUsed`, and never emits `leader_used`. Manual `UseLeader`
  rejects through the existing unsupported-leader path without state
  mutation. The official promotion manifest adds
  `nilfgaard.emhyr-var-emreis-invader-of-the-north` to
  `implementedPassiveLeaderSourceIds` (now 7) and removes
  `random_medic` from `placeholderLeaderAbilityIds` (now 4). Settled
  product decision §5 reaffirmed: Medic-mutation wins; the Witcher 3
  "random Special card" wording is superseded. Settled §C-3 conflict
  marked settled-and-implemented. Pattern 8 marked IMPLEMENTED.
  **Tranche 2 is complete after cCp25** — Tranche 3 should start with
  either `draw_extra_card` (Pattern 7) or
  `discard_two_draw_one_from_deck` (Pattern 3). After cCp25, four
  leader records remain placeholder. See
  `audit/reports/2026-05-03-cCp25-report.md` for details.
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
