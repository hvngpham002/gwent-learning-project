# Gwent AI Literature Annotation Workflow

**Project:** Gwent Learning Project — AI/ML Research Foundation
**Version:** 2026-05-08

## Purpose

This workflow governs how literature is read, annotated, and used as
authoritative input for AI/ML decisions in this project. It covers
research consumed by:

- legal heuristic AI policy design;
- benchmark ladder design (Elo/Glicko, matchup matrices, fixed seed
  suites, regression baselines);
- imperfect-information game modeling for Gwent;
- self-play and search planning;
- ML observation/action/reward design;
- difficulty tier design and human-like bounded play;
- future Gwent AI paper or report writing.

> Annotation files under `docs/research/literature/ai/annotations/` are
> the source of truth for literature-grounded AI/ML claims.

The roadmap summary in `docs/overhaul-plan/ai-ml-roadmap.md` is a
roadmap, not a literature source. AI/ML specs that depend on a
research claim must point to an annotation file in this directory or
explicitly label the claim as a project hypothesis.

## Directory Contract

This project uses these locations:

```text
docs/research/literature/ai/
  ANNOTATION_WORKFLOW.md
  prompts/
    lit-sweep-gwent-ai-prompt.md
  source/
    <citekey>/
      manifest.yaml
      source.pdf              # local only; ignored by git unless explicitly licensed
  annotations/
    <citekey>/
      <citekey>.md
      build/                  # optional generated annotation artifacts
  results/
    YYYY-MM-DD/
      queue.md
      triage.md
      brief.md
      handoff.md
      prompt.md
```

Source PDFs and downloaded papers are local reading artifacts and
should not be committed unless they are explicitly licensed and
intentionally added later. The workflow assumes `source.pdf` is
local-only.

Annotation markdown, manifests, triage notes, briefs, queues, handoffs,
and prompt snapshots should be committed.

## Step 0 - Research Intake Check

Before annotating a paper:

1. Search existing annotations under
   `docs/research/literature/ai/annotations/` for the citekey, title, DOI,
   or arXiv id.
2. Search the shared Gwent bibliography at
   `docs/research/bibliography/references.bib` for the citekey, title,
   DOI, arXiv id, or URL. If the file is missing, stop and flag it; do
   not start a new annotation without the shared bibliography in place.
3. Avoid adding low-confidence model-suggested citations anywhere
   authoritative until a primary source has been checked.
4. Create a `manifest.yaml` source package before reading the paper.
   Do not begin batch reading without one.
5. Check whether
   `docs/research/literature/ai/source/<citekey>/source.pdf` exists.
   If it exists, verify that `manifest.yaml` says
   `status: local-source-available` and that `primary_source` points at
   `source.pdf`. If it does not exist, use `status: url-only` or another
   documented non-local status and do not pretend the PDF was read.
6. Check whether the citekey exists in
   `docs/research/bibliography/references.bib`. If it does not, add a
   minimal verified BibTeX entry before or during source-package setup.
   If the bibliography uses a different citekey for the same paper,
   either align it to the annotation citekey or record the alias in the
   manifest notes.

The shared `references.bib` is required for manuscript compatibility.
The annotation file remains the source of truth for what the paper
actually establishes; a BibTeX entry only proves that a citation record
exists.

## Source Package Contract

Each annotated paper has a source package:

```text
docs/research/literature/ai/source/<citekey>/
  manifest.yaml
  source.pdf
```

`manifest.yaml` template:

```yaml
citekey:
title:
authors:
year:
venue:
primary_source: source.pdf
source_type: pdf
status: local-source-available
notes:
```

Acceptable `status` values:

- `local-source-available` — `source.pdf` is present locally and
  readable.
- `url-only` — only a public URL or DOI is known; no local PDF.
- `missing-source` — paper is referenced by triage but neither URL
  nor PDF is currently accessible.
- `secondary-lead-only` — known only through a survey, blog post, or
  another paper's citation; primary source has not been verified.

If a PDF is not locally available, stop and flag the missing source
package. Do not crawl or scrape PDFs unless the user explicitly asks.

Before reading any pages, verify:

- `manifest.yaml` exists;
- `docs/research/bibliography/references.bib` exists;
- the citekey is present in `references.bib` or a verified entry is
  added;
- `source.pdf` exists when the manifest status is
  `local-source-available`;
- if `source.pdf` does not exist, the manifest status is not
  `local-source-available` and the annotation frontmatter does not list
  a local file as read.

