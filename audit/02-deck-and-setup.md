# Phase 2 — Deck Construction, Setup, and Mulligan

> Covers rulebook §3 (factions), §4 (deck construction + side deck), §7 (starting the game).
> Adds **Deck-Builder Readiness** subsection per scope expansion.

---

## Inputs

- Live game flow: `App.tsx` → `ReduxGameManager` → `useReduxAI` + `gameThunks`.
- Hardcoded deck assembly: `src/utils/deckBuilder.ts` (only `NORTHERN_REALMS` and `NILFGAARD` branches; default throws).
- Active code path uses `Faction.NORTHERN_REALMS` for **both** seats — `gameThunks.ts:46-47`.
- Card data: `src/data/cards/{neutral,northern-realms,nilfgaardian-empire}.ts`. Other 3 factions absent.

---

## Composition Snapshot — what the hardcoded NR deck actually contains

Walking `defaultNorthernRealmsDeck` at `deckBuilder.ts:25-166` line by line:

| Entry | Source | Count | Result |
|---|---|---|---|
| Vernon Roche | `northernRealmsDeck.heroes.find('Vernon Roche')` | 1 | found ✓ |
| Esterad Thyssen | `…heroes.find('Esterad Thyssen')` | 1 | found ✓ |
| Philippa Eilhart | `…heroes.find('Philippa Eilhart')` | 1 | found ✓ |
| **Keira Metz** | `…heroes.find('Keira Metz')` | 1 | **`undefined`** — Keira Metz is in `northernRealmsUnits` (`northern-realms.ts:217-225`), **not** in `northernRealmsHeroes`. The `if (keiraMetz)` guard at `deckBuilder.ts:41` silently skips. |
| Geralt of Rivia | neutral heroes | 1 | found ✓ |
| Triss Merigold | neutral heroes | 1 | found ✓ |
| Mysterious Elf | neutral heroes | 1 | found ✓ |
| Spies × 3 | NR units (Prince Stennis, Sigismund, Thaler) | 3 | found |
| Dun Banner Medic | NR units, copies | 5 | |
| Blue Stripes Commando | NR units, copies | 3 | |
| Crinfrid Reavers Dragon Hunter | NR units, copies | 3 | |
| Catapult | NR units, copies | 2 | |
| Decoy | neutral specials, copies | 2 | |
| Commander's Horn | neutral specials, copies | 2 | |
| Scorch | neutral specials, copies | 2 | |
| Biting Frost | neutral specials | 1 | |
| Impenetrable Fog | neutral specials | 1 | |
| Gaunter O'Dimm: Darkness | neutral units, copies | 2 | |
| Gaunter O'Dimm | neutral units | 1 | |
| Villentretenmerth | neutral units | 1 | |
| Olgierd von Everec | neutral units | 1 | |

**Totals (with Keira-Metz bug):** 6 hero + 21 non-hero unit + 8 special = 35 cards in deck, plus 1 leader (`Foltest: Lord Commander of The North` → ability `CLEAR_WEATHER`).

For Nilfgaard at `deckBuilder.ts:168-303`:

| Entry | Result |
|---|---|
| **Emhyr var Emreis** | `nilfgaardianEmpireDeck.heroes.find('Emhyr var Emreis')` returns **`undefined`** — Emhyr is in `nilfgaardianEmpireLeaders`, not `nilfgaardianEmpireHeroes` (`nilfgaardian-empire.ts:4-46`). Silently skipped. |

**NG totals:** 7 hero + 16 non-hero unit + 10 special = 33 cards, plus 1 leader (`Emhyr: The Relentless` → `DRAW_OPPONENT_DISCARD`).

---

## Findings — Rulebook §4 (Deck Construction)

### F-2.1  Deck-composition validator missing  🕳️

> **Rule (§4):** "A legal deck must contain: Exactly 1 Leader Card; At least 22 Unit Cards (minimum); At most 10 Special Cards (maximum)."

- **Human code path:** No validator. Hardcoded NR deck satisfies `≥22 units` and `≤10 specials`. `validateUniqueCardIds` (`cardHelpers.ts:60-79`) checks ID uniqueness only (`gameThunks.ts:55-66`).
- **AI code path:** Same — both decks share the same builder.
- **Observation:** Composition is upheld today by virtue of the deck being hardcoded and never edited. There is no function `validateDeckComposition(deck, leader)` that asserts the §4 limits. Once a deck-builder UI exists, this becomes a hole.
- **Proposed fix:** Author a validator that returns a structured result (counts + violations). See Deck-Builder Readiness § for placement question.

