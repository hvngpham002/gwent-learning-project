# AI And Machine Learning Roadmap

The ML goal should be treated as a product of a correct deterministic engine. A model cannot learn a reliable game if the game has duplicate rule paths, hidden non-determinism, or illegal action side effects.

## Literature-Grounded Workflow

Cluster F starts with a research-foundation stage, not model training. Until at least a small annotated literature base exists, the right next AI/ML work is reading and triaging papers, not writing `legal-heuristic-v1` or a self-play training program.

Operating rules:

- `docs/research/literature/ai/annotations/` is the source of truth for literature-grounded AI/ML claims. Implementation-affecting research claims in future Cluster F specs must cite annotation files there.
- The first Cluster F work is research foundation and benchmark/evaluation-ladder planning, not model training. The annotation workflow at `docs/research/literature/ai/ANNOTATION_WORKFLOW.md` defines the page-bounded batch reading protocol, source package contract, and required body sections.
- Future benchmark, search, training, self-play, difficulty, and model architecture decisions should cite annotations or be explicitly labeled project hypotheses.
- Compact decision notes live under `docs/research/literature/ai/decisions/` and should be used to turn small annotation batches into implementation-adjacent roadmap choices. The first accepted note is `docs/research/literature/ai/decisions/2026-05-09-batch-a-search-baseline.md`, which keeps search in scope but gates implementation on an evaluation and determinization-risk harness. The second accepted note is `docs/research/literature/ai/decisions/2026-05-09-batch-b-evaluation-ladder.md`, which made the next implementation-adjacent artifact a benchmark/evaluation harness before search or model training. cFp21 starts that harness with versioned in-memory ledgers and fixed-suite summaries in `src/game/benchmark/`, documented at `docs/research/literature/ai/benchmark-harness.md`.
- `docs/research/bibliography/references.bib` is the shared BibTeX database for research manuscripts. Annotation citekeys should match BibTeX citekeys when possible.
- Draft paper tracks live under `docs/research/manuscripts/`: an applied Gwent AI systems paper and a theory-oriented imperfect-information card-game paper. These are placeholders until annotations and experiments justify concrete claims.
- This roadmap document remains a roadmap summary, not the source of truth for literature claims. If a roadmap statement contradicts an annotation, update the annotation, retract it, or label the roadmap statement a project hypothesis.
- The current completed simulation/export infrastructure (headless AI-vs-AI runner, batch seed suites, hidden-info-safe `sim-export-v1` decision rows, validated in-memory JSONL boundary, `legal-heuristic-v0`) gives us a base for experiments. It does not yet constitute a validated AI research program.

The active literature sweep prompt lives at `docs/research/literature/ai/prompts/lit-sweep-gwent-ai-prompt.md`. The first multi-model sweep was triaged in `docs/research/literature/ai/results/2026-05-08/triage.md`; the current post-triage annotation queue lives at `docs/research/literature/ai/results/2026-05-08/queue.md`.

## Stages

| Stage | Name | Goal |
|---|---|---|
| 0 | Literature foundation | Annotation workflow, sweep prompt, multi-model triage, and source-grounded notes for AI/ML claims (Cluster F starting point). cFp0 created the workflow; cFp1 triaged the first ChatGPT/Claude/DeepSeek/Gemini/Qwen sweep. Annotation has not started yet. |
| 1 | Legal heuristic AI | Current AI rebuilt as a policy over legal moves and shared scoring. `legal-heuristic-v0` exists; `legal-heuristic-v1` is gated on literature foundation. |
| 2 | AI vs AI simulation | Headless games for policy evaluation and regression. Implemented under `cDp8` / `cDp9`. |
| 3 | Replay and metrics | Event logs, deterministic seeds, win-rate and strategy metrics. Implemented as deterministic command replay, batch diagnostics, and fingerprints under `cDp9`. |
| 4 | Observation/action API | Stable training environment interface. Hidden-info-safe `sim-export-v1` decision rows, per-row legal action lists, and validated in-memory JSONL boundary exist under `cDp10` / `cDp11`. File writers, fixed action vectors, and Python tooling are still future work. |
| 5 | Baseline training | Random, heuristic, supervised imitation from heuristic games, then self-play experiments. Not started; gated on the literature foundation and the next planned work. |
| 6 | Evaluation ladder | Started in cFp21 with an in-memory benchmark harness, `benchmark-match-v1` raw ledgers, `benchmark-summary-v1` fixed-suite summaries, mirrored current-deck smoke matchups, and a deterministic `legal-first-v0` comparator. Elo, Glicko, TrueSkill, larger tournament matrices, and exploitability probes remain future work. |

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
