# Shared Experiment Workflow

> **CLAIM STATUS: INFRASTRUCTURE / EXPERIMENT EXECUTION CONTRACT**
> This file standardizes how experiments are prepared and recorded. Scientific
> protocols, hypotheses, metrics, and conclusions remain project-specific.

## Scope

This workflow applies to local project compute. The active setup is controlled
by the [experiment status ledger](experiment-status-ledger.md); do not use a
server or cluster unless that ledger explicitly enables it.

Project-specific files decide:

- research question;
- dataset;
- model or algorithm;
- metrics;
- baselines;
- statistical analysis;
- interpretation.

## Standard Lifecycle

1. Create an experiment card from `docs/compute/templates/experiment-card.md`.
2. Classify the data sensitivity and storage location.
3. Confirm the software environment.
4. Run a smoke test locally.
5. Run a small pilot with bounded inputs.
6. If the expected runtime exceeds 15 minutes, hand the local command to the
   user under the ledger's long-run handoff contract; otherwise use
   `templates/local-batch.sh` for a bounded repeatable run.
7. Save logs, config, seed, command, commit state, and outputs.
8. Summarize Gwent AI results in `docs/research/literature/ai/`.
9. Use results in manuscript or proposal prose only after project-specific audit.

## Required Directory Pattern

Recommended repository-local structure:

```text
docs/research/literature/ai/
  compute-plan.md
  benchmark-results/
    <suite-id>/latest/
  decisions/
  policies/

.local/compute-results/
  <experiment-id>/
    <run-id>/
```

Use `.local/compute-results/` for bulky or transient local outputs. Commit only
small, audited public artifacts that are intentionally part of the repository,
such as the existing benchmark `manifest.json`, `summary.json`,
`records.jsonl`, and `report.md` files.

## Experiment Card Requirements

Every experiment card should include:

- project;
- experiment ID;
- owner or agent;
- purpose;
- data sensitivity class;
- input paths;
- output paths;
- code paths;
- command;
- local machine/runtime details;
- expected runtime;
- random seeds;
- success criteria;
- stop conditions;
- cleanup rules;
- interpretation boundary.

The interpretation boundary is required. It states what a successful run can
and cannot establish.

## Data Sensitivity Classes

Use the most conservative applicable label:

| Class | Meaning | Default Handling |
|---|---|---|
| `PUBLIC` | Public data or generated synthetic data | Can be committed only if small and license-compatible |
| `DERIVED-PUBLIC` | Outputs derived only from public or synthetic data | Can be summarized; large files stay out of Git |
| `CONTROLLED` | Licensed, restricted, or access-controlled research data | Do not commit raw data; record access boundary |
| `SENSITIVE` | Personal, clinical, user, or platform data | Do not move without approval; minimize copies |
| `SECRET` | Credentials, API keys, tokens, deployment secrets | Never commit; never place in job logs |

## Result Status Labels

Use these labels in project experiment docs:

| Label | Meaning |
|---|---|
| `PLANNED` | Protocol exists; not run |
| `SMOKE-PASSED` | Environment and minimal computation verified |
| `PILOT-RUN` | Small bounded run completed |
| `FULL-RUN` | Main run completed |
| `FAILED` | Run failed and log is retained |
| `SUPERSEDED` | Kept for provenance but not current |
| `AUDITED` | Outputs checked against protocol and ready to cite internally |

## Agent Rules

- Do not launch expensive runs without an experiment card.
- Confirm the local-only status in the experiment status ledger before running.
- Do not use `/tmp` as durable storage.
- Do not submit Slurm jobs or request an H100 while the ledger marks that setup
  unavailable.
- Do not commit raw controlled or sensitive data.
- Do not convert exploratory output into a paper claim without project audit.
- Do not overwrite previous result directories.
- Use the local wrapper or an equivalent recorded local command for reproducible
  evidence-producing runs.
- For expected runs over 15 minutes, provide the user a copy-ready terminal
  command and result path; do not start or wait on it in an agent session.

## Claim Audit

Execution contract. No research claims.
