# Benchmark Deck Taxonomy

Date: 2026-05-10

## Purpose

Benchmark results are only comparable when their deck source and purpose
match. cFp23 makes the benchmark deck categories explicit in code and
documentation so smoke checks, starter coverage, future mechanics stress
tests, and future competitive strength claims do not get collapsed into
one overloaded suite.

## Categories

`smoke` decks are tiny regression baselines for harness and policy
plumbing. They are allowed to be narrow and cheap. They should not be
used as evidence that one policy is broadly strong.

`starter` decks are stable official starter presets used for broad,
reproducible faction coverage. They are catalog-backed, easy to review,
and deliberately not optimized competitive lists.

`mechanics` decks are future constructed presets designed to stress
specific rules or faction mechanics, such as weather, muster, medics,
spies, scorch, leader reactions, Skellige side-deck behavior, or discard
recursion. They should be labeled by the mechanic they stress and should
not be treated as balanced strength benchmarks.

`competitive` decks are future curated strong lists intended for
strength-oriented policy comparison. They require a sourcing and review
process before entering the benchmark registry.

## cFp23 Starter Matrix

cFp23 starts with starter decks because the project already has five
stable official starter presets:

- `official-northern-realms-starter`
- `official-nilfgaard-starter`
- `official-monsters-starter`
- `official-scoiatael-starter`
- `official-skellige-starter`

These decks create the first broader fixed-suite faction matrix without
requiring online deck-list research, balance judgment, or new deck
construction. The resulting `benchmark-starter-matrix-v1` suite measures
policy behavior over starter coverage, not optimized deck strength. Each
unordered starter pair is run with both policy assignments and mirrored
seat order so a policy is not confounded with one fixed deck side.

## Deferred Competitive Lists

Optimized or best-in-faction deck lists are deferred because they need a
different review standard:

- source the list from a documented local design note or a reviewed
  external source package;
- record exact card counts, leader choice, faction, source date, and
  reviewer;
- version the list as benchmark data rather than mutating existing
  starter or smoke descriptors;
- explain whether it is meant to represent current product balance,
  historical Witcher 3 Gwent strength, or a project-specific benchmark
  population;
- avoid replacing older competitive descriptors without preserving the
  old version for reproducibility.

Future reports must not compare a smoke result, a starter matrix result,
a mechanics stress result, and a competitive result as if they measured
the same thing. Each category answers a different question and should be
reported with its suite id, deck category, sample count, matchup set, and
policy versions.
