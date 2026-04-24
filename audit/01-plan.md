# Phase 1 — Audit Plan

> Generated after Phase 0 codebase map. Predicts files to read and rule points to verify per phase. Cross-references root-cause IDs from the scope expansion.

---

## Status legend (carried forward from finding format)

| Code | Meaning |
|---|---|
| ✅ | Correct |
| ❌ | Bug — implemented and wrong |
| ⚠️ | Ambiguous / partially missing |
| 🤔 | Implemented but a deliberate deviation |
| ❓ | Rulebook silent (design decision needed) |
| 🔀 | Asymmetric — human and AI paths exist and differ |
| 🕳️ | **NEW.** Unimplemented — rule exists, no code exists |

🕳️ items go in their own bucket in `99-findings.md` AND in `scope-of-work.md`.

---

## Root-cause IDs (single source of truth)

These were seeded by the scope update. Each later finding cites the ID; root cause is described once below.

| ID | Cause | Files | Affected phases |
|---|---|---|---|
| **R-001** | `Math.random()` called inside reducers — non-pure, also chooses round starter randomly | `gameSlice.ts:90, 300` | Phase 5 (winner-starts-next-round), Phase 14 (determinism), Phase 16 (RNG) |
| **R-002** | Two `useEffect`s race for round-end transition; `playerPass` reducer also sets phase synchronously | `gameSlice.ts:106-122`, `ReduxGameManager.tsx:90-97, 146-150` | Phase 4, Phase 14 |
| **R-003** | `activeWeatherEffects` is `Set<CardAbility>` in the type but `CardAbility[]` in Redux state; converted ad-hoc at every boundary | `types/card.ts:131`, `gameSlice.ts:5-7`, `gameSelectors.ts:20-23, 167-172`, `ReduxGameManager.tsx:103, 104, 363, 406` | Phase 10, Phase 12, Phase 15 |
| **R-004** | Spy goes to opponent's discard at round end (sweeps opponent's board into opponent's discard); rule says controller's discard | `gameThunks.ts:243-258`, `gameSlice.ts:282-289` | Phase 8, Phase 15 |
| **R-005** | Medic chain has two parallel implementations: `handlePlayerMedicChain` (UI-driven, one revive at a time) vs `executeAIMedicChain` (drains pre-computed list) | `gameThunks.ts:284-338, 456-562` | Phase 8, Phase 15 |
| **R-006** | AI is hardcoded as `state.opponent.*`; no seat abstraction | `strategy.ts` (entire file), `useReduxAI.ts` (entire file) | Phase 15, Phase 15b, Phase 16 |
| **R-007** | `isAIMoving` set then cleared synchronously inside `makeOpponentMove`, before `setTimeout`-driven play resolves | `useReduxAI.ts:108-207` | Phase 14 |
| **R-008** | Game-end check in `handleRoundEnd` uses pre-decrement `lives === 1`, fires whenever either player is on last life regardless of who actually loses the round | `ReduxGameManager.tsx:111-142` | Phase 6 |
| **R-009** | `BoardRow.hornActive: boolean` loses the source card; `specialCardsOnBoard` shadow-tracks but not per-row, blocking any "Horn was Decoyed/Scorched → effect ends" rule | `types/card.ts:99-102`, `gameSlice.ts:8-11, 243-250` | Phase 9 |
| **R-010** | No `sideDeck` field on `PlayerState`; required for Summon, Berserker, Skellige starter mechanics | `types/card.ts:110-119` | Phase 2, Phase 8 |
| **R-011** | Mulligan reducer operates on the **unshuffled** original deck despite the thunk computing a shuffled deck; produces duplicate card IDs across hand∪deck and silent loss of 1–2 cards from the deck head on every mulligan. Consequence: any ID-based lookup across player state (Medic from discard, Decoy bounce, Spy draw-from-deck, end-of-round board sweep, AI strategy iteration) has potential duplicate hits from that point on. | `gameThunks.ts:432-453`, `gameSlice.ts:184-203`, `useReduxAI.ts:50-75` | Phase 2 (found), Phase 8 (Medic/Spy/Muster ID lookups), Phase 11 (Hero immunity ID filters), Phase 14 (state consistency), Phase 15 (symmetric bug — both paths broken the same way, but cascade effects may asymmetrically affect AI vs human) |
| **R-012** | Decoy card is double-tracked at round end: `handleDecoyAction` pushes a UNIT-type `decoyForBoard` onto `playerBoard.<row>.cards` (keeping the original `decoyCard.id`) AND separately calls `addSpecialCardToBoard` which stores the original `decoyCard` in `specialCardsOnBoard[player]`. At round end, both references are swept to the same discard pile → **duplicate id in discard**. Only Decoy among all SPECIAL card types has this double-track; Horn and Weather pass through only one path. | `gameThunks.ts:222-236` (handleDecoyAction), `gameSlice.ts:270-289` (endRound sweep) | Phase 5 (found), Phase 9 (Decoy details), Phase 11 (Hero-immunity sweep sees UNIT-type Decoy on board), Phase 13 (Eredin tutor from discard — if ever implemented — sees duplicate) |

