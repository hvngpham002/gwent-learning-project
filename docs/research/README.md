# Research Workspace

This directory holds project research materials that are broader than
product documentation:

- `literature/` - annotation workflows, source-package manifests,
  sweep prompts, raw sweep outputs, triage notes, and completed
  annotations.
- `bibliography/` - shared BibTeX database used by manuscripts and
  annotation citekeys.
- `manuscripts/` - project paper drafts.
- `examples/` - external or user-provided paper scaffolds kept as
  reference material.

Research claims that affect Cluster F AI/ML specs should cite completed
annotations under `literature/ai/annotations/`. Raw model sweep outputs
and triage notes are retrieval leads, not paper-quality sources.

## Current Manuscript Tracks

- `manuscripts/gwent-ai/` - applied Gwent systems / AI paper.
- `manuscripts/imperfect-info-theory/` - theoretical manuscript track
  for imperfect-information game AI claims. This should stay as an
  outline until the literature annotations justify a concrete claim.

## Bibliography

Use the shared bibliography:

```tex
\bibliography{../../../bibliography/references}
```

New entries should use the same citekey as their annotation package
when possible, for example `cowling2012ismcts`.
