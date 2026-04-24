# Phase 3 — Board, Zones, Row Placement, Agile

> Covers rulebook §5 (board), §6.5 (where cards are played), §9 (placement rules + immediate effects), §17.22 (Agile).

---

## Inputs

- Live render: `GameBoard.tsx`, `PlayerArea.tsx`, `PlayerHand.tsx`, `PlayerStatus.tsx`, `card/GwentCard.tsx`.
- State shape: `BoardState` / `BoardRow` / `PlayerState` in `types/card.ts`.
- Placement validators: `gameHelpers.canPlayInRow`, `gameHelpers.canPlayWeatherInRow`.
- Active player input: `ReduxGameManager.handleRowClick`, `handleBoardUnitClick`, `handleWeatherRowClick`.
- Active AI input: `UnitStrategy.evaluate`, `HeroStrategy.evaluate`, `WeatherStrategy.evaluate`, `CommanderHornStrategy.evaluate`.

---

## §5 — Per-Player Zones

### F-3.1  Combat rows present per player  ✅

> **Rule (§5.1–5.5):** Each player has Discard, Deck, Close (⚔), Ranged (🏹), Siege (💥) rows.

- **Code path:** `BoardState` (`types/card.ts:104-108`):
  ```ts
  export interface BoardState {
      close: BoardRow;
      ranged: BoardRow;
      siege: BoardRow;
  }
  ```
  `gameSlice.initialBoardState` (`gameSlice.ts:25-29`) initializes all three with `cards: [], hornActive: false`.
- **Asymmetry:** None — `playerBoard` and `opponentBoard` are structurally identical.

### F-3.2  Horn slot per row is a boolean, not a slot  🤔 ❌ — `R-009`

> **Rule (§5.6):** "Commander's Horn Slot — An adjacent slot on each row for playing a Special Commander's Horn card onto that row."

- **Code path:** `BoardRow` (`types/card.ts:99-102`):
  ```ts
  export interface BoardRow { cards: UnitCard[]; hornActive: boolean; }
  ```
  `gameSlice.activateHorn:243-250` sets `hornActive = true` on the row. The card itself is appended to a global `specialCardsOnBoard[player]` array (`gameSlice.ts:8-11`, populated by `playCardAction` Special branch at `gameThunks.ts:130-135`).
- **Observation:** The Horn-source card and the Horn effect are decoupled. Two consequences:
  1. There is no per-row "this row has Horn from card X" — only a boolean. If a Horn unit on the row should later be removed (Decoy/Scorch) and the Horn effect ends, the boolean cannot be reverse-derived from per-row state. `handleDecoyAction` (`gameThunks.ts:199-240`) does **not** check whether the decoyed unit was the Horn source, and `removeCardFromBoard` does not reset `hornActive`.
  2. The "only one Horn per row" rule (§17.6) is enforced implicitly because `activateHorn` is idempotent (set-true). A player can spend a second Horn card to no effect; the effect doesn't compound. The wasted second Horn does still land in `specialCardsOnBoard` and gets discarded at round end.
- **Asymmetry:** None — both seats use the same shape.
- **Proposed fix:** Either store the Horn source card per row (so removal can clear the effect), or compute `hornActive` from per-row card presence on every read. See `R-009`.

### F-3.3  Discard, Deck, Hand, Leader zones modeled  ✅

- **Code path:** `PlayerState` (`types/card.ts:110-119`): `deck, hand, discard, leader, passed, lives, faction, gameScore`. All present.
- **Observation:** ✓ structurally.

### F-3.4  Gem counters represented as `lives`  ✅

> **Rule (§5.8):** Gem Counters zone, starts with 2 gems.

- **Code path:** `PlayerState.lives: number`. Initialized to 2 in `gameSlice.initialPlayerState:14-23` and re-initialized in `initializeGame:73, 85`. Rendered in `PlayerStatus.tsx:86-89`.
- **Observation:** Naming is non-canonical but semantically correct. The rulebook calls them "gems"; the code calls them "lives." Pure cosmetic.

### F-3.5  Player Aid 1 / Player Aid 2 zones  🤷 (out of scope)

> **Rule (§5.9–5.10):** "Player Aid 1/2 — Reference card zone."

- **Code path:** None.
- **Observation:** These are physical reference card slots. A digital implementation has no use for them. Not a finding; recorded for completeness.

### F-3.6  Scoring Ladder modeled as a single number  ✅