New root causes discovered during phases 2–16 will be added to this table (in this file) and referenced from the relevant phase artifact.

---

## Phase Checklist (mirrors TaskList)

- [ ] **Phase 2** — Deck construction + mulligan + starting hand + **deck-builder readiness**
- [ ] **Phase 3** — Board zones, row placement, Agile
- [ ] **Phase 4** — Turn options, pass, turn switching (rules-level only; deep async in 14)
- [ ] **Phase 5** — Round resolution: strength → loser → gem → cleanup → next-round transition
- [ ] **Phase 6** — Game end, simultaneous loss, draw
- [ ] **Phase 7** — Faction abilities (inventory matrix)
- [ ] **Phase 8** — Unit abilities (mixed: dense for implemented, inventory for missing)
- [ ] **Phase 9** — Special cards (mixed)
- [ ] **Phase 10** — Weather (inventory matrix)
- [ ] **Phase 11** — Hero immunity (cross-cutting matrix)
- [ ] **Phase 12** — Resolution order with the §15 worked example
- [ ] **Phase 13** — Specific cards: Clan Dimun Pirate, Eredin, Emhyr, King Bran (almost entirely 🕳️)
- [ ] **Phase 14** — Async / race / scheduling deep-dive
- [ ] **Phase 15** — Player vs AI logic unification (duplicate-function matrix + asymmetry matrix)
- [ ] **Phase 15b** — Seat-swap latent bugs (`audit/15b-seat-swap-latent-bugs.md`)
- [ ] **Phase 16** — AI decision engine (info model, algo, cheating checklist, faction consistency from code-read only)
- [ ] **Phase 99** — Consolidated findings + **scope-of-work** + legacy appendix

---

## Phase 2 — Deck and Setup (expanded)

### Rule points to verify (rulebook §4, §7)

1. **§4 — Deck composition.** "Exactly 1 Leader, ≥22 Unit Cards, ≤10 Special Cards, single-faction color."
   - Files: `utils/deckBuilder.ts` (the only place decks are built), `types/card.ts` (PlayerState).
   - **Pre-flagged from Phase 0:** No validator exists. The hardcoded NR deck composition needs counting; the Nilfgaard deck definition needs counting. Even if both happen to satisfy the limits, a future deck-builder will need a validator function — flag as missing.
2. **§4 — White-star starter mark / black-star side-deck mark.**
   - Files: `types/card.ts` (look for `starter` / `sideDeck` boolean), `data/cards/*.ts` (look for the field on cards).
   - **Pre-flagged 🕳️.** No such field exists in `BaseCard` / `UnitCard` / `SpecialCard` definitions in `types/card.ts:67-95`.
3. **§4 — Side Deck.** Skellige Berserker transformations, Summon targets sit in side deck.
   - Files: `types/card.ts` (PlayerState), `gameSlice.ts` initial state, `deckBuilder.ts` return shape (`DeckWithLeader` only has `deck` + `leader`).
   - **Pre-flagged 🕳️ (`R-010`).** No side deck field. Without it Berserker/Summon are structurally impossible.
4. **§7.1 — Coin flip determines first player.** Scoia'tael overrides.
   - Files: `gameSlice.initializeGame:90`, `gameSlice.endRound:300`. Both use `Math.random()` (`R-001`).
   - **Pre-flagged ❌.** Coin flip is technically present (Math.random < 0.5). Scoia'tael override is 🕳️. **Critical issue:** the random re-rolls each round, contradicting §8.3 "winner of the round starts the next round."
5. **§7.2 — Each player draws 10 cards, used for the entire game.**
   - Files: `gameSlice.initializeGame:64-86` (slices `[0..10]` into hand). Deck has `slice(10)` remainder.
   - Verify: no re-deal between rounds.
6. **§7.3 — Mulligan: up to 2 cards, redrawn one at a time, discarded back into deck and reshuffled.**
   - Human files: `gameThunks.handlePlayerRedraw:432-453` + `ReduxGameManager.handleRedraw:320-341` (loop driven by `redrawCount < 2`).
   - AI files: `useReduxAI.handleAIRedraw:50-75` + `strategy.RedrawStrategy:80-152` + `evaluateRedraw:620-661`.
   - Verify: redraw count is 2 max for both; reshuffle happens; redraw cards re-enter deck not discard.
7. **§7.3 — These 10 cards are the player's hand for the rest of the game.** No re-draw at start of later rounds (except via abilities).
   - Files: `gameSlice.endRound:253-320`. Verify `hand` is not touched in the round-end reducer.

### Deck-Builder Readiness subsection (mandatory output)