### F-2.2  Faction-color validator missing  🕳️ ❓

> **Rule (§3):** "All cards in a deck must show the chosen faction's color."

- **Code path:** None. Cards have a `faction: Faction` field (`types/card.ts:71`); no code asserts homogeneity.
- **Observation:** The hardcoded NR deck legitimately includes neutrals (Geralt, Triss, Mysterious Elf, Gaunter, Olgierd, Villentretenmerth, Dandelion class). The rulebook quoted above is strict about "the chosen faction's color." The rulebook quoted in this repo does not explicitly carve out neutrals as exempt — but the standard physical Gwent allows neutrals universally. **Flag as ❓ Rulebook silent on neutrals** (gwent-rules.md never names "Neutral" as a faction).
- **Both seats hit this.** No asymmetry; both decks include neutrals.
- **Proposed fix:** Decide neutral policy with the rulebook author; then add a validator that allows neutrals if the policy permits.

### F-2.3  Side-Deck infrastructure missing  🕳️ — `R-010`

> **Rule (§4 "The Side Deck"):** "Some cards can transform into or summon other cards (e.g. Skellige's Berserkers, units with Summon). The replacement/target cards may not start in the main deck — they are kept in a side deck next to the play area until triggered."

- **Code path:** `PlayerState` (`types/card.ts:110-119`) has `deck, hand, discard, leader, passed, lives, faction, gameScore`. **No `sideDeck` field.** `DeckWithLeader` interface (`deckBuilder.ts:7-10`) returns `{ deck, leader }`. No side-deck plumbing in `gameSlice` initial state.
- **Observation:** Without `sideDeck`, every Summon/Berserker/Skellige-starter mechanic is structurally impossible. Listed under root cause `R-010`.
- **Proposed fix:** Add `sideDeck: Card[]` to `PlayerState`; thread through `initializeGame`, `endRound`, and the per-card hooks for Summon (when implemented) and Berserker.
- **Downstream phases blocked:** Phase 8 (Summon, Berserker), Phase 9 (Mardroeme triggering Berserker), Phase 13 (Skellige starter mechanics).

### F-2.4  Starter-star / side-deck-star marking missing  🕳️

> **Rule (§3 "Pre-Constructed (Starter) Decks"):** "Cards belonging to a faction's starter deck are marked with a white star in the bottom-left corner. Skellige starter cards with a black star are reserved for the Side Deck."

- **Code path:** `BaseCard` (`types/card.ts:67-74`): `id, name, faction, type, imageUrl, description?`. **No `starter`, no `sideDeckOnly`, no `blackStar` field.**
- **Observation:** A future deck-builder cannot distinguish starter cards from constructed-only cards, nor side-deck-eligible cards from main-deck cards. Card data files would need to grow these fields.
- **Proposed fix:** Add optional `starter?: boolean` and `sideDeck?: boolean` to `BaseCard`; backfill on existing card data.

### F-2.5  Keira Metz silently dropped from NR deck  ❌

> **Rule (none — implementation bug.)**

- **Human code path:** `deckBuilder.ts:37` `northernRealmsDeck.heroes.find(h => h.name === 'Keira Metz')` returns `undefined`. Keira Metz is at `northern-realms.ts:217-226` in `northernRealmsUnits`, with `type: CardType.UNIT, ability: NONE` (clearly not a Hero — Heroes have `Hero:` description prefixes; Keira does not).
- **AI code path:** Same — both seats are NR.
- **Observation:** The deck-author's intent (judging from the call site clustering with Vernon Roche, Esterad Thyssen, Philippa Eilhart) was to include Keira Metz as a Hero. Either Keira should be moved to `northernRealmsHeroes`, or the call should be removed. Today the deck is missing one card.
- **Proposed fix:** Choose a single source of truth. (Audit-only — no fix.)

### F-2.6  Emhyr var Emreis silently dropped from NG deck  ❌

> **Rule (none — implementation bug.)**

- **Human code path:** `deckBuilder.ts:182` `nilfgaardianEmpireDeck.heroes.find(h => h.name === 'Emhyr var Emreis')` returns `undefined`. Emhyr is in `nilfgaardianEmpireLeaders`, not `…heroes` (`nilfgaardian-empire.ts:4-46`).
- **AI code path:** Same (NG path is unreachable in active code, but the bug exists).
- **Observation:** Same class as F-2.5. Mitigated only by NG being unreachable.
- **Proposed fix:** As F-2.5.

