# Audit Progress Summary

_Last updated after Phase 10. Next phase: **Phase 11 — Hero Immunity**._

---

## Completed Phases

| Phase | File | Status | Key output |
|---|---|---|---|
| 0 — Codebase Map | `00-codebase-map.md` | ✅ Done | Tech stack, pipelines, asymmetry hotspots, 17 non-obvious notes |
| 1 — Audit Plan | `01-plan.md` | ✅ Done | Full phase checklist, rule → file map, R-001–R-012 root-cause table |
| 2 — Deck & Setup | `02-deck-and-setup.md` | ✅ Done | 17 findings incl. **F-2.12 mulligan-shuffle bug (R-011)**, side-deck gap (R-010), Keira/Emhyr silent drops |
| 3 — Board & Placement | `03-board-and-placement.md` | ✅ Done | **F-3.15 Agile AI asymmetry (Olgierd 4-pt Frost trace)**, **F-3.14 Medic-must-apply ❌ 🔀**, Horn-slot fidelity (R-009) |
| 4 — Turn Flow | `04-turn-flow.md` | ✅ Done | **F-4.4 leader-wiring disjoint (human can't use leader in prod)**, **F-4.10/F-4.11 Medic-modal pass/cancel bugs**, R-002 resolved as dead code |
| 5 — Round Resolution | `05-round-resolution.md` | ✅ Done | **F-5.11 order-of-ops flips round winner**, **F-5.12 Spy discard trace (R-004)**, **F-5.13 Decoy double-count (R-012)**, 5× 🕳️ faction abilities |
| 6 — Game End | `06-game-end.md` | ✅ Done | **F-6.2/F-6.3 R-008 pre-decrement auto-new-game misfire**, **F-6.4 doubled `endRound` can end game early**, simultaneous last-gem draw ✅ |
| 7 — Faction Abilities | `07-faction-abilities.md` | ✅ Done | **All 5 passives missing**, active game hardcodes NR-vs-NR, builder only supports NR/Nilfgaard |
| 8 — Unit Abilities | `08-unit-abilities.md` | ✅ Done | **Agile AI asymmetry**, **Medic target/over-chain + revived ability gaps**, **Muster deck duplication/no shuffle**, **Spy discard ownership**, Summon/Berserker/Mardroeme/Roach missing |
| 9 — Special Cards | `09-special-cards.md` | ✅ Done | **Human double-Horn row bug**, **R-009 Horn source decoupled**, **R-012 Decoy double-track + Scorch pollution**, **Special Scorch Spy discard bug**, Mardroeme missing |
| 10 — Weather | `10-weather.md` | ✅ Done | Frost/Fog/Rain + Clear Weather ✅, weather controller discard ✅, **Skellige Storm live gap**, **R-003 array-vs-Set state split**, King Bran weather mitigation missing |

---

## Root-Cause ID Table (current)

| ID | One-line summary | First found | Affects |
|---|---|---|---|
| **R-001** | `Math.random()` inside reducers — impure, also breaks winner-starts-next-round | Phase 0 | Ph 2, 5, 14, 16 |
| **R-002** | 500ms `setGamePhase` useEffect is dead code; latent double-fire risk on `endRound` | Phase 0 | Ph 4, 14 |
| **R-003** | `activeWeatherEffects` is `Set` in types but `CardAbility[]` in Redux state | Phase 0 / Phase 10 confirmed | Ph 12, 15 |
| **R-004** | Spy goes to wrong discard (board-side sweep, not controller sweep) | Phase 0 | Ph 8, 15 |
| **R-005** | Medic chain has two parallel implementations — `handlePlayerMedicChain` vs `executeAIMedicChain` | Phase 0 | Ph 8, 15 |
| **R-006** | AI hardcoded as `state.opponent.*`; no seat abstraction | Phase 0 | Ph 15, 15b, 16 |
| **R-007** | `isAIMoving` set then immediately cleared before async play completes | Phase 0 | Ph 14 |
| **R-008** | Game-end check uses pre-decrement `lives === 1` — misfires when a player on 1 life wins a round | Phase 0 | Ph 6 |
| **R-009** | `BoardRow.hornActive: boolean` — Horn source card decoupled; Decoy/Scorch can't clear effect | Phase 0 | Ph 9 |
| **R-010** | No `sideDeck` field on `PlayerState` — Summon / Berserker / Skellige structurally impossible | Phase 0 | Ph 2, 8 |
| **R-011** | Mulligan reducer slices unshuffled deck; produces duplicate IDs + lost cards on every mulligan | Phase 2 | Ph 8, 11, 14, 15 |
| **R-012** | Decoy double-tracked: both on `boardRow.cards` (UNIT-typed) AND `specialCardsOnBoard` — duplicate ID in discard at round end | Phase 5 | Ph 9, 11, 13 |

---

## Key Carry-Forwards Baked Into Later Phases

These notes were added during phase reviews and must be applied in the numbered phases below:

| Applies to | Carry-forward |
|---|---|
| Ph 8 / Ph 11 | **Faction passive filtering:** Monsters and Skellige implementations are absent; when audited for unit/hero immunity, note both must filter non-Hero units. |
| Ph 11 | Add matrix row: **"Decoy-on-row strength pollution"** — `decoyForBoard` has `type: CardType.UNIT`; Phase 9 confirmed Scorch and Medic target surfaces. |
| Ph 12 | Run **both** worked examples: weather-off (rulebook 26, code 25) AND weather-on Biting Frost (rulebook 8, code 7 — see Phase 5 calc). Confirmed winner-flip in F-5.11. |
| Ph 12 | **F-3.15** requires two coupled fixes in scope-of-work: (a) `UnitStrategy` must iterate `availableRows ?? [unitCard.row]`; (b) `evaluateUnitValue` must accept a row parameter rather than defaulting to `card.row`. |
| Ph 14 | **`handleRoundEnd` inner `setTimeout`** (line 132-141): Phase 6 confirmed it uses captured `winner` and captured `gameState`, then dispatches `initializeNewGame` 1s later without validating latest Redux state. |
| Ph 15 | At least one traced decision proving the AI picks a different move with live calc vs `evaluateUnitValue` heuristic (started in F-5.11); Phase 8 adds Agile row choice and Morale Boost/Tight Bond heuristic drift; Phase 9 adds AI avoiding double-Horn rows while human can spend the card. |
| Ph 15 | **R-008 component/reducer split:** reducer has authoritative post-decrement game-end state; component duplicates game-end scoring/reset using pre-decrement closure state. |
| Ph 15 | **Medic unification:** collapse `handlePlayerMedicChain` and `executeAIMedicChain`; Phase 8 found player over-chain and revived Unit Scorch/Muster asymmetry. |
| Ph 15 | **Controller metadata:** Special Scorch, Unit Scorch, and round-end all route Spy discard by physical board side, not controller. |
| Ph 16 | **AI faction consistency:** AI is always Northern Realms in active setup and still does not receive Northern Realms round-win draw. |
| Ph 13 / Ph 15 / Ph 16 | **Skellige Storm split:** card data and `getWeatherAffectedRows` know the ability, but UI, thunk, live score, row highlighting, and AI `WeatherStrategy` do not. |

---

## Cumulative Finding Counts (phases 2–10)

| Status | Count so far |
|---|---|
| ✅ Correct | 32 |
| ❌ Bug | 29 |
| ⚠️ Ambiguous / structural gap | 19 |
| 🔀 Asymmetric | 13 (several overlap ❌) |
| 🕳️ Unimplemented | 29 |
| 🤔 Design deviation | 3 |
| ❓ Rulebook silent | 3 |
| ℹ️ Legacy/informational | 2 |

---

## Next Phase — Phase 11: Hero Immunity (`11-hero-immunity.md`)

**Rule points:** Heroes are immune to Weather, Commander's Horn, Morale Boost, Scorch (both kinds), Decoy, Medic, Monsters persistence, Skellige return, and most Leader/Special/Unit abilities. Hero cards still retain their own abilities.

**Files to read:**
- `src/utils/gameHelpers.ts` (`calculateUnitStrength`, Scorch helpers, weather/highest-strength paths)
- `src/store/thunks/gameThunks.ts` (Decoy, Medic, Scorch, Unit Scorch, Muster/revive side effects)
- `src/store/slices/gameSlice.ts` (round-end sweep, faction passive placeholders)
- `src/ai/strategy.ts` (Medic/Decoy/Scorch target filters and heuristic scoring)
- `src/components/game/ReduxGameManager.tsx` and selector/modal paths for human target filtering

Phase 11 should produce a matrix: ability × implementation location × human/AI path × "heroes filtered?" Include the Phase 9 Decoy-as-Unit pollution row and the Phase 10 King Bran/Skellige carry-forward where weather logic lacks leader context.

---

## Remaining Phases

| # | Phase | Density | Predicted output |
|---|---|---|---|
| 11 | Hero Immunity | Matrix | Cross-cutting matrix; Decoy-on-row pollution (R-012) |
| 12 | Resolution Order | Dense | Order-of-ops ❌ confirmed; two worked examples |
| 13 | Specific Cards | Inventory | King Bran / Clan Dimun / Eredin / Emhyr — all 🕳️ or ❌ |
| 14 | Async / Race | Dense | R-002, R-007, stale closures, AI scheduling, input debounce |
| 15 | Player/AI Unification | Dense | Duplicate function matrix, rule-per-rule asymmetry matrix |
| 15b | Seat-Swap Latent Bugs | Medium | R-006 catalog |
| 16 | AI Decision Engine | Medium | Info model, cheating checklist, faction consistency |
| 99 | Consolidated Findings | Wrap-up | `99-findings.md` + `scope-of-work.md` + `appendix-legacy.md` |
