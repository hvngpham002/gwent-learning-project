# Gwent AI Manuscript

Working track for the applied systems / AI paper about this project.

Current working-title candidates:

1. **A Deterministic Research Environment for Imperfect-Information
   Gwent AI**
2. **From Rules Engine to Research Ladder: Building Gwent as an
   Imperfect-Information AI Testbed**
3. **A Hidden-Information-Safe Gwent Engine for Search, Simulation, and
   Learning**
4. **GwentBench: A Deterministic Benchmark for Imperfect-Information
   Card-Game AI**

Current recommendation: use **GwentBench** only if the benchmark ladder
becomes a major contribution. Until then, use the more honest working
title in `paper/main.tex`.

Build from `paper/`:

```sh
pdflatex main && bibtex main && pdflatex main && pdflatex main
```

Generated LaTeX artifacts should not be committed unless explicitly
requested.