The Phase 2 file will end with a section enumerating:
- Card data fields needed (white star, black star, side-deck eligibility, faction lock).
- Validation logic needed (composition limits, faction homogeneity, leader count).
- Side deck structure needed (`PlayerState.sideDeck: Card[]`, separate render/zone, separate cleanup rules).
- UI surfaces needed (just enumerate — not designed): faction selector, deck list editor, copy-count tracker, side-deck builder, save/load.

### Predicted findings (pre-Phase-2)

- 1 × ❌ for round starter (`R-001`).
- 4 × 🕳️ for: side deck infrastructure (`R-010`), starter-star marking, faction-color validator, deck-composition validator.
- 1 × ⚠️ for Scoia'tael coin-flip override absence (will cite `R-001` and a faction-ability gap).

---

## Phase 3 — Board and Placement

### Rule points (§5, §6.5, §9, §17.22)

1. **§5 — Per-player zones (close, ranged, siege, horn slot, leader, gem counters, etc.).**
   - Files: `types/card.ts:99-119` (`BoardState`, `PlayerState`); `components/player/PlayerArea.tsx`.
   - Verify: rows exist for both sides; horn slot is per-row (currently a boolean — `R-009`).
2. **§5 — Shared weather zone.**
   - Files: `gameSlice.activeWeatherEffects` + `weatherCards` array; `GameBoard.tsx:152-166` renders it.
3. **§5 — Board layout orientation (Close nearest middle).**
   - Files: `PlayerArea.tsx:104-124` reverses the row order for the opponent. Verify both sides render the right order.
4. **§9 — Units go on the row matching their range icon.**
   - Files: `gameHelpers.canPlayInRow:101-107`, `ReduxGameManager.handleRowClick:226` (validates `unitCard.row === row || availableRows?.includes(row)`).
   - Human + AI both pass through `playCardAction`, which **does not re-validate row** (assumes caller picked correctly). Note the AI path: `UnitStrategy` returns `row: unitCard.row` always. Worth confirming AI never picks the wrong row for an Agile unit (it just defaults to the printed row).
5. **§17.22 — Agile: Place Close *or* Ranged, locked once placed. Decoy bounces re-allows fresh choice.**
   - Files: `types/card.ts:81` (`availableRows?: RowPosition[]`); `ReduxGameManager.handleRowClick:236` checks `availableRows?.includes(row)` for human; AI's `UnitStrategy.evaluate:545-549` always returns `row: unitCard.row` (the printed row).
   - **Pre-flagged 🔀:** Human can place Agile on either row; AI never considers Ranged for an Agile Close unit.

### Predicted findings

- 1 × 🔀 for Agile placement choice (human vs AI).
- 1 × 🕳️ + `R-009` for Horn-slot fidelity (boolean vs card reference).

---

## Phase 4 — Turn Flow (rules-level)

### Rule points (§8.1, §8.2, §17.19, §17.23)

1. **§8.1 — Turn options: play card / use Active leader / pass. Exactly one.**
   - Files: human paths in `ReduxGameManager.handleRowClick`, `handleLeaderAbility`, `handlePass`. AI paths in `useReduxAI.makeOpponentMove`.
   - Verify exclusivity. Verify a turn cannot end without one of the three actions firing.
2. **§8.2 — Pass means sitting out the rest of the round; cannot play after passing.**
   - Files: `gameSlice.playerPass:106-113`, `opponentPass:115-122`. `selectCanPlayerAct:76-80` blocks UI when `playerPassed`.
   - Verify AI's `useEffect` does not re-fire after AI passes (gated on `!opponentPassed` at `useReduxAI.ts:226`).
3. **§8.1 — Active leader is once-per-game.**
   - Files: `gameSlice.useLeaderAbility:323-330` sets `leader.used = true`. `LeaderStrategy.evaluate:29` short-circuits if `card.used`.
   - Human button disabled by `!player.leader.used` in `PlayerStatus.tsx:104`. Verify no other leader-trigger surface exists.
4. **§17.23 — Cannot use leader during opponent's turn.**
   - Files: `PlayerStatus.tsx:108` `disabled={turn !== 'player'}`. Verify nothing else.
5. **§17.19 — Pass when no legal plays.** Implicit; verify the AI's `evaluateHand` returning null falls through to `handleOpponentPass` (line 191 in `useReduxAI.ts`).

### Pre-flagged

- `R-002` — `gameSlice.playerPass` synchronously sets `gamePhase = 'roundEnd'` AND a `useEffect` re-checks both-passed and sets it again with a 500ms delay. Rules-level, this could open a 500ms window where the player has passed but a UI element hasn't updated. Deeper analysis in Phase 14.

### Predicted findings

- 1 × ❌ or 🤔 for `R-002` (depending on whether the 500ms delay is observable).

---

## Phase 5 — Round Resolution (DENSE)

### Rule points (§8.3)

1. **Both players passed → round end fires.**
2. **Each player sums Strength of all cards on the battlefield, including Heroes, with all modifiers.**
   - Files: `ReduxGameManager.handleRoundEnd:103-104` calls `calculateTotalScore` from `gameHelpers.ts:87`.
