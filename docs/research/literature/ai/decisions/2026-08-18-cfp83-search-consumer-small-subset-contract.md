# cFp83 Search Consumer Small Subset Contract

cFp83 consumes immutable cFp80/cFp81 artifacts and selects roots only when their complete compact public action surface is `consumer_ready`. It validates source status, hashes, row counts, dictionary references, and direct cFp81 classifier parity before writing artifacts.

Current is `subset_ready` with 663 roots, 1,488 actions, and 63 inherited skipped roots. Robust is `subset_ready` with 5,314 roots, 12,109 actions, and 340 inherited skipped roots. Both have zero selected-root closure mismatches; robust repeated deterministically.

The subset is public, scalar-oriented benchmark infrastructure. It does not compute an action signal, value, reward, ranking, selection, rollout, or product gameplay behavior.

Outcome: subset_ready: cFp84 may implement a benchmark-only bounded action-evaluation signal over cFp83 selected complete roots only.
