# Imperfect-Information Theory Manuscript

Working track for a theory-first paper. This should remain an outline
until the annotation workflow identifies a defensible theoretical claim.

Working-title candidates:

1. **Legal-Action Abstractions for Imperfect-Information Card Games**
2. **Determinization, Legal Actions, and Evaluation in
   Imperfect-Information Card Games**
3. **Benchmarking Imperfect-Information Card-Game Agents Without
   Hidden-State Leakage**
4. **A Formal Evaluation Ladder for Hidden-Information Card Games**

Current recommendation: keep the working title in `paper/main.tex`
broad but not overclaiming. The strongest likely theory angle is an
evaluation/abstraction paper, not a new equilibrium algorithm, unless
the literature review reveals a real gap.

Build from `paper/`:

```sh
pdflatex main && bibtex main && pdflatex main && pdflatex main
```

Generated LaTeX artifacts should not be committed unless explicitly
requested.