3. **Lower total loses round, removes a gem.**
   - Files: `gameSlice.endRound:260-267` decrements `lives`.
4. **Tie → both lose a gem unless Nilfgaard is in play.**
   - Files: `gameSlice.endRound:264-267` always decrements both.
   - **Pre-flagged ❌ (faction-gap):** Nilfgaard exception is 🕳️.
5. **All cards on the battlefield, including Special Cards, go to controller's discard. Exception: Monsters keeps one.**
   - Files: `gameSlice.endRound:270-289` builds discard piles using board.cards + `weatherCards` (player-tagged) + `specialCardsOnBoard[player]` (player-keyed).
   - **Pre-flagged ❌ for Spy (`R-004`):** Opponent's-board sweep dumps spies into wrong discard.
   - **Pre-flagged 🕳️ for Monsters keep-one.**
6. **Winner of the round starts the next round.**
   - Files: `gameSlice.endRound:300` uses `Math.random()`.
   - **Pre-flagged ❌ (`R-001`).**
7. **§17.18 Skellige round-3 trigger** — at *start* of round 3, two random non-Hero discard cards return.
   - **Pre-flagged 🕳️.**

### AI symmetry checks

- Does `handleRoundEnd` care who owns Monsters/Skellige/Nilfgaard? With faction abilities unimplemented, the answer is "no — it treats both sides identically." Once implemented, must apply to whichever side has that faction (which is hardcoded for now).

### Predicted findings

- 1 × ❌ `R-001` (round starter random)
- 1 × ❌ `R-004` (Spy controller discard)
- 4 × 🕳️ for Monsters keep-one, Nilfgaard tie-win, NR draw-on-win, Skellige round-3 return

---

## Phase 6 — Game End

### Rule points (§8.4, §17.14)

1. **Game ends when a player has 0 gems.**
   - Files: `gameSlice.endRound:310-319` sets `gamePhase = 'gameEnd'`.
2. **Both lose last gem simultaneously → draw.**
   - Files: same. Verify the `gameScore` increment skips both on draw (line 314: `&& opponent.lives > 0` and converse — neither increments on simultaneous loss). Looks correct on initial scan.
3. **`R-008` — pre-decrement game-end detection in `ReduxGameManager.handleRoundEnd:111-142`.**
   - Verify exactly when the auto new-game `setTimeout` fires and whether it can fire when the game *isn't* actually over.

### Predicted findings

- 1 × ❌ `R-008`
- Possibly 1 × ⚠️ on auto-new-game `setTimeout` racing with `endRound` dispatch.

---

## Phase 7 — Faction Abilities (INVENTORY)

### Rule points (§11)

| Faction | Rule | Predicted status |
|---|---|---|
| Monsters | One non-Hero unit stays at round end (random) | 🕳️ |
| Nilfgaard | Wins on draw | 🕳️ |
| Northern Realms | Draws a card on round win | 🕳️ |
| Scoia'tael | Decides who goes first | 🕳️ (also affects `R-001`) |
| Skellige | Round-3 returns 2 random non-Hero discard cards | 🕳️ |

Files to grep: `gameSlice.ts`, `gameThunks.ts`, `useReduxAI.ts`, `strategy.ts`. Expectation per Phase 0: zero faction-keyed branches outside `deckBuilder`.

### Deliverable

A 5-row matrix in `07-faction-abilities.md`. For each: rulebook quote, code search results, predicted code-location *if implemented*, downstream rules dependent on it (e.g. Skellige depends on `R-010` side deck for some interactions).

---

## Phase 8 — Unit Abilities (MIXED DENSITY)

### Implemented abilities (verify dense)

| Ability | Files |
|---|---|
| **Agile** (§17.22) | `types/card.ts:81` `availableRows`; UI: `ReduxGameManager.handleRowClick:236`; AI: `UnitStrategy.evaluate:545` (no row choice) |
| **Commander's Horn (Unit)** | Treated identically to Special Horn via `hornActive` boolean; see Phase 9. Rule: doubles "all *other* Units" — verify whether the unit-horn unit excludes itself. |
| **Medic** (§17.2) | Human: `handlePlayerMedicChain` (`gameThunks.ts:456-562`); AI: `executeAIMedicChain` (`gameThunks.ts:284-338`) — `R-005` |
| **Morale Boost** (§17.7) | `gameHelpers.calculateUnitStrength:45-51`. Verify "excluding itself" — currently does `moraleBoostCount - 1` for self only |
| **Muster** (§17.11) | `gameThunks.handleMusterAction:341-359` + `useGameLogic.findMusterCards:12-50` — uses `name.startsWith` heuristic for variants |
| **Tight Bond** (§17.8) | `gameHelpers.calculateUnitStrength:35-37`; `calculateRowStrength:67-69` filters by name |
| **Scorch (Unit / SCORCH_CLOSE)** (§17.5) | `gameThunks.handleScorchCloseAction:398-429` + `gameHelpers.findCloseScorchTargets:325-372` |
| **Spy** (§17.3) | `gameThunks.handleSpyAction:243-258` — `R-004` |