## Output Files Per Source

Each annotation package should contain:

| File | Purpose |
|---|---|
| `annotations/<citekey>/<citekey>.md` | Main annotation with page-grounded notes and project relevance |
| `annotations/<citekey>/build/` | Optional generated artifacts |

Annotations live one directory per citekey to keep generated artifacts,
images, or supplementary notes scoped.

## Batch Reading Protocol

Page-bounded reading is **mandatory** when an LLM or assistant reads
the PDF. Each batch is a strict ordered cycle - the agent **must
complete all three steps before moving on**:

```text
  ┌─────────────────────────────────────────────────────────────┐
  │  STEP 1  READ        one batch (≤ 10 pages)                 │
  │  STEP 2  ANNOTATE    write the annotation file NOW          │
  │              - batch 1: create the file + frontmatter +     │
  │                page-grounded notes for pp. 1-10             │
  │              - batch N>1: append page-grounded notes for    │
  │                the pages just read; update `pages_read`     │
  │  STEP 3  STOP + ASK  post the checkpoint message and wait   │
  │                       for explicit user "continue" before   │
  │                       reading any further pages             │
  └─────────────────────────────────────────────────────────────┘
```

Hard rules:

1. **Read at most 10 pages per batch.** Do not pre-read past the
   batch boundary "to get context" — that is the failure mode this
   protocol exists to prevent.
2. **Write the annotation file in the same turn the batch was read,
   before stopping.** The annotation file must exist on disk and
   contain notes for the pages just read by the time the checkpoint
   message is posted. Do not defer writing to a later batch.
3. **Stop and wait for explicit user permission ("continue", "go",
   "next batch", etc.) before reading the next batch.** Do not
   auto-advance, do not read "just one more page", do not read the
   next batch in the same turn as the checkpoint.
4. **Do not write the final `Relevance To Gwent AI`, `Risks For
   Adaptation`, or `AI-Roadmap Decision` sections until every batch
   is complete and the user has confirmed reading is done.** Use
   `_pending - awaiting full read_` until then.
5. **Every factual claim about the paper needs a page or section
   anchor.** See `Citation Discipline`.
6. **Inferences that go beyond the paper must be labeled** with
   `Project inference:` so the annotation cannot be misread as a
   verbatim claim.

Anti-pattern (do not do this):

> ❌ Read batch 1 → checkpoint → read batch 2 → checkpoint → read
> batch 3 → checkpoint → write the entire annotation at the end.

This defeats page-bounded reading: batch 1 details have been pushed
out of context by the time the agent writes notes, and citations
become guesswork. The annotation file **grows with each batch**, not
at the end.

Checkpoint format (post this verbatim, then stop):

```text
Batch N complete (pp. X-Y).
Sections covered this batch: ...
Annotation file updated: docs/research/literature/ai/annotations/<citekey>/<citekey>.md
  - frontmatter: pages_read = "1-Y"          (batch 1)
  - appended sections: <list>                (batch N>1)
Ready to read batch N+1 (pp. Y+1-Z)? Reply "continue" to proceed.
```

If the agent realizes it has read pages without annotating them, it
must stop, write the missing notes from what it can still recall plus
re-open the PDF to verify citations, and flag the lapse in the
checkpoint message before requesting permission to continue.

## Annotation Frontmatter Template

```yaml
---
citekey:
title:
authors:
year:
venue:
doi:
arxiv:
project_relevance:           # direct-implementation | benchmark-methodology | training-method | difficulty-design | background | reject
method_family:               # cfr | deep-cfr | nfsp | mcts | ismcts | self-play-rl | supervised | search | mixed | other
information_model:           # perfect | imperfect | hidden-card | partially-observable | other
action_space:                # fixed-vector | variable-legal-set | masked | other
source_manifest: "docs/research/literature/ai/source/<citekey>/manifest.yaml"
source_files:
  - "docs/research/literature/ai/source/<citekey>/source.pdf"
pages_read: ""               # e.g. "1-10"
status: "in-progress"        # in-progress | complete | deferred | rejected
---
```

Frontmatter values must remain consistent with the body sections. If
the body says the paper is a CFR-family paper, the
`method_family` field must say so too.

## Required Body Sections

Every annotation markdown file must include, in order:

