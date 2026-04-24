# Gwent Codebase Audit — Rules Conformance + Turn/Async Review + Player/AI Unification

## Context
You are auditing a React + TypeScript **single-player** Gwent implementation (human vs. computer AI) against the official rules document at `gwent-rules.md`. Find it first — likely at repo root.

There are three concerns driving this audit:
1. Does the game follow the official rules?
2. Is the turn system async-safe and race-condition-free?
3. **Are the rules applied consistently to the human and the AI?** The codebase is suspected to have *separate implementations* of game mechanics for the player and the AI. This is a core concern of the audit.

## Hard Rules for This Session
1. **Do not fix anything unless I explicitly say "fix it."** Audit only.
2. **Do not try to do this in one pass.** Work through the phases in order. Each phase produces a written markdown artifact under `audit/` and ends with you stopping and showing me the artifact. Wait for my "continue" before moving on.
3. **Never paraphrase rules or code in findings — quote them.** Every finding cites the rule from `gwent-rules.md` and the code with `file:line`.
4. **Rules marked `[Derived]` or `[Rulebook silent]` in `gwent-rules.md` are not bugs** no matter what the code does. They are "design decision needed" items. Flag them separately.
5. **Use the TodoWrite tool.** I want to see progress.
6. **Do not refactor, clean up, or delete commented code.** You are an auditor.
7. **Read files before commenting on them.** No speculation.
8. **Persist all findings to disk** so context can be dropped between phases without losing work.
9. **For every rule-level finding, check both the human path AND the AI path.** If you cannot find an AI path or cannot find a human path, that itself is a finding.

## Output Structure
Create these under `audit/` as you go:
- `00-codebase-map.md` — orientation, including human-path vs AI-path map
- `01-plan.md` — full audit plan
- `02-deck-and-setup.md` — deck construction, mulligan, starting hand
- `03-board-and-placement.md` — zones, row placement, Agile
- `04-turn-flow.md` — turn options, pass, turn switching (rules-level only; deep async is Phase 14)
- `05-round-resolution.md` — strength calc, gem loss, cleanup, round transition
- `06-game-end.md` — game end, simultaneous loss, draw
- `07-faction-abilities.md` — Monsters, Nilfgaard, Northern Realms, Scoia'tael, Skellige
- `08-unit-abilities.md` — Agile, Unit CH, Medic, Morale Boost, Muster, Tight Bond, Unit Scorch, Spy, Summon, Berserker, Unit Mardroeme
- `09-special-cards.md` — Special CH, Decoy, Special Mardroeme, Special Scorch
- `10-weather.md` — Frost, Fog, Rain, Skellige Storm, Clear Weather
- `11-hero-immunity.md` — cross-cutting: every place Heroes should be filtered out
- `12-resolution-order.md` — Weather → Tight Bond → Morale Boost → Commander's Horn
- `13-specific-cards.md` — Clan Dimun Pirate, Eredin, Emhyr var Emreis, King Bran
- `14-turn-async-audit.md` — deep async / race-condition review
- `15-player-ai-unification.md` — duplicate-logic + asymmetry audit
- `16-ai-decision-engine.md` — what the AI can "see" and how it decides
- `99-findings.md` — consolidated, prioritized list

## Finding Format (use this everywhere)
Each item:
- **Status:** ✅ Correct | ❌ Bug | ⚠️ Ambiguous / Missing | 🤔 Design deviation | ❓ Rulebook silent | 🔀 Asymmetric (human vs AI differ)
- **Rule:** direct quote from `gwent-rules.md` with section reference
- **Human code path:** `path/to/file.ts:LINE` + the relevant snippet
- **AI code path:** `path/to/file.ts:LINE` + the relevant snippet (or "not found" / "uses same path as human")
- **Observation:** what each code path does vs what the rule says, and how they differ from each other
- **Proposed fix:** one or two sentences, conceptual, no code

The 🔀 status is specifically for cases where both the human and AI paths exist, both are self-consistent, but they implement the rule differently. This is the asymmetry case and is always a finding regardless of whether either side matches the rulebook.

---

## Phase 0 — Orientation
Do this first, then stop.

1. Read `gwent-rules.md` in full.
2. `git ls-files` and scan the tree. Locate:
   - state management pattern (Redux / Zustand / Context / plain useState / XState / other)
   - the top-level game state type
   - where turns advance
   - where card abilities resolve
   - where rounds end and cleanup happens
   - where strength is calculated
   - tests, if any
