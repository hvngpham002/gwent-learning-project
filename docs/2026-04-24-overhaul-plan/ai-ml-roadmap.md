# AI And Machine Learning Roadmap

The ML goal should be treated as a product of a correct deterministic engine. A model cannot learn a reliable game if the game has duplicate rule paths, hidden non-determinism, or illegal action side effects.

## Stages

| Stage | Name | Goal |
|---|---|---|
| 1 | Legal heuristic AI | Current AI rebuilt as a policy over legal moves and shared scoring. |
| 2 | AI vs AI simulation | Headless games for policy evaluation and regression. |
| 3 | Replay and metrics | Event logs, deterministic seeds, win-rate and strategy metrics. |
| 4 | Observation/action API | Stable training environment interface. |
| 5 | Baseline training | Random, heuristic, supervised imitation from heuristic games, then self-play experiments. |
| 6 | Evaluation ladder | Tournament harness, Elo, matchup matrices, seed suites. |

## Policy Interface

All AI variants should implement the same interface:

```ts
interface Policy {
  id: string;
  selectAction(input: PolicyInput): EngineCommand;
}

interface PolicyInput {
  observation: SeatObservation;
  legalMoves: LegalMove[];
  seed: string;
}
```

The policy never mutates state directly and never constructs moves that are not in `legalMoves`.

## Observation Model

The engine should produce an observation for a given seat:

- own hand;
- own deck count, not deck order unless a rule reveals it;
- own discard;
- own leader and faction;
- opponent battlefield;
- opponent discard;
- opponent deck count;
- opponent hand count;
- public weather and row effects;
- gem counts;
- round number;
- pass state;
- public event history.

Debug and training experiments may request full-state observations, but that must be an explicit cheat/debug mode. It cannot be the default AI input.

## Action Space

The action space should start as legal-move IDs, not a fixed global neural action vector.

For ML export, each move can be encoded as:

- action type: play card, pass, use leader, choose target, choose row, mulligan;
- source card instance or source ID;
- target row;
- target card instance;
- prompt response;
- legal action mask.

This lets a model score only currently legal choices.

## Rewards

Initial reward signals:

- match win/loss/draw;
- round win/loss/draw;
- card advantage after each round;
- final gem margin;
- score differential at pass;
- penalty for invalid action attempts in training wrappers only.

Do not over-shape rewards before a baseline policy exists. Start with sparse match reward plus metrics.

## Logs

Simulation should emit JSONL:

```json
{
  "matchId": "seed-001",
  "step": 42,
  "seat": "seat_a",
  "observationHash": "...",
  "legalMoveCount": 18,
  "chosenMove": { "type": "play_card", "card": "neutral.decoy" },
  "events": [],
  "result": null
}
```

Match summary:

```json
{
  "matchId": "seed-001",
  "seed": "001",
  "policies": { "seat_a": "heuristic-v1", "seat_b": "random-v1" },
  "winner": "seat_a",
  "rounds": 3,
  "finalGems": { "seat_a": 1, "seat_b": 0 },
  "metrics": {
    "turns": 41,
    "passes": 5,
    "averageLegalMoves": 12.4
  }
}
```

## Evaluation

Baseline policy suite:

- random legal move;
- greedy score policy;
- current heuristic port;
- pass-aware heuristic;
- self-play candidate.

Metrics:

- win rate by matchup;
- average card advantage;
- average round length;
- pass timing;
- illegal move attempts;
- deterministic replay success rate;
- runtime per simulated game.

## ML Integration Boundary

Keep the core engine in TypeScript. Export logs and environment steps in a stable JSON protocol so Python tooling can consume them later.

Possible future paths:

- Python training loop reads JSONL offline data.
- Node process exposes a simple environment bridge.
- Web worker or server process runs self-play batches.
- Learned model is exported back to the app as policy weights or a service.

The critical early investment is not model code. It is legal moves, deterministic replay, and clean observations.

