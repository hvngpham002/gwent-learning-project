# Simulation Export JSONL Boundary

`cDp11` adds runtime validation and deterministic in-memory JSONL serialization for the `sim-export-v1` safe export dataset.

```ts
import {
  buildSimulationExportDataset,
  parseSimulationExportDatasetJsonl,
  serializeSimulationExportDatasetToJsonl,
  validateSimulationExportDataset,
} from "@/game/sim";

const dataset = buildSimulationExportDataset({
  batchInput: { suiteId: "current-smoke-v1" },
});

const validation = validateSimulationExportDataset(dataset);
const jsonl = serializeSimulationExportDatasetToJsonl(dataset);
const parsed = parseSimulationExportDatasetJsonl(jsonl);
```

This boundary is still pure TypeScript data handling. It does not write files, add a CLI, bridge to Python, train a model, define tensor shapes, or add storage.

## Validation API

`validateSimulationExportDataset(value, options?)` returns structured issues with:

- `severity`: `error` or `warning`;
- `code`: stable short issue code;
- `path`: path such as `rows[3].legalActions[0].actionId`;
- `message`: actionable explanation.

`assertValidSimulationExportDataset(value, options?)` throws when validation fails and narrows valid values to `SimulationExportDataset`.

Validation options:

- `allowSystemActions`: defaults to `true`; set to `false` to reject `resolve_round_end` diagnostic rows.
- `requireNoWarnings`: defaults to `false`; if true, warnings also make the result invalid.

Validation checks schema versions, top-level counts, summary consistency, row id uniqueness, row scalar fields, observation/action/reward versions, legal action count and mask alignment, chosen action alignment, terminal reward shape, final gem counts, and system action policy.

## Redaction Checks

The validator scans recursively for raw debug or hidden-info hazards:

- forbidden keys such as `finalState`, `commandLog`, `cardsById`, `instanceId`, `moveId`, `rawResult`, `ownHand`, and `opponentHand`;
- raw event arrays;
- deck arrays where only `deckCount` should appear;
- raw generated card instance id strings such as `seat_a:`;
- raw engine action refs such as strings starting with `play:`, `mulligan:`, or `leader:`;
- opponent `cardsInHand`;
- prompt `targetStrength` without a visible `target`.

Safe fields such as visible-card `sourceId`, `deckCount`, opponent `cardCountInHand`, and acting-seat `own.cardsInHand` remain allowed.

Validation does not prove game correctness, replay determinism, strategic quality, reward quality, or future cross-version compatibility. It only guards the export contract.

## JSONL Shape

The JSONL schema version is `sim-export-jsonl-v1`.

The default serializer emits one header line followed by one decision-row line per dataset row:

```json
{"recordType":"dataset_header","jsonlSchemaVersion":"sim-export-jsonl-v1","exportSchemaVersion":"sim-export-v1","generatedBy":"headless-simulation-export","suiteId":"current-smoke-v1","seeds":["sim-smoke-001"],"policiesBySeat":{"seat_a":"legal-heuristic-v0","seat_b":"legal-heuristic-v0"},"rowCount":1,"matchCount":1,"summary":{"schemaVersion":"sim-export-v1"}}
```

```json
{"recordType":"decision_row","jsonlSchemaVersion":"sim-export-jsonl-v1","row":{"schemaVersion":"sim-export-v1","rowId":"..."}}
```

The examples are abbreviated; actual records contain the full summary and row payloads.

`serializeSimulationExportDatasetToJsonl(dataset)` validates by default and throws with validation issue codes if the dataset is unsafe. It uses `\n` between records and does not require a trailing newline.

`parseSimulationExportDatasetJsonl(jsonl)` returns:

- `header`;
- `rows`;
- reconstructed `dataset` when a header exists;
- structured `issues`.

Malformed JSON, unknown record types, missing headers, row-count mismatches, schema-version mismatches, and reconstructed dataset validation failures are returned as issues rather than thrown for ordinary bad input.

## Future Tooling Boundary

This JSONL boundary prepares for later Python or ML tools by making the export contract validated and line-delimited in memory first. A future phase can decide how to write files, version storage, define action vectors, tensorize observations, or train policies without changing this phase into an IO or ML implementation.