### Unimplemented abilities (inventory)

| Ability | Rulebook | Status |
|---|---|---|
| **Summon** (§17.10) | Replacement on discard from side deck | 🕳️ — depends on `R-010` |
| **Berserker** (§17.9) | Removed from game; replaced from side deck when Mardroeme on row | 🕳️ — depends on `R-010` |
| **Mardroeme (Unit)** (§17.9) | Triggers Berserker on its row | 🕳️ |
| **Avenger** | (enum exists `CardAbility.AVENGER`; rulebook does not name "Avenger" — needs check vs Cow card description) | ⚠️ / 🕳️ |
| **Muster Roach** | (enum exists `CardAbility.MUSTER_ROACH`; Geralt has it — implies "summon Roach when Geralt enters") | 🕳️ |

### Pre-flagged

- `R-005` Medic — full asymmetry write-up.
- `R-004` Spy — controller discard bug.
- Tight Bond rule says "multiply by number of allies … (including itself)." Code's `sameNameCardsInRow > 1` then `*=` works because filter includes self in the count. Worked example check in Phase 12 will confirm.
- Morale Boost "excluding itself" — code does `moraleBoostCount - 1` only when card has Morale Boost. ⚠️ check: does this account for the rulebook §17.7 case "two Morale Boost units → each gives +1 to the other"? The current calc gives self-MB 1, others self+others MB count. Re-derive in Phase 8.
- Muster: `findMusterCards` uses `name.startsWith(baseCardName)` — fuzzy matching. Rulebook says "all specified cards (typically same-name)." Variant grouping is house-rule-ish; flag as 🤔.
- Medic: human-side allows Heroes? Rule says excludes Heroes. UI filter at `gameThunks.ts:519` filters `card.type === CardType.UNIT` (excludes HERO) — verify both sides match.

### AI symmetry checks

For every implemented ability, confirm both sides go through the same thunk. Already mapped in Phase 0 § 10 — Medic is the asymmetry hotspot.

---

## Phase 9 — Special Cards (MIXED)

### Rule points (§13)

| Card | Status |
|---|---|
| **Commander's Horn (Special)** | Implemented via `activateHorn` reducer; `hornActive` boolean — `R-009`. Rule: "only one per row" — verify code rejects second Horn (current `activateHorn` is idempotent set-true, which is OK if not flagged as wasted card). |
| **Decoy** | Implemented (`handleDecoyAction`). Rule: excludes Heroes, controller's side only. UI filter: `ReduxGameManager.handleBoardUnitClick:213` checks `card.ability === CardAbility.DECOY` and `card.type !== CardType.UNIT`. AI: `DecoyStrategy.findBestDecoyTarget:298` iterates `state.opponentBoard` — own side only ✓. |
| **Mardroeme (Special)** | 🕳️ |
| **Scorch (Special)** | Implemented (`handleScorchAction`). Rule: highest Strength on entire battlefield, excludes Heroes. `findScorchTargets:246-291` filters `card.type === CardType.UNIT` (excludes HERO ✓). |

### Pre-flagged

- Decoy human filter at `ReduxGameManager.handleBoardUnitClick:213` — `card.type !== CardType.UNIT` would reject Heroes (good) but also weather/horn special placeholders on the row. Verify Decoy can target a Tight Bond unit (UNIT type) ✓.
- Decoy AI (`DecoyStrategy:307-329`) skips units with no abilities AND strength ≤ 7. This means AI never decoys a 7-strength unit even if it would be advantageous — flag as 🤔.
- `R-009` — if a Horn unit is Decoyed, the row's `hornActive` boolean is not cleared. Need to verify whether `handleDecoyAction` resets the row's horn.
- Decoy on a **Spy on opponent's side** — rulebook §17.3 derives that opponent could Decoy your Spy. Since Spy ends up on opponent's board, but Decoy targets `controlling-player's-side`, there's a definitional question — current code restricts to own board for both human and AI; this matches the strict reading.

---

## Phase 10 — Weather (INVENTORY)

### Rule points (§14)

| Card | Status (predicted) |
|---|---|
| **Biting Frost** (Close → 1) | ✅ — `calculateUnitStrength:30-32` and `calculateRowStrength` driven by `hasFrost` |
| **Impenetrable Fog** (Ranged → 1) | ✅ |
| **Torrential Rain** (Siege → 1) | ✅ |
| **Skellige Storm** (Ranged + Siege → 1) | ❌ / 🕳️ — `calculateTotalScore:87-96` only checks FROST/FOG/RAIN |
| **Clear Weather** | ✅ — `clearWeatherEffects` reducer empties array and routes weather cards to discard |

### Pre-flagged

- Heroes immune to weather: `calculateUnitStrength:23-25` short-circuits for HERO ✓.
- King Bran half-weather (§17.12): 🕳️.
- Multiple weather active simultaneously: ✓ (array of effects).
- `R-003` — type duality of weather effects.

