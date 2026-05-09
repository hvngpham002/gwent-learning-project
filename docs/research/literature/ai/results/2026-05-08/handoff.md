# Gwent AI Literature Sweep Handoff - 2026-05-08

## For Future Agents

If you are picking up this workflow, do these things in order:

1. Read `docs/research/literature/ai/ANNOTATION_WORKFLOW.md` end to end.
2. Read this handoff, `triage.md`, `queue.md`, and `brief.md`.
3. Do not annotate without a source package under
   `docs/research/literature/ai/source/<citekey>/manifest.yaml`.
4. Follow the 10-page batch reading protocol exactly. Read at most one
   batch, update the annotation file immediately, then stop and wait
   for explicit user permission before reading the next batch.
5. Do not use raw model outputs as authoritative citations.

## Current Decision State

The first sweep has been triaged. The key decision is:

> Cluster F should continue with literature annotation and evaluation
> ladder design before implementing `legal-heuristic-v1`, ISMCTS,
> neural self-play, CFR experiments, or benchmark tooling.

The likely future implementation direction is a small-compute
imperfect-information search baseline, probably ISMCTS / ensemble
determinization, but only after the ISMCTS and PIMC-caution papers are
annotated.

The likely first implementation-adjacent spec is an evaluation ladder:
fixed seeds, matchup matrix, rating system, and an approximate
best-response / exploitability probe if the literature supports it.

## Raw Sweep Outputs

The raw outputs are currently stored directly under:

```text
docs/research/literature/ai/results/2026-05-08/
  chatgpt.md
  claude.md
  deepseek.md
  gemini.md
  qwen.md
```

This differs from the original suggested `results/<model-name>.md`
subdirectory, but the current layout is acceptable as long as future
docs refer to the actual files.

## Recommended Next Work

### cFp2 - First Source Package And Annotation Batch

Create a source package for:

```text
cowling2012ismcts
```

Then read and annotate only the first batch of the paper under the
workflow:

- create `docs/research/literature/ai/source/cowling2012ismcts/manifest.yaml`;
- verify `docs/research/bibliography/references.bib` exists and contains
  `cowling2012ismcts`;
- check whether
  `docs/research/literature/ai/source/cowling2012ismcts/source.pdf`
  exists; if it does, use `status: local-source-available`, otherwise
  keep `status: url-only` and do not claim a local PDF was read;
- create
  `docs/research/literature/ai/annotations/cowling2012ismcts/cowling2012ismcts.md`;
- read at most pages 1-10;
- write page-grounded notes immediately;
- stop and ask whether to continue.

Do not read the full paper in one turn.

### cFp3+ - Next Annotation Targets

After `cowling2012ismcts`, proceed in this order unless availability
forces a swap:

1. `cowling2012mtg`
2. `long2010pimc`
3. `zinkevich2007cfr`
4. `lanctot2009mccfr`
5. `huang2022invalidmasking`
6. `timbers2022approxexploitability`

Once the first 2-4 annotations are complete, write a short decision
note on whether the next implementation spec should be:

- evaluation ladder first;
- ISMCTS baseline first;
- legal-heuristic-v1 first;
- or a reduced CFR/MCCFR experiment first.

Current triage recommends **evaluation ladder first**, but that should
be confirmed against annotations.

## What Not To Do Next

- Do not implement neural self-play yet.
- Do not assume AlphaZero / MuZero transfers cleanly to Gwent.
- Do not make a hidden-information-cheating policy the default
  benchmark.
- Do not cite model-generated venue/DOI metadata without checking it.
- Do not treat CCG papers as Gwent rule sources.

## Copy-Ready Next Prompt

```text
Read @docs/research/literature/ai/ANNOTATION_WORKFLOW.md,
@docs/research/literature/ai/results/2026-05-08/triage.md,
@docs/research/literature/ai/results/2026-05-08/queue.md, and
@docs/research/literature/ai/results/2026-05-08/handoff.md.

Then perform cFp2: create the source package and first page-bounded
annotation batch for cowling2012ismcts only. Before reading, verify
@docs/research/bibliography/references.bib contains cowling2012ismcts
and check whether the raw PDF exists at
@docs/research/literature/ai/source/cowling2012ismcts/source.pdf. Read
at most pages 1-10, write the annotation file immediately with
page-grounded notes, update @docs/PROJECT_STATE.md, and create the
required report under @audit/reports/. Do not implement AI code and do
not continue to page 11 until explicitly told to continue.
```