> **Rule (§5.7, §10):** Tens token + Ones token + flip-to-100. Just a digit display.

- **Code path:** `PlayerStatus.tsx:101-103` renders `{totalScore}` from `calculateTotalScore`. The 10s/1s breakdown is irrelevant to a digital UI.

### F-3.7  Side-deck zone missing  🕳️ — `R-010`

> **Rule (§4 "The Side Deck"):** Side deck sits next to the play area.

- Already covered in F-2.3. Re-cited here as the per-board zone is also absent from `BoardState`.

---

## §5 — Shared Weather Zone

### F-3.8  Shared weather area present  ✅ (with caveats from `R-003`)

> **Rule (§5.12):** "Weather Cards area — A central zone on the board where face-up Weather cards apply to both players' matching rows."

- **Code path:**
  - State: `gameSlice.activeWeatherEffects: CardAbility[]` and `gameSlice.weatherCards: Array<{ card; player }>` (`gameSlice.ts:5-11`).
  - Render: `GameBoard.tsx:152-166` iterates `Array.from(gameState.activeWeatherEffects)` (the Set view) and renders one `GwentCard` per effect.
- **Observation:** Renders correctly. Effects are global (apply to both players' matching rows) — the `calculateRowStrength` callers pass a single `weatherEffect: boolean` per row, derived from `weatherEffects.has(...)` at `gameHelpers.ts:88-94`. ✓
- **Note:** The `activeWeatherEffects` type duality (`Set<CardAbility>` in `GameState` vs `CardAbility[]` in Redux) — `R-003` — bites here at every conversion site (`GameBoard.tsx:154`, `ReduxGameManager.tsx:103, 104, 363, 406`).

---

## §5 — Board Layout Orientation

### F-3.9  Opponent rows reversed for "Close nearest middle"  ✅

> **Rule (§5 "Board Layout Orientation"):** "Each player's Close Combat row is closest to the middle line."

- **Code path:** `PlayerArea.tsx:104-124`:
  ```ts
  if (isOpponent) {
    return ( … {renderRow(SIEGE)} {renderRow(RANGED)} {renderRow(CLOSE)} … );
  }
  return ( … {renderRow(CLOSE)} {renderRow(RANGED)} {renderRow(SIEGE)} … );
  ```
- **Observation:** Player's Close is at the top of their half (closest to the centre line, since the centre weather row sits between the two `PlayerArea`s); opponent's Close is at the bottom of their half (also closest to the centre). ✓

---

## §6.5 / §9 — Where Cards Are Played

### F-3.10  Units placed on row matching range icon  ✅ (with row-validation gap)

> **Rule (§6.5):** "Units are played to the row matching their range icon."

- **Human path:**
  - `PlayerArea.canClickRow:51-62` allows the click only if the selected card is a SPECIAL with FROST/FOG/RAIN matching that row, OR any other case (returns `true`). It **does not validate that a UNIT can play to this row** — that's pushed into `handleRowClick`.
  - `ReduxGameManager.handleRowClick:236` checks `if (unitCard.row === row || unitCard.availableRows?.includes(row))`. If false, the function silently returns without dispatching anything. ✓
- **AI path:**
  - `playCardAction` thunk (`gameThunks.ts:163-194`) **does not re-validate** that `card.row === row` or that `availableRows` includes `row`. It assumes the caller picked a legal row. The AI strategies always supply `row: unitCard.row` (the printed row), so the AI is self-consistent.
- **Observation:** Validation lives at the UI handler level only. If `playCardAction` were invoked from a future surface that didn't pre-validate (e.g. a network sync, scripted test), an illegal row placement could land. The asymmetry is structural rather than behavioural — the AI never *attempts* an illegal row. Mention as ⚠️ for defensive validation.
- **Proposed fix:** Add a `canPlayInRow` check to `playCardAction` before `playCardBasic`. (Audit-only.)

### F-3.11  Special row-based cards (Horn / Decoy / Scorch / Mardroeme) — placement model  ⚠️

> **Rule (§6.5):** "Special row-based cards (Commander's Horn, Decoy, Scorch, Mardroeme) are played directly to a combat row."

- **Code path:** Mostly correct.
  - **Horn:** `playCardAction` Special / `COMMANDERS_HORN` branch (`gameThunks.ts:130-136`) requires `row` and dispatches `activateHorn({player, row})` plus `addSpecialCardToBoard`. UI passes the selected row via `handleRowClick:264-270`.
  - **Decoy:** Played to a unit, not a row directly — `handleDecoyAction` (`gameThunks.ts:199-240`) finds the row from the target card and places the Decoy placeholder there. ✓
  - **Scorch (Special):** `handleScorchAction` (`gameThunks.ts:362-395`) has whole-battlefield reach; no row required. ✓ The UI's `handleRowClick:281-285` calls `playCardAction` with no row for Scorch — correct.
  - **Mardroeme:** 🕳️ — see Phase 9.
- **Observation:** Scorch (Special) and Decoy are not "played to a row" in the same UI sense as Horn — Scorch is global, Decoy targets a unit. The rulebook's wording "row-based" is ambiguous; code interpretation looks reasonable. ⚠️ for documentation only.

### F-3.12  Weather cards play to the shared weather row  ✅

> **Rule (§6.5):** "Weather cards are played face-up to the shared Weather Cards area and affect both players' matching rows."

- **Human path:** Two surfaces.
  1. Click a combat row whose row-type matches the weather (e.g. click Close while holding Frost). Validated in `ReduxGameManager.handleRowClick:271-279` via `canPlayWeatherInRow`. Dispatches `playCardAction({card: specialCard})` with NO row argument.
  2. Click the central weather row directly. Handled in `handleWeatherRowClick:295` — accepts FROST/FOG/RAIN/CLEAR_WEATHER without row-type check.
  - The dispatch path ends in `playCardAction` Special branch (`gameThunks.ts:138-150`) which adds the effect and the weather card to `weatherCards`.
- **AI path:** `WeatherStrategy.evaluate:191-225` returns a `PlayDecision` with no `row`. `useReduxAI.playCard:83-106` dispatches with no row. ✓
- **Observation:** Both surfaces work. There is a redundant validation gate on path 1; path 2 accepts any row-type weather card without row-type filtering. Since weather cards apply to a fixed row globally regardless of which combat row you clicked, the row-type filter on path 1 is cosmetic — but it does prevent the human from "throwing" a Frost card via the wrong combat row.
- **Note:** Per F-3.10, no defensive re-check in `playCardAction`.

### F-3.13  Card abilities resolve immediately on play  ✅

> **Rule (§6.2, §9):** "When a Unit is placed, its Strength is added to the player's total for that round, and its ability (if any) resolves immediately."

- **Code path:** `playCardAction` thunk dispatches the ability-specific sub-thunk (`handleSpyAction`, `handleMedicAction`, etc.) synchronously after `playCardBasic`. Strength contribution is automatic via `calculateTotalScore` on the next render — no separate "add to total" step.
- **Observation:** Conformant in shape. Phase 8 will audit each ability's correctness.

### F-3.14  "All card effects must be applied if possible" — partial enforcement  ❌ 🔀

> **Rule (§6.5):** "All card effects must be applied if possible — you cannot 'choose not to' resolve an ability that can trigger."

- **Human path counterexample — Medic:** When the human plays a Medic with non-empty discard, `ReduxGameManager.handleRowClick:238-247` opens the Medic selector modal. The user can press Cancel (`GameCardsSelector.tsx:192-203`), which routes through `handleSetGameState`'s "medic cancel" path (`ReduxGameManager.tsx:368-376`) and ultimately calls `playMedicWithoutRevival` (`gameThunks.ts:565-581`). The Medic lands but its ability is **not applied** — even though the discard pile contained legal targets. Rule says you can't choose not to.
- **AI path:** AI's Medic always picks a target if one exists — `MedicStrategy.simulateMedicChain:379-457` returns `targets: []` only when no legal target exists.
- **Asymmetry:** 🔀 — human can decline a Medic effect; AI cannot.
- **Proposed fix:** Remove the Cancel-to-skip-Medic affordance; if the human plays a Medic with legal targets, force a target selection.

---

## §17.22 — Agile

### F-3.15  Agile placement asymmetry — human can choose; AI always picks printed row  🔀 (observable)

> **Rule (§17.22):** "Agile: Place on either the Close Combat or Ranged Combat row. Cannot be moved once placed."

- **Card data:** Only one card has `availableRows`: **Olgierd von Everec** at `neutral.ts:128-134` (`row: CLOSE`, `availableRows: [CLOSE, RANGED]`, `ability: MORALE_BOOST`). Olgierd is included in **both hardcoded decks** — `deckBuilder.ts:159-160` (NR) and `:211-212` (NG). Note the card's `ability` is `MORALE_BOOST`, not `AGILE` — `availableRows` is the actual mechanism for Agile placement.
- **Human path:** `ReduxGameManager.handleRowClick:236`:
  ```ts
  if (unitCard.row === row || unitCard.availableRows?.includes(row)) { … dispatch(playCardAction({…})) }
  ```
  Allows Close or Ranged for Olgierd. ✓
- **AI path:** `UnitStrategy.evaluate:545-549`:
  ```ts
  return {
      card: unitCard,
      row: unitCard.row,        // always the printed row, ignores availableRows
      score
  };
  ```
  `evaluateUnitValue:552-569` also reads `state.opponentBoard[card.row]` (line 556, 564) — so even the score is computed only against the printed row, never the alternative.
- **Observation:** This is a 🔀 asymmetry that is **observable in current production** — Olgierd is in the AI's deck (NR-vs-NR via shared neutral inclusion) and the AI never considers placing him on Ranged.

#### Concrete suboptimal scenario (per carry-forward 2)

Setup:
- Biting Frost active on Close Combat (Close units capped at 1).
- AI's Close row has 2 other units, each printed strength 1 → with Frost, both at 1.
- AI's Ranged row has 1 unit, printed strength 5 → no Fog, at 5.
- AI's hand contains Olgierd (printed strength 6, Morale Boost, Close, also Ranged).

AI's actual play: Close (printed row).
- Olgierd lands at strength 1 (Frost overrides his 6).
- Morale Boost adds +1 to other Close cards (excluding self).
- Other Close cards: 1 + 1 = 2 each → Close total 1 + 2 + 2 = 5.
- Ranged total: 5.
- AI grand total: 10.

Counterfactual: Ranged placement.
- Olgierd lands at strength 6 (no Fog).
- Morale Boost adds +1 to Ranged units.
- Ranged: 6 + (5 + 1) = 12.
- Close: 1 + 1 = 2 (no boost source).
- AI grand total: 14.

**Difference: 4 strength left on the table by the AI's fixed-row choice.** Reproducible in the current NR-vs-NR matchup any time AI holds Olgierd while Frost is active.

- **Proposed fix:** Strategy classes should iterate `availableRows ?? [unitCard.row]` and pick the one that maximises score, computed against the appropriate row's actual cards / weather.

### F-3.16  "Cannot be moved once placed" — implicitly enforced  ✅

- **Code path:** No "move card" action exists anywhere. `playCardBasic` adds; `removeCardFromBoard` removes; nothing relocates.
- **Observation:** Rule satisfied by absence-of-feature.

### F-3.17  Agile + Decoy re-placement re-allows the choice  ✅ (for human only — 🔀 inherits F-3.15)

> **Rule (§17.22 [Derived]):** "Decoy bounces the Agile unit back to your hand. Next placement is fresh — you can choose a different row this time."

- **Human path:** Decoy bounces Olgierd to hand (`handleDecoyAction:222-233`). On replay, `handleRowClick:236` re-checks `availableRows`. Free choice ✓.
- **AI path:** Same Olgierd will again be placed at his printed row (Close) — see F-3.15.
- **Observation:** The bounce-back Decoy refresh works; the refresh is just as constrained for AI as the original placement.

### F-3.18  Agile + DECOY ability marker  ✅ (latent fact)

- The placeholder Decoy on a board row is built as `{...decoyCard, type: CardType.UNIT, strength: 0}` in `gameThunks.ts:228-232`, retaining `ability: DECOY`. It does not have `availableRows`. If anyone ever bounced a Decoy (it's a Special; can't), this would not matter. Recorded for completeness.

---

## R-011 Surface Check (Phase 3-touched code only)

The following ID-equality lookups are in code paths Phase 3 audits. Per scope expansion, these are flagged but not exhaustively triaged — Phase 15 will sweep R-011 cascades.

| Site | Code | Behaviour with duplicate IDs |
|---|---|---|
| `PlayerHand.tsx:37` | `selectedCard?.id === card.id` | Visual-only. Two same-id cards in hand both render with `isSelected`. Cosmetic. |
| `ReduxGameManager.tsx:157` | `playerHand.find(c => c.id === card.id)` | Gates click; `find` returns first match. The second copy is technically unclickable on its own — clicking it selects the first-found instance. Functional impact: minor (the cards are interchangeable references). |
| `ReduxGameManager.tsx:161` | `selectedCard?.id === card.id` | Visual deselection. Both copies un-highlight together. |
| `gameThunks.ts:211` (Decoy `targetRow` lookup) | `rowState.cards.some(c => c.id === targetCard.id)` | Returns true if at least one matches. **`removeCardFromBoard` uses filter-by-id (`gameSlice.ts:357`) which removes ALL copies.** A duplicate on the board would be over-removed. Mulligan does not duplicate cards onto the board directly, so this is latent. |
| `playCardBasic` deck/hand mutations | `.filter(c => c.id !== card.id)` | Removes all duplicates from hand/deck on play; can leak side-effects if two copies of the same card existed. |
| AI's `MedicStrategy` chain dedup | `chainedCards.has(initialCard.id)` (`strategy.ts:385, 391`) | If the same id appears twice in `state.opponent.discard`, the dedup set still works — but the `validTargets.filter(c => !chainedCards.has(c.id))` can produce double-counts for unique IDs. |
| `gameThunks.ts:383` (Scorch row search) | `row.cards.some(c => c.id === target.id)` | Same shape as Decoy lookup — true on first match; subsequent removal removes all copies. |

**Conclusion for Phase 3:** The standard remove-by-id pattern (`array.filter(c => c.id !== cardId)`) does not break with duplicates per se — it just removes all copies at once. The risk is that a card "leaves" the board faster than a player expects. Track via `R-011` for Phase 15.

---

## Phase 3 Findings Summary

| ID | Status | Rule | Title |
|---|---|---|---|
| F-3.1 | ✅ | §5.3-5.5 | Combat rows present per player |
| F-3.2 | 🤔/❌ `R-009` | §5.6 | Horn slot is a boolean, not a card slot |
| F-3.3 | ✅ | §5 | Discard, Deck, Hand, Leader zones modeled |
| F-3.4 | ✅ | §5.8 | Gem counters represented as `lives` |
| F-3.5 | 🤷 | §5.9-10 | Player Aid zones — physical-only, N/A |
| F-3.6 | ✅ | §5.7 | Scoring Ladder modeled as a single number |
| F-3.7 | 🕳️ `R-010` | §4 side deck | Side-deck zone missing |
| F-3.8 | ✅ (with `R-003`) | §5.12 | Shared weather area present |
| F-3.9 | ✅ | §5 layout | Opponent rows reversed for "Close nearest middle" |
| F-3.10 | ✅ + ⚠️ | §6.5, §9 | Units placed on row matching range icon; row validation only at UI layer |
| F-3.11 | ⚠️ | §6.5 | Special row-based card placement model |
| F-3.12 | ✅ | §6.5 | Weather cards play to the shared weather row |
| F-3.13 | ✅ | §6.2, §9 | Card abilities resolve immediately on play |
| F-3.14 | ❌ 🔀 | §6.5 "must apply" | Human can Cancel a Medic with valid targets; AI cannot |
| F-3.15 | 🔀 (observable) | §17.22 | Agile placement: human can choose; AI always picks printed row — concrete 4-point Olgierd-under-Frost trace |
| F-3.16 | ✅ | §17.22 | "Cannot be moved once placed" — no move action exists |
| F-3.17 | ✅ + 🔀 (inherits F-3.15) | §17.22 derived | Decoy refresh re-allows choice — but AI still constrained |
| F-3.18 | (latent) | — | Decoy placeholder has no `availableRows` (won't matter) |

**Counts:** ✅ 9 — ⚠️ 2 — ❌ 1 (F-3.14, upgraded per carry-forward) — 🔀 2 (one observable) — 🤔/❌ 1 — 🕳️ 1 — 🤷 1 — latent 1.

**Top single finding:** F-3.15 — observable Agile asymmetry on Olgierd, with concrete 4-point loss under Frost. This is the first 🔀 with a reproducible production trace.

**R-009 cited:** F-3.2.
**R-010 cited:** F-3.7.
**R-003 cited:** F-3.8.
**R-011 surface flagged:** § "R-011 Surface Check" above; full sweep deferred to Phase 15.

---

**End of Phase 3.** Stopping. Awaiting `continue` to begin Phase 4 (Turn Flow — rules level only; deep async deferred to Phase 14).