### AI symmetry

- `WeatherStrategy.evaluate:191-225` uses `calculateWeatherImpact` which uses `getWeatherAffectedRows` which DOES include `SKELLIGE_STORM`. So AI evaluates Skellige Storm as if it works; live game does not apply it. Asymmetry between AI's planning model and the live engine — flag as 🔀 + 🕳️.

---

## Phase 11 — Hero Immunity (CROSS-CUTTING MATRIX)

### Rule points (§6.3, §17.1, §18 quick-reference)

Heroes are immune to: Weather, Commander's Horn, Morale Boost, Scorch (both kinds), Decoy, Medic, Skellige return, Monsters keep-one, all Leader/Special/Unit abilities. Hero retains its OWN abilities.

### Deliverable

Matrix: ability × code-location × heroes-filtered? Format:

| Ability | File:Line | Filter expression | Hero-safe? |
|---|---|---|---|
| Weather (calc) | `gameHelpers.ts:23` | `if (card.type === CardType.HERO) return card.strength;` | ✅ |
| Horn (calc) | `gameHelpers.ts:40-42` | none — `if (hornActive) strength *= 2`. But the Hero short-circuit on line 23 returns early. | ✅ via short-circuit |
| Morale Boost (calc) | `gameHelpers.ts:45-51` | same short-circuit | ✅ |
| Scorch (Special) | `gameHelpers.findScorchTargets:257` | `if (card.type === CardType.UNIT)` | ✅ |
| Scorch (Close, unit) | `gameHelpers.findCloseScorchTargets:348` | same | ✅ |
| Decoy (UI filter human) | `ReduxGameManager.tsx:213` | `card.type !== CardType.UNIT` rejects HERO | ✅ |
| Decoy (AI filter) | `strategy.ts:303-305` | filters `card.type === CardType.UNIT` | ✅ |
| Medic (player UI filter) | `GameCardsSelector.tsx:86` | `card.type === CardType.UNIT` | ✅ |
| Medic (AI filter) | `strategy.ts:394-398` | `c.type === CardType.UNIT` ✓ | ✅ |
| Medic (thunk discard filter) | `gameThunks.ts:519` | same | ✅ |
| Skellige round-3 | n/a | 🕳️ | n/a |
| Monsters keep-one | n/a | 🕳️ | n/a |

Each row is a finding (✅ or otherwise). One asymmetry-check column per ability when human + AI have separate filters.

### Predicted findings

- Mostly ✅. Two 🕳️ rows for unimplemented Skellige/Monsters. Watch for: any path that treats DECOY-on-row (which is `CardType.SPECIAL` on the board) — does it confuse the strength calc? Decoy `playCardBasic` casts to UNIT (`gameThunks.ts:228-232` builds `decoyForBoard` with `type: CardType.UNIT, strength: 0`) — this means strength is fine, but it pollutes UNIT enumeration. Worth verifying.

---

## Phase 12 — Resolution Order (DENSE)

### Rule points (§15)

Order: Weather → Tight Bond → Morale Boost → Commander's Horn.

### Worked example (rulebook §15)

3× Tight Bond units, base Strength 4, +1 Morale Boost on row, Horn on row, no weather → each = 26.
With Biting Frost, Close Combat → each = 8.

### Files

- `gameHelpers.calculateUnitStrength:16-54` is the single primary calculator.
- `gameHelpers.calculateRowStrength:61-81` calls it.
- `gameHelpers.findScorchTargets:259-265` and `findCloseScorchTargets:350-359` call it (so Scorch sees post-modifier strength ✓ §17.5).
- `gameHelpers.findRowScorchTargets:303-310` also calls it.
- `gameHelpers.findHighestStrengthUnits:175-181` also calls it.

### Pre-flagged

- Code order in `calculateUnitStrength`: weather (line 30), tight bond (line 35), horn (line 40), morale boost (line 45). **This is Weather → Tight Bond → Horn → Morale Boost**, NOT the rulebook's Weather → Tight Bond → Morale Boost → Horn.

  For the worked example with no weather: 4 × 3 = 12; +1 = 13; ×2 = 26 (rulebook).
  Code: 4 × 3 = 12; ×2 = 24; +1 = 25. **MISMATCH.** This is a likely ❌ — confirm in Phase 12 with the trace.
- AI: `UnitStrategy.evaluateUnitValue:552-569` does its own miniature strength calc (no horn, no weather, no order). Asymmetric with the live engine — 🔀.
- `MedicStrategy` chain scoring sums `target.strength` directly — no order logic at all. Asymmetric with live.
- `R-003` — every caller must convert `activeWeatherEffects` to Set first.

### Predicted findings

- 1 × ❌ **major** — order swap (Horn before Morale Boost).
- 2 × 🔀 for AI's heuristic strength calcs vs live engine.

---

## Phase 13 — Specific Cards (INVENTORY-HEAVY)

### Cards (§16)