### F-2.7  No deck-builder UI; deck is fixed  🕳️

> **Rule (§3):** Implies the player chooses a faction and constructs a deck.

- **Code path:** No deck editor; faction is hardcoded. `gameThunks.initializeNewGame:46-47`.
- **Observation:** Out of scope for this audit but documented for the deck-builder roadmap.
- **Proposed fix:** Future feature.

---

## Findings — Rulebook §7 (Starting the Game)

### F-2.8  Coin-flip → first player uses `Math.random()` in reducer  ❌ — `R-001`

> **Rule (§7.1):** "Coin flip to determine the first player. Some Leader or Faction abilities may override this (notably Scoia'tael)."

- **Human + AI code path:** `gameSlice.initializeGame:90` → `state.currentTurn = Math.random() < 0.5 ? 'player' : 'opponent'`. Same line is also in the legacy `GameManager.tsx:38, 149, 193`.
- **Observation:** A coin flip is acceptable in spirit, but doing it inside a reducer makes the reducer impure (defeats Redux time-travel and tests). More importantly, the **same reducer also re-rolls `currentTurn` at `gameSlice.endRound:300`** — see Phase 5 — which violates §8.3 ("winner of the round starts the next round"). Phase 2 finding here addresses only the §7.1 coin flip.
- **Asymmetry note:** No asymmetry — both seats flip together.
- **Proposed fix:** Move the RNG out of the reducer (inject seed via thunk payload). Track per-round-winner separately so Phase 5's winner-starts-next-round rule can be honoured. See `R-001`.

### F-2.9  Scoia'tael first-player override missing  🕳️

> **Rule (§11 + §17.15):** "Scoia'tael decides who goes first at the start of the game (overrides the coin flip)."

- **Code path:** None. `Faction.SCOIATAEL` appears in `types/card.ts:5` and `PlayerStatus.tsx:56`, never elsewhere.
- **Observation:** Scoia'tael cards do not exist (`src/data/cards/scoiatael.*` absent), and even if they did, the initialize-game code has no faction-keyed branch to pick first player.
- **Proposed fix:** When implementing faction abilities (Phase 7 cluster), add a hook in `initializeGame` that consults faction + leader. See architectural prerequisites in `scope-of-work.md`.

### F-2.10  Starting hand of 10 cards  ✅

> **Rule (§7.2):** "Each player shuffles their deck and draws 10 cards. This hand will be used for the entire game (across up to 3 rounds)."

- **Human + AI code path:** `gameSlice.initializeGame:67-68, 79-80` slices `playerDeck.slice(0, 10)` into `hand` and `playerDeck.slice(10)` into `deck`. Identical for opponent.
- **Observation:** Correct in count. The `playerDeck` argument was already shuffled by the thunk (`gameThunks.ts:49-50`). ✓
- **Asymmetry note:** None.

### F-2.11  Hand persists across rounds  ✅

> **Rule (§7.2):** "you do not re-draw at the start of later rounds (except via abilities that draw cards)."

- **Code path:** `gameSlice.endRound:253-320` resets `passed`, decrements `lives`, sweeps board to discard, increments `currentRound`, but **does not modify `state.player.hand` or `state.opponent.hand`**.
- **Observation:** Hand carry-over is preserved by absence-of-mutation. Spies that drew extra cards retain them across rounds. Northern Realms's win-draw rule (§11) is missing (🕳️ Phase 7), so no mid-round draw to break the invariant. ✓

---

## Mulligan (DENSE — bug found)

### F-2.12  Mulligan reducer ignores shuffled deck — duplicates and lost cards  ❌

> **Rule (§7.3):** "Each player may then discard up to 2 cards from their hand and draw the same number from their deck. … The discarded cards are reshuffled back into the deck after the mulligan."

#### Human path — exact code

`gameThunks.handlePlayerRedraw` at `gameThunks.ts:432-453`:

```ts
const newDeck = [...gameState.player.deck, ...selectedCards];
const shuffledDeck = shuffle(newDeck);
const drawnCards = shuffledDeck.slice(0, selectedCards.length);

dispatch({
  type: 'game/redrawCards',
  payload: {
    player: 'player',
    cardsToRedraw: selectedCards,
    newCards: drawnCards
  }
});
```

`gameSlice.redrawCards` at `gameSlice.ts:184-203`:

```ts
playerState.hand = playerState.hand.filter(
  card => !cardsToRedraw.some(redrawCard => redrawCard.id === card.id)
);
playerState.hand.push(...newCards);

playerState.deck = playerState.deck.slice(newCards.length);   // ← unshuffled
playerState.deck.push(...cardsToRedraw);
```

#### AI path — same shape

`useReduxAI.handleAIRedraw` at `useReduxAI.ts:50-75`:

```ts
const newDeck = [...gameState.opponent.deck, ...cardsToRedraw];
const shuffledDeck = shuffle(newDeck);
const drawnCards = shuffledDeck.slice(0, cardsToRedraw.length);

dispatch(redrawCards({ player: 'opponent', cardsToRedraw, newCards: drawnCards }));
```

Same reducer.

#### Observation

The thunk *computes* `shuffledDeck` but **only sends `drawnCards` (the first `N` of the shuffled array) to the reducer**. The reducer's `playerState.deck.slice(newCards.length)` operates on the **unshuffled** original deck. Concrete trace with original deck `[A, B, C, D, E, …]`, `cardsToRedraw = [X]`, and a hypothetical shuffle `[C, A, X, D, B, E, …]`:

- `drawnCards = [C]`.
- After reducer: `hand = (oldHand − X) + [C]` → hand has `C`.
- After reducer: `deck = [B, C, D, E, …] + [X]` → **deck still has `C` at position 1**.
- Card `A` (was at position 0) is gone from both hand and deck → **lost**.

Because card IDs are stable references built once at deck creation (`generateUniqueCardId` in `cardHelpers.ts:10-18`), the duplicated card in hand and deck has the **same `id`**. `validateUniqueCardIds` runs at game-init (`gameThunks.ts:55-66`), not after mulligan, so the duplication is not caught at runtime.

Total card count is preserved (one in, one out per side), but the membership is wrong: in the average case, ≈⌈N(D−N+1)/(D+1)⌉ duplications and equal losses per mulligan, where `D = len(deck) − 10`.

**The legacy stack does this correctly** — `GameManager.handleRedraw` at `GameManager.tsx:573-606` slices `shuffledDeck.slice(selectedCards.length)` for `remainingDeck` and writes it back to state. The Redux rewrite split thunk and reducer and lost the shuffled view across the boundary.

#### Asymmetry note

🟰 Symmetric — both human and AI mulligans are broken in the same way. Not a 🔀.

#### Proposed fix

Pass the post-shuffle `remainingDeck` (i.e. `shuffledDeck.slice(N)`) to the reducer instead of recomputing the deck inside the reducer. Or: do all redraw logic inside the reducer with a deterministic seed.

### F-2.13  Mulligan capped at 2 cards  ✅

> **Rule (§7.3):** "discard up to 2 cards … This can be done one at a time."

- **Human:** `ReduxGameManager.handleRedraw:331-339` increments `redrawCount`; checks `if (redrawCount >= 1)` to advance phase. Initial value 0; first redraw → 1 (modal stays open); second redraw → 2 (modal closes). Cap = 2 ✓. Player can also Cancel via `GameCardsSelector.tsx:192-203` to mulligan 0 or 1 then exit.
- **AI:** `strategy.evaluateRedraw:631` — `for (let i = 0; i < 2; i++)`. Cap = 2 ✓.
- **Observation:** Both sides honor the 2-card cap. Both sides allow exactly-1 mulligan: human via Cancel, AI via the inner `if (bestRedrawDecision) { … } else break;`.

### F-2.14  Mulligan UI restricts selection to one card per click  🤔

> **Rule (§7.3):** "discard up to 2 cards … This can be done one at a time."

