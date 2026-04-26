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

## ML Boundary

This harness sets up future batch simulation and ML exports by using legal moves and seat observations as the policy contract. It does not add JSONL export, action encoding, reward shaping, tournament runs, random policies, Python tooling, notebooks, or model training.

Future ML data should add explicit observation hashing or redacted observation export. The current `commandLog` and final state are for debugging/replay and may contain hidden card identifiers.
