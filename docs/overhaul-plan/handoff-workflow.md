# Orchestrator Handoff Workflow

This project will be implemented through phased handoffs.

## Roles

**Orchestrator, this chat instance**

- owns the roadmap;
- writes each implementation spec;
- reviews reports from implementation instances;
- decides whether to continue, split, redo, or pivot;
- updates future specs based on discoveries.

**Implementation instance**

- executes one phase or subphase;
- reads only the relevant plan, audit, and code;
- changes code and tests as requested;
- reports back with concrete evidence.

**User**

- carries reports between implementation instance and orchestrator;
- approves scope changes;
- decides product tradeoffs when the rulebook or plan leaves options open.

## Implementation Spec Template

The orchestrator should give the implementer a spec like this:

```markdown
# Implementation Spec: Phase X - Name

## Goal

One paragraph.

## Required Reading

- AGENTS.md
- docs/PROJECT_STATE.md
- docs/overhaul-plan/README.md
- docs/overhaul-plan/phase-specs.md
- relevant audit files
- relevant source files

## Scope

- item
- item

## Out Of Scope

- item

## Acceptance Criteria

- item
- item

## Required Tests

- item

## Reporting Requirements

Use the standard phase report template.
```

## Phase Report Template

Implementation instance should report:

```markdown
# Phase X Report

## Summary

Short description of completed work.

## Files Changed

- path: reason

## Acceptance Criteria Status

| Criterion | Status | Evidence |
|---|---|---|

## Tests Run

- command: result

## Project State Update

- What changed in `docs/PROJECT_STATE.md`, or why no update was required.

## Audit Findings Addressed

- R-001: fixed/deferred/not applicable

## Behavior Notes

Any visible behavior changes.

## Risks / Follow-ups

- item

## Recommended Next Step

Proceed / split / revisit / blocked.
```

## Orchestrator Review Checklist

When you bring a report back, the orchestrator should check:

- Did the implementer stay in scope?
- Did they keep the current game playable unless the phase explicitly allowed breakage?
- Did they add or update tests for engine behavior?
- Did they accidentally patch around an audit root cause instead of removing it?
- Did they introduce new human/AI divergence?
- Did they update docs if a planned interface changed?
- Did the phase update `docs/PROJECT_STATE.md`?
- Did CI scripts pass?
- Did forbidden import checks pass?
- Is the next phase still valid, or should it be split?

## CI Expectations

- Every phase report should list `npm run ci` or explain why a subset was run.
- UI phases should include smoke evidence.
- Engine phases should include deterministic tests.
- Reports should call out failed checks explicitly rather than presenting partial evidence as full CI.

## Phase Splitting Rules

Split a phase when:

- a pure engine change touches more than one architectural boundary;
- a data migration exposes schema uncertainty;
- UI migration risks making the current game unplayable for more than one phase;
- AI policy migration needs more legal-move metadata than expected;
- tests reveal existing behavior that contradicts the plan.

## Regression Trace Set

The orchestrator should keep these audit traces alive as acceptance tests or manual smoke checks:

- `R-001`: first player and next-round starter are deterministic under seed and rule-correct.
- `R-004`: Spy goes to controller discard after round end and Scorch.
- `R-005`: human and AI Medic use the same resolver.
- `R-006`: AI can play either seat.
- `R-008`: one-life winner does not trigger auto-new-game.
- `R-009`: Horn source is tied to row slot and effect lifetime.
- `R-010`: side deck exists for Summon, Berserker, and Skellige.
- `R-011`: mulligan cannot duplicate or lose cards.
- `R-012`: Decoy has one board representation and one discard result.
- `F-3.15`: AI considers Agile alternate rows.
- `F-5.11`: score order examples match the rulebook.
- `F-6.5`: simultaneous last-gem loss is draw, no score increment.
- `F-10.4`: Skellige Storm affects Ranged and Siege.

## Reporting Back To This Orchestrator

When you bring an implementation report back here, include:

- phase number/name;
- report text;
- any failed tests;
- any files the implementer says need review;
- whether you want a next phase spec or a corrective spec.