- **Human path:** `GameCardsSelector.handleCardSelect:40-46` does `setSelectedCards([card])` (always replaces). The Redraw button submits one card at a time; the loop is in `ReduxGameManager.handleRedraw`.
- **Observation:** Conformant with "one at a time". Could also be done batched (rules say "one at a time" but don't forbid batched). Note it's a deliberate UI choice.
- **Asymmetry:** AI submits its full `cardsToRedraw[]` in a single dispatch — it doesn't iterate the same modal-open / modal-close cycle. This is fine functionally but is a 🔀 in interaction surface.

### F-2.15  Mulligan ordering of human vs AI  ⚠️

- **Code path:** Both mulligans run during `gamePhase === 'setup'`. Player gets the redraw modal first (`ReduxGameManager` opens it on init). AI's `useEffect` at `useReduxAI.ts:39-48` waits until `gamePhase === 'setup' && opponent.hand.length > 0 && !aiRedrawComplete`, then does a `setTimeout(1000)` and runs `handleAIRedraw`.
- **Observation:** AI redraws can fire at any time during the player's redraw modal — the gate condition is purely on phase + deck-state, not on whether the player is mid-modal. This is observable: open the redraw modal, wait, the AI's redraw silently runs in the background. Does not violate any rule (mulligans are simultaneous in the rulebook, not sequenced) but interacts oddly with the UI.
- **Proposed fix:** Phase-gate AI redraw on `playerRedrawComplete` if simultaneity matters; otherwise document.

---

## Faction-Selection Findings

### F-2.16  Faction is hardcoded — every game is NR-Foltest vs NR-Foltest  🕳️

- **Code path:** `gameThunks.initializeNewGame:46-47`:
  ```ts
  const playerDeckWithLeader = createInitialDeck(Faction.NORTHERN_REALMS, 'player');
  const opponentDeckWithLeader = createInitialDeck(Faction.NORTHERN_REALMS, 'opponent');
  ```
- **Observation:** No faction-pick UI. AI has no faction-pick logic (it inherits whatever the call site chose). Both seats end up with the same Foltest leader (`CLEAR_WEATHER`).
- **Implication for audit:** Phase 7 (faction abilities), Phase 13 (King Bran etc.), and most Phase 16 faction-consistency questions are **structurally unobservable** — we can only audit by code-reading.

### F-2.17  Legacy `GameManager.tsx` defaults differ  ℹ️ — appendix-legacy

- **Legacy path:** `GameManager.tsx:158-159` builds player as Nilfgaard, opponent as Northern Realms. Different defaults from the active stack.
- **Observation:** Recorded for `appendix-legacy.md` rather than the main findings — the file is unreachable from `App.tsx`.

---

## Predicted Phase 12 prerequisite

The carry-forward from the plan review asks Phase 12 to compute the §15 worked example **with weather on too**:

> Base 4, Tight Bond ×3 (3 same-name allies), Morale Boost +1 on row, Horn on row, Biting Frost on Close Combat row.
> - Rulebook (§15 derived): Weather → 1; ×3 → 3; +1 → 4; ×2 → 8.
> - Code (per `calculateUnitStrength` order at `gameHelpers.ts:30-51`): Weather → 1; ×3 (TightBond) → 3; ×2 (Horn) → 6; +1 (MoraleBoost) → 7. Discrepancy: rulebook 8 vs code 7.

That's the trace to formalise in Phase 12. (Recorded here so Phase 12 doesn't re-derive from scratch.)

---

## Deck-Builder Readiness

Per scope expansion, this section enumerates what the code infrastructure would need before a deck-builder feature could be authored. **Not designed; only enumerated.** For each item, the "Where it could live" column flags the question without recommending an answer (carry-forward note 7).

### Card-data fields needed

| Field | Type | Purpose | Where it could live |
|---|---|---|---|
| `starter?: boolean` | `BaseCard` extension | §3 white-star marking | `types/card.ts:67-74` |
| `sideDeck?: boolean` | `BaseCard` extension | §3 black-star Skellige side-deck-only | same |
| `maxCopiesInDeck?: number` | `BaseCard` extension | per-card copy caps (rulebook does not actually impose one but variant decks may) | same |
| `factionLockExempt?: boolean` | `BaseCard` extension | OR a sentinel `faction === Faction.NEUTRAL` already serves | unclear; depends on F-2.2 outcome |

### Validators needed

| Validator | Inputs | Returns | Where it could live |
|---|---|---|---|
| `validateLeaderCount` | `Card[]`, `LeaderCard` | `1 leader present and unique` | construction-time helper in `deckBuilder.ts` ↔ live re-validator in editor UI |
| `validateUnitMin` | `Card[]` | `≥22 Unit (incl. Hero)` | same |
| `validateSpecialMax` | `Card[]` | `≤10 Special` | same |
| `validateFactionHomogeneity` | `Card[]`, `Faction` | `all cards belong to chosen faction or NEUTRAL` (per F-2.2 outcome) | same |
| `validateSideDeckEligibility` | `Card[]` | `all sideDeck-marked cards are in side-deck slot, not main` | same |