- `## Summary`
- `## Paper Claims`
- `## Game / Environment Model`
- `## Information Model`
- `## Action Space`
- `## Policy / Search / Learning Method`
- `## Training Data`
- `## Self-Play Setup`
- `## Evaluation Method`
- `## Difficulty / Human-Likeness Notes`
- `## Compute Requirements`
- `## What This Paper Establishes`
- `## What This Paper Does Not Establish`
- `## Relevance To Gwent AI`
- `## Risks For Adaptation`
- `## AI-Roadmap Decision`

Sections that do not apply to a paper (for example, a paper with no
self-play setup) should still be present and explicitly note "Not
applicable" with a one-line reason.

## Citation Discipline

Every factual claim about a paper must end with a local source anchor:

- `(p. X)`
- `(Sec. N, p. X)`
- `(Eq. N, p. X)`
- `(Table N, p. X)`
- `(Fig. N, p. X)`

Do not infer factual paper claims from model memory. If a claim is
based on project reasoning rather than the paper, label it as:

```text
Project inference:
```

DOI, arXiv id, or full citation must be repeated inside the annotation
body the first time the paper is referenced beyond the frontmatter.

## AI-Roadmap Decision Fields

Every completed annotation must explicitly answer:

1. **Source category.** Is this a direct implementation candidate,
   benchmark-methodology source, training-method source,
   difficulty-design source, background-only source, or reject?
2. **Game class.** Does it apply to deterministic perfect-information
   play, stochastic games, imperfect-information games, or
   hidden-information card games specifically?
3. **Method family.** Does it require self-play, search, supervised
   learning, reinforcement learning, CFR-style learning, MCTS/ISMCTS,
   or another method family?
4. **Action space.** Does it support variable legal action sets or
   action masking, or does it assume a fixed global action vector?
5. **Evaluation methodology.** Does it provide an evaluation
   methodology (Elo/Glicko, matchup matrix, fixed seed suite,
   tournament harness, exploitability) that this project could adopt?
6. **Agent scope.** Does it support global deck-conditioned agents,
   faction specialists, or both?
7. **Smallest faithful experiment.** What is the smallest faithful
   implementation or experiment this project could run that preserves
   the paper's claim?
8. **Adaptation risk.** What would make adaptation misleading or
   benchmark-gaming for Gwent (e.g. relying on hidden-information
   cheating, using global action vectors that ignore variable legal
   sets, evaluating only against weak fixed opponents)?
9. **Roadmap effect.** Should this source affect Cluster F specs, the
   long-term ML roadmap, both, or neither?

A rejected paper still records answers, even if the answer is "not
applicable - rejected because <reason>".

## Priority Queue

The authoritative current queue lives at:

- `docs/research/literature/ai/results/<latest-date>/queue.md`

The current queue date is `2026-05-08`. The queue lists candidate
*categories* and known reputable papers; it does not yet contain
verified citations for every entry.

Reading order discipline:

1. Read foundations of imperfect-information game AI before
   collectible-card-game-specific work.
2. Read CFR / Deep CFR / NFSP family before self-play RL specific to
   card games, so that "self-play converges" claims can be evaluated
   against imperfect-information theory.
3. Read MCTS / ISMCTS for card games before any Gwent-specific
   adaptation work.
4. Read evaluation/benchmark methodology before drafting a Cluster F
   evaluation ladder spec.
5. Defer learning-based controllable-difficulty papers until a
   baseline AI exists.

Do not start a paper that is several priority tiers below the current
top until the higher-priority tier is annotated or explicitly
deferred.

## Spec Integration Rules

Once this workflow is active:

- Future AI/ML specs may cite chat discussion as motivation, but
  **implementation-affecting research claims must cite annotation
  files** under `docs/research/literature/ai/annotations/`.
- If no annotation supports a research claim, the spec must label it
  as a **project hypothesis** and explicitly accept the risk of being
  unsupported by literature.
- Benchmark, training, search, self-play, difficulty, and model
  architecture decisions must point to annotation-backed evidence
  once at least one annotation exists in the relevant area.
- `docs/overhaul-plan/ai-ml-roadmap.md` remains a roadmap summary,
  not the source of truth for literature claims. Roadmap changes that
  contradict an annotation must update the annotation, retract the
  annotation, or explicitly mark the change as a project hypothesis.
- Specs must not introduce hidden-information shortcuts (for example,
  observing the opponent's hand) unless the annotation explicitly
  supports them as a valid debug/oracle mode and the spec marks them
  as such.
