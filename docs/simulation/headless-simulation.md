# Headless Simulation

`cDp8` adds the first pure AI-vs-AI smoke harness for the engine:

```ts
import { runHeadlessMatchSimulation, replayHeadlessMatchCommands } from "@/game/sim";

const result = runHeadlessMatchSimulation({ seed: "sim-smoke-001" });
const replayed = replayHeadlessMatchCommands({
  seed: result.seed,
  commandLog: result.commandLog,
});
```

The runner starts the current Northern Realms vs Nilfgaard catalog presets with both seats controlled by AI, defaults both seats to `legal-heuristic-v0`, and advances the match through `startMatch`, `getLegalMoves`, `buildSeatObservation`, policy `selectMove`, `commandFromLegalMove`, and `executeCommand`.

## Browser Smoke Comparison

The browser smoke harness proves the opt-in engine shell can render and accept real user clicks. The headless simulation proves the pure engine and policy stack can complete a match without React, Redux, timers, browser APIs, localStorage, or filesystem writes.

Round-end auto-resolution exists only in `src/game/sim`. The UI still requires explicit round resolution.

## Acting Seat Rules

- Pending prompts are owned by `state.pendingPrompt.seatId`.
- Mulligan acts in fixed seat order: `seat_a`, then `seat_b`.
- Playing acts by `state.currentTurn`.
- Round end resolves through a deterministic `resolve_round_end` legal move selected for `seat_a`.
- Game end stops the loop.

`maxSteps` defaults to `300`. If the match does not reach `game_end`, the result status is `max_steps_exceeded` rather than an unbounded loop.

## Logs And Metrics

`steps` are compact debug logs with phase, round, seat, policy id, legal move count, chosen move id/kind, command type, and event types. They intentionally do not include full observations, full state snapshots, opponent hand arrays, or deck order.

`commandLog` contains exact replay commands and can include card instance IDs. It is useful for deterministic replay/debugging, but it is not yet a hidden-info-safe training dataset.

`summary` includes status, winner, rounds, command/event counts, policies by seat, final gems/scores, pass count, rounds resolved, average legal moves, card plays by seat, prompt resolutions, leader uses, weather plays, and max-step limit.

## Replay

`replayHeadlessMatchCommands` starts the same current catalog AI-vs-AI config from the same seed and applies the recorded command log through `executeCommand`. It returns the final `MatchState` and throws if an engine command is invalid during replay.

Replay is intentionally small. It checks command determinism for the current catalog config, not cross-version compatibility or a replay viewer protocol.

## Safe Export Contract

`cDp10` adds a hidden-info-safe in-memory export contract:

```ts
import { buildSimulationExportDataset } from "@/game/sim";

const dataset = buildSimulationExportDataset({
  batchInput: { suiteId: "current-smoke-v1" },
});
```

The exporter replays each raw simulation command from the starting seed and emits rows from the engine state immediately before each command is applied. Each row contains a perspective-specific safe observation, the ordered legal action list, the chosen legal action index, a sparse terminal reward placeholder, and compact run metadata.

Default export rows exclude `finalState`, `commandLog`, full events, `cardsById`, raw engine card instance ids, opponent hidden hand identities, opponent deck identities/order, and own deck order. Visible cards are represented by catalog `sourceId` plus row-local refs such as `own_hand_0` or `opponent_board_close_1`.

`resolve_round_end` is excluded by default because it is the simulation auto-resolver rather than a policy-owned decision. Use `includeSystemActions: true` only for diagnostics.

`cDp11` adds `validateSimulationExportDataset`, `assertValidSimulationExportDataset`, `serializeSimulationExportDatasetToJsonl`, and `parseSimulationExportDatasetJsonl` as the pure validation and in-memory JSONL boundary for `sim-export-v1`.

See `docs/simulation/safe-export-contract.md` and `docs/simulation/export-jsonl-boundary.md` for the full contract and ML boundary.

## ML Boundary

This harness sets up future batch simulation and ML exports by using legal moves and seat observations as the policy contract. It does not add JSONL export, action encoding, reward shaping, tournament runs, random policies, Python tooling, notebooks, or model training.

The cDp10 export adds redacted observation rows and per-row legal action encoding. The cDp11 boundary adds in-memory JSONL strings and parsing, but still does not add file writing, fixed neural action vectors, Python tooling, notebooks, self-play workers, model training, or shaped rewards. The current `commandLog` and final state remain debugging/replay data and may contain hidden card identifiers.

## Batch Seed Suites

`cDp9` adds a bounded batch diagnostics layer over the single-match runner:

```ts
import { currentSimulationSmokeSuite, runHeadlessSimulationBatch } from "@/game/sim";

const batch = runHeadlessSimulationBatch({
  suiteId: currentSimulationSmokeSuite.id,
});
```

The default batch run uses `current-smoke-v1`, a six-seed current-catalog Northern Realms vs Nilfgaard suite:

- `sim-smoke-001`
- `sim-smoke-002`
- `sim-smoke-003`
- `sim-smoke-004`
- `sim-smoke-005`
- `sim-smoke-006`

`sim-smoke-001` is kept because it exercises a Medic prompt in the current catalog. The list is fixed and ordered so repeated runs compare deterministically.

The batch runner accepts an explicit suite, suite id, or seed list. It defaults replay diagnostics on and raw single-match results off:

```ts
const batch = runHeadlessSimulationBatch({
  seeds: ["debug-seed-001", "debug-seed-002"],
  maxSteps: 300,
  verifyReplay: true,
  includeRawResults: false,
});
```

## Batch Diagnostics

Each batch run returns compact per-seed records: seed, match id, terminal status, winner, step/command/event counts, resolved round and prompt counts, average legal moves, final gems, optional structured error, replay diagnostics, and deterministic fingerprints.

The aggregate summary includes status counts, winner counts, completion and max-step rates, replay checked/failed counts, prompt counts, average steps/commands/rounds/legal moves, policy ids by seat, seeds grouped by terminal status, and failure-code counts.

Replay diagnostics call `replayHeadlessMatchCommands` and compare final essentials: phase, winner, gems, round history, and current round. Replay failures are reported in the run record and summary counts; they do not abort later seeds. Replay does not promise cross-version compatibility or intermediate-state hashing.

Fingerprints are deterministic compact strings over command type sequence, event type sequence, and summary essentials. They are intended for regression comparison, not as state reconstruction data.

By default, batch output deliberately excludes `rawResult`, `finalState`, `commandLog`, full events, observations, hand arrays, and deck order. `includeRawResults: true` is supported for debugging and replay investigation, but raw cDp8 results can contain card instance/source identifiers and are not a hidden-info-safe ML dataset.