3. **Locate the AI.** Search for likely names: `ai`, `bot`, `opponent`, `computer`, `cpu`, `enemy`, `strategy`, `decide`, `chooseMove`, `simulate`, `minimax`, `mcts`. List every file involved in AI decision-making.
4. **Map human-input path vs AI-action path.** Trace from "user clicks a card" and from "AI picks a move" all the way to state commit. Are they the same path? Different paths? Partially shared?
5. Produce `audit/00-codebase-map.md` with:
   - Tech stack and relevant libraries
   - Directory structure (top two levels)
   - State management pattern + where state lives
   - Entry points for: play card (human), play card (AI), pass (human), pass (AI), use leader ability (human), use leader ability (AI), round end, game end — each with file:line
   - Key type/interface definitions (pasted, with file:line)
   - **Human action pipeline:** ordered list of functions called from click to state commit
   - **AI action pipeline:** ordered list of functions called from AI decision to state commit
   - **Shared vs duplicated:** explicit note on which steps are shared and which are duplicated between the two pipelines
   - Test coverage summary (files + one-line description each)
   - Anything non-obvious I should know before the audit starts

**Stop. Show me `00-codebase-map.md` and wait.**

---

## Phase 1 — Audit Plan
Write `audit/01-plan.md`:
- List phases 2–16 as a checklist with TodoWrite mirrors
- Under each phase, enumerate the specific rule points from `gwent-rules.md` you will verify (reference §§ numbers)
- For each rule point, predict which file(s) you'll read — **both human and AI sides**
- Flag anything you already suspect is wrong or asymmetric based on Phase 0

**Stop. Show me `01-plan.md` and wait.**

---

## Phases 2–13 — Rule-by-Rule Audit
For each phase, loop:
1. Read only the files relevant to this slice — **include the AI's version of the same logic**.
2. For every rule in the corresponding section of `gwent-rules.md`, write a finding using the format above, filling in both human and AI code paths.
3. Write the phase's markdown file.
4. Update TodoWrite.
5. **Stop and show me the file before starting the next phase.**

Do not batch phases. One at a time. Between phases you may drop context from prior phases — the findings live in `audit/`.

### Specific guidance per phase

**Phase 05 (round resolution).** Confirm: tied Strength triggers *both* players losing a gem (unless Nilfgaard), winner starts next round, all Specials are discarded at round end, Monsters keeps one non-Hero unit (shuffled random), Skellige round-3 trigger happens at the *start* of round 3 not end of round 2. For each: does it fire regardless of who controls the Monsters/Skellige/Nilfgaard deck (i.e., does the human get the benefit if they pick Monsters, *and* the AI get the benefit if it picks Monsters)?

**Phase 07 (factions).** Verify each passive triggers at the correct moment and the "excluding Heroes" clauses are enforced. **Specifically check: does the AI get these faction abilities applied when it plays that faction?** A common bug is faction abilities only wired into the human's event handlers.

**Phase 08 (unit abilities).** For **Medic**, trace the call path. Does it support chaining? Is it synchronous recursion or a queue? Does it block Heroes? **Is the Medic target-selection UI the same decision surface the AI uses?** If the human gets to pick a Medic target but the AI just picks the first card in discard (or vice versa), that's an asymmetry. For **Muster**, does it pull only from hand+deck (not discard)? Does it reshuffle after? For **Summon**, does it trigger on any way of leaving the battlefield including round-end? Confirm Decoy does not trigger Summon. For **Spy**, does the card end up in the *controller's* discard pile at round end (so an AI-played Spy goes to AI's discard, and a human-played Spy goes to human's discard)?

**Phase 09 (special cards).** **Decoy selection** is the biggest asymmetry risk — human picks via UI, AI picks via code. Verify both respect "excluding Heroes" and "controlling player's side only."

**Phase 11 (hero immunity).** Cross-cutting. Check every ability implementation for Hero filtering: Weather, Commander's Horn, Morale Boost, Scorch (both kinds), Decoy, Medic, Skellige return, Monsters persistence. Produce a matrix: ability × implementation-location × "heroes filtered?" — if there are separate human and AI implementations of the same ability, each gets its own row.

**Phase 12 (resolution order).** Find the strength-calculation function(s). **If strength is calculated in more than one place, every location is a finding by itself.** Walk through Weather → Tight Bond → Morale Boost → Commander's Horn in each one. Verify with this test case: three Tight Bond units named "X" with printed Strength 4, +1 Morale Boost on the row, Commander's Horn on the row, no weather → each should end at **26**. With Biting Frost active (Close Combat units) → each should end at **8** (1 → ×3 → +1 → ×2). Heroes ignore all of this. Check: does the AI use the same strength calculation the UI displays, or does it have its own (possibly-wrong) heuristic?

