# Safe Simulation Export Contract

`cDp10` adds the first hidden-info-safe in-memory export contract over the headless batch simulation layer. `cDp11` adds runtime validation and deterministic in-memory JSONL serialization for that contract.

```ts
import { buildSimulationExportDataset } from "@/game/sim";

const dataset = buildSimulationExportDataset({
  batchInput: { suiteId: "current-smoke-v1" },
});
```

The export is plain JSON-serializable data. It does not write JSONL files, add a CLI, bridge to Python, define a fixed neural action vector, train a model, or expose raw replay/debug objects.

## Dataset Shape

The public schema versions are:

- `sim-export-v1`
- `safe-observation-v1`
- `legal-action-v1`
- `reward-v1`

`buildSimulationExportDataset` returns dataset metadata, suite id, seeds, policies by seat, a compact summary, per-match diagnostics, and `SimulationDecisionRow[]`.

Each decision row represents one pre-command decision point:

- acting seat and policy id;
- perspective-specific safe observation;
- ordered encoded legal action list;
- `chosenActionIndex` into that list;
- sparse terminal reward placeholder;
- compact match outcome summary.

Rows are derived by replaying the raw simulation command log from the starting seed. Before each command is applied, the exporter calls `getLegalMoves`, builds the acting-seat safe observation, matches the recorded command to a legal move, encodes the legal action list, and then advances replay state through `executeCommand`.

## Hidden-Info Boundary

Default export rows exclude raw `MatchState`, `cardsById`, full engine events, `commandLog`, raw engine card instance ids, opponent hand card identities, opponent deck identities/order, and own deck order.

Visible cards use stable catalog `sourceId` plus a row-local `cardRef`, such as `own_hand_0`, `own_board_close_1`, `opponent_board_ranged_0`, or `weather_0`. `cardRef` exists only to distinguish visible duplicates inside the current row; it is not an engine id.

The acting seat observation includes:

- own visible cards in hand;
- own leader source id and used flag;
- own deck count only;
- own discard count and visible discard summaries;
- opponent hand count only;
- opponent leader source id and used flag;
- opponent deck count only;
- opponent discard count and visible discard summaries;
- public board rows, row horns, weather, score totals, and safe prompt details.

Prompt ids and prompt option ids are represented with row-local refs. Prompt target cards are included only when they are visible to the acting seat.

## Legal Actions

The export intentionally uses a per-row legal action list rather than a fixed global neural action vector.

Action encoding preserves the order returned by `getLegalMoves`. Each action has a row-local id like `action_0`, safe source/target refs when visible, compact metadata, and no raw `moveId`. `chosenActionIndex` points to the encoded action that matched the replayed command.

Default policy rows include:

- `choose_mulligan`
- `play_card`
- `pass`
- `use_leader` when legal and selected by policy
- `choose_prompt_option`

`resolve_round_end` is a headless simulation auto-resolver action, not a policy-owned decision. It is excluded by default. Passing `includeSystemActions: true` includes it with `actorKind: "system"` for diagnostics.

## Rewards

Rewards are deliberately sparse placeholders:

- completed-match terminal policy row for the winner's seat: `1`;
- completed-match terminal policy row for the losing seat: `-1`;
- completed-match terminal policy row for a draw: `0`;
- all intermediate rows and non-completed runs: `null`.

There is no shaped reward, score delta reward, round reward, or policy evaluation ladder in this phase.

## Diagnostics

Dataset summary counts rows by action kind, seat, and policy id. Per-match diagnostics include replay status, emitted row count, skipped command count, legal-move match failures, and redaction warnings.

Diagnostics are compact and must not include raw state, raw commands, card instance ids, hidden hand identities, or deck order.

## Validation And JSONL

`validateSimulationExportDataset` checks the safe contract before data leaves memory. It validates schema versions, top-level counts, summary consistency, row id uniqueness, observation/action/reward versions, legal action list alignment, chosen action alignment, terminal reward shape, system action policy, and hidden-info/raw-debug redaction hazards.

`assertValidSimulationExportDataset` throws with validation issue codes and narrows valid values to `SimulationExportDataset`.

`serializeSimulationExportDatasetToJsonl` emits deterministic in-memory JSONL with a `dataset_header` record followed by one `decision_row` record per row. It validates by default. `parseSimulationExportDatasetJsonl` parses line-delimited JSON, reconstructs a dataset when a header is present, validates it, and returns structured issues for malformed input instead of throwing for ordinary bad records.

See `docs/simulation/export-jsonl-boundary.md` for the full validation and JSONL boundary.

## Still Out Of Scope

Future work still needs a JSONL file writer, Python or learner bridge, model-ready tensorization, fixed action-vector design, stronger replay/intermediate-state validation, observation hashing if needed, broader seed suites, policy evaluation, and reward design beyond the sparse terminal placeholder.