| Card | Status |
|---|---|
| **Clan Dimun Pirate** (whole-board Scorch, can't self-discard) | 🕳️ — no card data file exists for Skellige; no SCORCH-self-protect logic |
| **Eredin, Destroyer of Worlds** (Restore any Unit/Special, even Heroes) | 🕳️ — leader ability not in `LeaderAbility` enum |
| **Emhyr var Emreis, The Relentless** (Tutor any card from deck) | ⚠️/🕳️ — Emhyr leader is loaded by `defaultNilfgaardDeck:297` but `LeaderAbility` doesn't have a tutor entry; verify the leader's `ability` value resolves to anything wired. |
| **King Bran** (Friendly Units lose only half Strength in bad weather) | 🕳️ — image asset exists; no card data; no per-controller weather modifier exists |

### Predicted findings

All four → 🕳️, with Emhyr possibly being ⚠️ if his ability value silently defaults to a no-op.

---

## Phase 14 — Async / Race / Scheduling (DENSE)

### Topics (per scope-update spec)

1. Turn state machine — what states can a turn be in?
2. Turn-switch atomicity — can input fire mid-resolution?
3. Pass handling — both-passed window
4. Ability chains — Medic chain, Muster N-card placement
5. Animation vs state — `setTimeout` everywhere
6. React state batching — functional updates, stale closures
7. AI turn scheduling
8. AI thinking time — can user act during it?
9. Randomness — seeded? deterministic?
10. Input debounce
11. Round-end transactionality — multi-step atomicity
12. Leader active ability — once-per-game enforced by what?
13. Drag-and-drop — none in this codebase
14. AI interrupting itself — stale state in mid-decision

### Files

`useReduxAI.ts` (entire), `gameSlice.ts`, `gameThunks.ts`, `ReduxGameManager.tsx`.

### Pre-flagged

- `R-001` random in reducers — non-determinism.
- `R-002` round-end transition race.
- `R-007` `isAIMoving` cleared synchronously.
- `useReduxAI` `playCard` uses `gameState` from closure (line 87 `await new Promise(... setSelectedCard(null))` then dispatches with the captured `decision` — the dispatch itself goes through the thunk which reads fresh state, so the live thunk reads getState(). However, the AI's *decision* was made on the snapshot at hook-render-time — between the AI's `evaluateHand` and the thunk's dispatch, state may have changed. Worth checking whether anything can mutate state between these points (no — both player has passed already, no other actor).
- Multiple `setTimeout` chains stack up: AI useEffect (1000ms) → playCard wraps another setTimeout(500) → which wraps await on setTimeout(1000) → which dispatches the thunk.
- `handleRoundEnd` relies on `gameState` from selector read at component render — by the time `setTimeout(1000)` in line 132 fires, state may have changed.

### Predicted findings

- Many. This is the highest-finding-count phase along with 8.

---

## Phase 15 — Player vs AI Unification (DENSE)

### Deliverables (per scope expansion)

1. Duplicate function matrix.
2. Side-by-side traces.
3. Rule-per-rule asymmetry matrix.
4. "Dead giveaway" search results.
5. Order-of-operations parity check (live engine vs AI heuristic).

### Files to grep

Already mapped in Phase 0 § 10. Grep terms: `playCard`, `playCardAction`, `playCardBasic`, `applyCard`, `simulatePlay`, `calculateStrength`, `calculateRowStrength`, `calculateUnitStrength`, `calculateTotalScore`, `evaluateBoard`, `evaluateUnitValue`, `getRowStrength`, `findScorchTargets`, `findCloseScorchTargets`, `getLegalMoves`, `if (player ===`, `if (isPlayer)`, `'opponent'`, `state.opponent`.

### Pre-flagged duplicates

- `playCard` (legacy `useGameLogic.ts:131`) vs `playCardAction` (active `gameThunks.ts:82`). Legacy is dead but mirrors the active.
- Strength calcs: `calculateUnitStrength` (live) vs `UnitStrategy.evaluateUnitValue` (AI heuristic).
- Medic chains: `R-005`.
- Decoy target picking: UI vs `DecoyStrategy.findBestDecoyTarget`.
- `playerPass` vs `opponentPass` reducers — same body, different keys.

### Predicted findings

10+ entries in the matrix. The big 🔀 themes will be:
1. Medic chain.
2. Strength calc parity (especially relevant given the predicted ❌ in Phase 12).
3. Validation gates (AI bypasses `canPlayerAct`, `handleCardClick` filters).

---

## Phase 15b — Seat-Swap Latent Bugs

### File: `audit/15b-seat-swap-latent-bugs.md`

### Method

Grep entire `src/` for: `state.opponent`, `state.player`, `'opponent'`, `'player'`, `gameState.opponent`, `gameState.player`, `playerKey === 'player'`, `isPlayer`, `boardKey === 'playerBoard'`. Catalog every site. For each: would this still be correct if AI controlled the player seat? Would this still be correct if both seats were controlled by AI / by human?

### Categorisation

- **Display-only** (e.g. PlayerStatus rendering "Player" vs "Opponent"): not seat-swap-sensitive.
- **Symmetric mirror** (e.g. `playerPass` vs `opponentPass`): correct as-is, but doubled code.
- **AI-coupled** (`AIStrategyCoordinator` reading `state.opponent.*`): hardcoded — `R-006`.
- **Game-rule-correct asymmetry** (e.g. `setSelectedCard` only meaningful for human): correct behavior, not a bug.

### Predicted output

Long list. Most will be category 4 (correct asymmetry). Hot spots: `strategy.ts` (entire file is category 3). Anything in `gameThunks` that uses `'player'` literal vs `oppositePlayer` derivation should be checked for swap-safety.

---

## Phase 16 — AI Decision Engine (CODE-READING ONLY for unreachable factions)

### Topics (per original spec)

1. Information model — what does the AI see?
2. Decision algorithm — describe each strategy in 1 paragraph.
3. Pass strategy.
4. Cheating checklist (yes/no with file:line per item).
5. Faction consistency — code-read only (no behavior validation since only NR is reachable).
6. Target-selection asymmetry vs human UI.

### Files

`strategy.ts` (entire), `useReduxAI.ts` (entire).

### Pre-flagged from Phase 0

- AI does NOT read player's hand: `AIStrategyCoordinator.shouldPass:663-768` reads `state.player.hand.length` (count only, not contents). Need to check every other Strategy.
- AI's `shouldPass` reads `state.player.passed` and `state.player.hand.length` — both legitimate signals.
- AI starts with the same dealt deck (`gameThunks.initializeNewGame:46-47` builds both decks identically).
- Mulligan cap: `evaluateRedraw:631` loops `for (let i = 0; i < 2; i++)` — correctly capped at 2.
- Once-per-game leader: `LeaderStrategy:29` checks `card.used` ✓.
- Hero exclusion: see Phase 11 matrix; AI sides match.
- Spy controller routing: `R-004` — bug applies symmetrically to both AI and human Spies, so no AI-side cheating, just an across-the-board bug.
- Faction consistency: cannot exercise (NR-only). Code-read: faction-conditional logic does not exist anywhere outside `deckBuilder` switch — so the AI's faction would *not* receive its passive ability today regardless of what faction it was assigned. Answer: "structurally impossible to verify; faction abilities don't exist."

### Predicted findings

- 1 × ✅ no-cheating cluster (with caveats per item).
- 1 × ⚠️ for "faction-consistency unverifiable; faction abilities are themselves missing."
- 2–3 × 🔀 for target-selection asymmetries (already covered in 15).

---

## Phase 99 — Consolidated Findings + Scope of Work

### Deliverables

1. **`audit/99-findings.md`** — original deliverable. Adds 🕳️ as a section. Adds asymmetry section.
2. **`audit/scope-of-work.md`** — new. Organized by feature, not severity:
   - § Correctness fixes (R-IDs)
   - § Missing rule implementations (🕳️) grouped by rulebook section
   - § Architectural prerequisites (sideDeck, horn-card retention, unified medic resolver, faction hook points, seat abstraction)
   - § Deck-builder readiness (consolidated from Phase 2 subsection)
   - § Asymmetries to unify
   - § Three independent paths (correctness sweep / rule-completion / architectural)
3. **`audit/appendix-legacy.md`** — `GameManager.tsx`, `useAI.ts`, unreachable bits of `useGameLogic.ts`. Findings here NOT merged into `99-findings.md` unless still reachable from active stack.

---

## Density Calibration (mirrors scope-update guidance)

| Phase | Density | Why |
|---|---|---|
| 2 | Medium | Expanded but mostly missing-validator findings + side-deck flag |
| 3 | Medium | Small board, small file count |
| 4 | Medium | Rules-level only; deep async lives in 14 |
| **5** | **Dense** | Round-end is the most-touched path with multi-faction interactions |
| 6 | Medium | Small surface |
| 7 | Inventory | All 5 rows are 🕳️ |
| **8** | **Dense** | Implemented abilities (Medic, Spy, Muster, Tight Bond, Morale Boost, Scorch, Horn) need detailed traces |
| 9 | Mixed | Decoy / Special-Horn / Special-Scorch dense; Mardroeme inventory |
| 10 | Inventory | Skellige Storm + King Bran are notable |
| 11 | Medium-cross-cutting | Matrix only, bounded by the ability count |
| **12** | **Dense** | The order-swap is a likely high-impact ❌ |
| 13 | Inventory | Mostly 🕳️ |
| **14** | **Dense** | Highest-finding-count phase along with 8 |
| **15** | **Dense** | Two duplicate-function matrices |
| 15b | Medium | Largely categorisation |
| 16 | Medium | Cheating checklist is fast; faction-consistency answer is structural |

---

**End of Phase 1.** Stopping. Awaiting `continue` to begin Phase 2 (Deck and Setup with Deck-Builder Readiness subsection).
