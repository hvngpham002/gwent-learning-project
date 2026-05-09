# Gwent AI Literature Sweep Prompt - 2026-05-08

The active sweep prompt for this date is:

```text
See docs/research/literature/ai/prompts/lit-sweep-gwent-ai-prompt.md
```

Use that file verbatim as the system / user prompt for a frontier
model (ChatGPT, Claude, Gemini, DeepSeek, etc.) when running the
first Gwent AI literature sweep.

## How To Run The Sweep

1. Open `docs/research/literature/ai/prompts/lit-sweep-gwent-ai-prompt.md`.
2. Submit the full file content to the model of choice.
3. Save the raw response under
   `docs/research/literature/ai/results/2026-05-08/results/<model-name>.md`
   (suggested filenames: `chatgpt.md`, `claude.md`, `gemini.md`,
   `deepseek.md`).
4. Repeat with at least one other reputable model so triage can
   compare retrieval quality.
5. Do **not** treat any model output as authoritative. Treat it as
   a list of retrieval leads. Triage spot-checks the strongest
   candidates against primary sources where practical.

## Results Directory

The original suggested raw-output layout was:

```text
docs/research/literature/ai/results/2026-05-08/results/
  chatgpt.md   # optional — raw response from ChatGPT
  claude.md    # optional — raw response from Claude
  gemini.md    # optional — raw response from Gemini
  deepseek.md  # optional — raw response from DeepSeek
```

The first sweep was saved directly under the date directory instead:

```text
docs/research/literature/ai/results/2026-05-08/
  chatgpt.md
  claude.md
  deepseek.md
  gemini.md
  qwen.md
```

That current layout is accepted for this sweep. Future sweeps should
pick one layout and document it in the dated `prompt.md` before
triage begins.

## Triage Status

The first sweep has been triaged in:

```text
docs/research/literature/ai/results/2026-05-08/triage.md
```

The post-triage annotation order is in:

```text
docs/research/literature/ai/results/2026-05-08/queue.md
```

## Reminder

Per `docs/research/literature/ai/ANNOTATION_WORKFLOW.md`:

- Do not add low-confidence model-suggested citations to any
  authoritative bibliography until a primary source has been
  checked.
- Do not skip the page-bounded batch reading protocol when
  annotating any paper that comes out of this sweep.
- Annotation files are the source of truth for AI/ML claims, not
  raw sweep outputs and not chat discussion.