**Phase 13 (specific cards).** King Bran: "Friendly Units only lose half their Strength in bad weather conditions (rounded down)." Clan Dimun Pirate: full-battlefield Scorch that cannot discard itself. Eredin & Emhyr: do not exclude Heroes (card takes precedence). Check: if the AI plays King Bran, does its weather math use half-strength? If the human plays King Bran, same question.

---

## Phase 14 — Turn Handling & Async Audit
Produce `audit/14-turn-async-audit.md`.

For every finding: **reproduction path**, **severity** (Blocker / High / Medium / Low), and **fix sketch**.

1. **Turn state machine.** Enumerate the states a turn can be in. Who owns `currentPlayer`? Can it diverge from what the UI shows? Is there a distinct "resolving ability" state? **Is there a distinct "AI thinking" state** that blocks human input?
2. **Turn-switch atomicity.** On play card: input → ability resolution → state commit → turn switch. Any steps interruptible? Can the user click a second card mid-resolution? **Can the user click a card during the AI's turn?**
3. **Pass handling.** Window where both are flagged passed but round-end hasn't fired? What if both pass in the same render tick? What if the AI decides to pass while the human's ability is still resolving?
4. **Ability chains.** Medic → Medic → Medic. Muster playing N cards at once. Is each step awaited? Is input blocked during the chain? **Does the AI get the same chain-resolution logic, or does it short-circuit?**
5. **Animation vs state.** Are animations driving state changes, or state driving animations? `useEffect` with stale closures? Event handlers capturing old game state?
6. **React state batching.** `setState(current + 1)` vs functional updaters. State reads after an `await` using pre-await values.
7. **AI turn scheduling.** How does the AI's turn start — `setTimeout`? `useEffect` watching `currentPlayer`? A promise chain? Can it fire twice? Can it fire when it's the human's turn due to a stale closure? Can it fire after the component unmounts?
8. **AI "thinking" time.** If there's a delay before the AI acts, can the human do anything during it? Can the user navigate away / restart / pause and cause the AI to act on a stale state?
9. **Randomness.** Monsters' random kept unit, Skellige's random return, shuffle, mulligan redraw — seeded? Deterministic in tests? Using `Math.random` directly in render or effects? Does the AI's simulation/planning (if any) use the same RNG as the live game?
10. **Input debounce.** Rapid-fire clicks playing the same card twice? Double-tap the pass button? Clicking during AI turn?
11. **Round-end transaction.** Round end is multi-step: calculate Strength → determine winner → lose gem → check game end → discard all (except Monsters keep-one, and Skellige round-3 return at start of next round) → winner starts next round → Northern Realms draws. Is this atomic? If a re-render fires mid-transaction, what does the UI show? **Does this run identically regardless of whether the winner is the human or the AI?**
12. **Leader active ability.** Once-per-game — enforced by state or only by UI disabling? Can a race replay it? Does the AI's usage go through the same gate?
13. **Drag-and-drop (if present).** Can a drag start on turn A and resolve on turn B? Any assumption about `currentPlayer` between `onDragStart` and `onDrop`?
14. **AI interrupting itself.** If the AI is mid-decision and the game state mutates (e.g., an ongoing animation completes and mutates state, or a Spy draws cards into the AI's hand mid-turn), what happens? Is the AI reading a snapshot or the live state?

**Stop. Show me `14-turn-async-audit.md` and wait.**

---

## Phase 15 — Player/AI Logic Unification Audit
This is the "is the AI playing the same game" phase. Produce `audit/15-player-ai-unification.md`.

1. **Enumerate every piece of game logic that exists in more than one place.** For each one, produce a side-by-side: what the human path does vs. what the AI path does. Examples to search for:
   - `playCard`, `applyCard`, `handlePlay`, `simulatePlay`
   - `calculateStrength`, `computeScore`, `evaluateBoard`, `getRowStrength`
   - `applyWeather`, `isWeatherActive`
   - `canPlayCard`, `isValidMove`, `getLegalMoves`
   - `triggerAbility`, `resolveAbility`, `onPlay`
   - `endRound`, `finishRound`
   - `discard`, `moveToDiscard`, `cleanup`
   - `shuffle`, `drawCard`
2. **Duplicate function matrix.** Table with columns: `Logic`, `Human-side location`, `AI-side location`, `Behavior matches?`, `Divergence description`.
3. **Shared-truth test.** For each duplicated function, construct one concrete game-state example and trace what each implementation would return or do. Any divergence is a 🔀 finding.
4. **Rule-per-rule asymmetry matrix.** For each rule in `gwent-rules.md`, three columns: `Enforced on human actions?`, `Enforced on AI actions?`, `Same code path?`. This is the big deliverable.
5. **Dead giveaways to search for specifically:**
   - AI code that bypasses validation the human goes through (e.g., AI can play a card onto a row even when validation would reject it for a human)
   - Human code that does not call the same ability resolver the AI uses
   - State updates that happen only when the human plays (but not when the AI plays), or vice versa
   - UI-layer rule checks (validation in a component) that don't exist in the AI's planner
   - Any use of `if (currentPlayer === 'human')` or `if (isAI)` branching inside rule-enforcement code — these are almost always asymmetry bugs
   - Card ability effects applied via React side-effects (e.g., `useEffect` that only runs because the UI rendered) — the AI wouldn't trigger these
6. **Order-of-operations check across paths.** Does the AI's simulated resolution apply Weather → Tight Bond → Morale Boost → Commander's Horn in the same order as the live resolution used on the human's plays?

**Stop. Show me `15-player-ai-unification.md` and wait.**

---

## Phase 16 — AI Decision Engine Audit
Separate from unification. This phase is about the AI's internal model, not whether it shares code with the human path. Produce `audit/16-ai-decision-engine.md`.

1. **Information model.** What can the AI see? Ideally only its own hand, both battlefields, both discard piles, gem counts, and public faction/leader info. Flag any case where the AI reads:
   - The human's hand
   - The human's deck
   - The human's upcoming mulligan
   - Anything else that would be hidden in a real opponent
2. **Decision algorithm.** Heuristic? Scripted? Rule-based? Search (minimax / MCTS)? Whatever it is, document it in one paragraph per decision type: card play, target selection for Medic/Decoy/Scorch, pass-or-play, mulligan, leader-ability usage.
3. **Pass strategy.** When does the AI pass? Does it correctly understand the strategic value of passing (you don't always want to win round 1 if it costs you the hand)? Does it ever pass when it shouldn't be able to (e.g., at 0 Strength while the human has Strength)?
4. **Cheating checklist.** For each, answer yes/no with a file:line:
   - Does the AI draw from the same deck it was dealt? (i.e., no re-randomizing its hand)
   - Does it respect the 10-card starting hand?
   - Does it respect the mulligan-2 cap?
   - Does it respect "once per game" on Leader active abilities?
   - Does it respect "excluding Heroes" on target selection?
   - Does it respect row-placement rules?
   - Does its Spy send cards to *its* discard (not the human's)?
5. **Faction consistency.** Does the AI's chosen faction actually get its faction ability applied by the live game logic — or is the faction ability hardcoded for the human side?
6. **Target-selection asymmetry.** For Medic / Decoy / Scorch (unit) / Mardroeme / Muster, compare the AI's choice logic with the human's UI. Does the human have options the AI cannot consider, or vice versa?

**Stop. Show me `16-ai-decision-engine.md` and wait.**

---

## Phase 99 — Consolidated Findings
Write `audit/99-findings.md`:
- All findings from phases 2–16, deduplicated
- Grouped by severity (Blocker / High / Medium / Low / Design-decision)
- Plus a separate group: **Asymmetries (🔀)** — every case where human and AI paths diverge, regardless of severity, since these are the unification target
- Each entry: title, source phase, one-line description, file:line (both paths if applicable), one-sentence fix
- Top of file: summary counts (N correct / N bugs / N ambiguous / N deviations / N design-decisions / N asymmetries)
- Bottom of file: **"If I were unifying the two implementations, these are the seams I'd cut along"** — a short paragraph identifying the 3–5 most important duplications to collapse first

At the end, ask me which items to address first.

---

## Meta
- If you hit a code area you don't understand, say so and read more — don't guess.
- If a state library or pattern is unfamiliar in this codebase, read its usage here before critiquing.
- Between phases, feel free to summarize what you've learned so far, but the source of truth is the files in `audit/` — refer back to them instead of keeping everything in your head.
- If you run into ambiguity about what *I* want, stop and ask. Don't invent requirements.
- **Remember: the goal of this audit is not just "does it follow the rules" but also "does it follow the rules identically for both players." Every finding should consider both dimensions.**

Start with Phase 0.