**Question (carry-forward 7):** for each of these, two consumers exist: (a) a one-shot construction-time check in `deckBuilder.ts` to fail loudly when assembly doesn't satisfy §4; (b) a hook usable by an in-progress editor UI for live feedback as the user adds/removes cards. The same function could serve both, but the audit should flag the question rather than decide. **No decision recommended here.** Proposed naming would simply be a pure function the UI re-runs on every edit and the loader runs once.

### Side-deck structure needed (`R-010`)

| Item | File | Change |
|---|---|---|
| `sideDeck: Card[]` field on `PlayerState` | `types/card.ts:110-119` | add field |
| `DeckWithLeader` returns side deck | `deckBuilder.ts:7-10` | add `sideDeck: Card[]` |
| `gameSlice.initialPlayerState` has empty side deck | `gameSlice.ts:14-23` | add field |
| `gameSlice.initializeGame` populates it | `gameSlice.ts:54-94` | extend payload + assignment |
| `endRound` does NOT sweep side deck to discard | `gameSlice.ts:253-320` | confirm absence |
| Side-deck consumers (Summon, Berserker handlers — `🕳️`) | future thunks | new |

### UI surfaces needed (enumerate only, no design)

- Faction picker.
- Card browser filtered by selected faction (incl. neutrals per policy).
- Deck list with copy counts and live composition stats (units / specials / heroes / leader).
- Side-deck panel.
- Live validator badges (each rule from the validator list).
- Save/Load (would imply persistence — not in scope here).
- Default-deck loader (so `deckBuilder.ts`'s hardcoded NR/NG decks become the seeded examples).

### Architectural prerequisites identified by Phase 2 (forwarded to `scope-of-work.md`)

1. `R-010` — `sideDeck: Card[]` on `PlayerState`. Blocks Summon, Berserker, Skellige starter mechanics, deck-builder.
2. Card-data field expansion — `starter?`, `sideDeck?`. Blocks deck-builder card-source filtering.
3. Faction-policy decision — neutrals legal? — blocks both `validateFactionHomogeneity` and any deck-export validation.
4. Single source of truth for hero vs unit (F-2.5, F-2.6) — currently violated by Keira and Emhyr lookups.
5. `Math.random()` out of reducers (`R-001`) — blocks deterministic mulligan tests.

---

## Phase 2 Findings Summary

| ID | Status | Rule | Title |
|---|---|---|---|
| F-2.1 | 🕳️ | §4 | Deck-composition validator missing |
| F-2.2 | 🕳️ ❓ | §3 | Faction-color validator missing; neutral-card policy ambiguous |
| F-2.3 | 🕳️ `R-010` | §4 side deck | Side-deck infrastructure missing |
| F-2.4 | 🕳️ | §3 | Starter-star / side-deck-star marking missing |
| F-2.5 | ❌ | — | Keira Metz silently dropped from NR deck |
| F-2.6 | ❌ | — | Emhyr var Emreis silently dropped from NG deck |
| F-2.7 | 🕳️ | §3 implied | No deck-builder UI |
| F-2.8 | ❌ `R-001` | §7.1 | First-player coin flip uses `Math.random()` in reducer |
| F-2.9 | 🕳️ | §11, §17.15 | Scoia'tael first-player override missing |
| F-2.10 | ✅ | §7.2 | 10-card starting hand |
| F-2.11 | ✅ | §7.2 | Hand persists across rounds |
| F-2.12 | ❌ | §7.3 | **Mulligan reducer ignores shuffled deck — duplicates and lost cards** |
| F-2.13 | ✅ | §7.3 | Mulligan capped at 2 |
| F-2.14 | 🤔 | §7.3 | UI takes one card per click; AI submits batch — interaction asymmetry only |
| F-2.15 | ⚠️ | §7.3 | AI redraw fires while human modal still open — no rule violation but a UX race |
| F-2.16 | 🕳️ | §3 implied | Faction is hardcoded — every game NR-Foltest vs NR-Foltest |
| F-2.17 | ℹ️ | — | Legacy `GameManager.tsx` defaults differ — recorded in appendix |

**Counts:** ✅ 3 — ❌ 4 — ⚠️ 1 — 🤔 1 — ❓ 0 (folded into F-2.2) — 🕳️ 7 — ℹ️ 1.

**Top single finding:** F-2.12 — mulligan loses and duplicates cards every game. Critical for correctness regardless of the 🕳️ feature gaps.

---

**End of Phase 2.** Stopping. Awaiting `continue` to begin Phase 3 (Board and Placement).
