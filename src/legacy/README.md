# Legacy Source Boundary

This directory contains the quarantined pre-engine Redux gameplay implementation that is reachable only through `/legacy`.

Do not import `@/legacy/...` from new product UI, engine UI, pure engine, simulation, benchmark, catalog, or AI-policy code. The temporary production exceptions are the route wrapper consumed by `src/App.tsx` and the legacy reducers mounted in `src/store/index.ts`.

Legacy code is preserved for comparison and fallback only. Do not rewrite legacy rules, scoring, timers, Redux state, or AI behavior in product phases unless a spec explicitly targets legacy cleanup.
