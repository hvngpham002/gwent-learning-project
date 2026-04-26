# Batch Seed Suites

`current-smoke-v1` is the current bounded simulation suite for cDp9.

It runs six fixed Northern Realms vs Nilfgaard AI-vs-AI seeds through the cDp8 headless runner with `legal-heuristic-v0` on both seats and a default max-step budget of `300`.

## Current Suite

| Suite id | Seed count | Default max steps | Notes |
|---|---:|---:|---|
| `current-smoke-v1` | 6 | 300 | Current catalog smoke suite. `sim-smoke-001` is retained for Medic prompt coverage. |

## Seeds

- `sim-smoke-001`: prompt coverage seed.
- `sim-smoke-002`
- `sim-smoke-003`
- `sim-smoke-004`
- `sim-smoke-005`
- `sim-smoke-006`

The suite is deliberately small enough for normal unit tests. It is a deterministic diagnostics suite, not a tournament matrix.

## Usage

```ts
import { runHeadlessSimulationBatch } from "@/game/sim";

const result = runHeadlessSimulationBatch();
```

The default result is compact and diagnostics-oriented. Use `includeRawResults: true` only for local debugging, because raw single-match results include replay command logs and final engine state.

This is not an ML export format. Future ML work still needs explicit observation redaction or hashing, action encoding, legal masks, reward design, and a stable export protocol.
