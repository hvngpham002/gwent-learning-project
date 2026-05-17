# Slurm Workflow

> **CLAIM STATUS: INFRASTRUCTURE / OPERATIONAL GUIDE**
> This file describes how to use shared compute safely. It is not evidence for
> research claims.

## Mental Model

| Full-stack analogy | Server equivalent |
|---|---|
| Bastion or jump host | Login node |
| Scheduled cloud VM | Slurm worker allocation |
| Kubernetes or GitHub Actions scheduler | Slurm |
| Dependency layer | Python virtual environment, Conda env, or container |
| Temporary build/cache volume | `/tmp` on the worker |
| Durable artifact storage | Persistent project paths under `$HOME` |

Do not run heavy jobs on the login node. Submit or request resources through
Slurm, then run heavy commands on the allocated worker.

## `srun` vs `sbatch`

| Command | Use For | Pattern |
|---|---|---|
| `srun --pty bash -l` | Short interactive diagnostics, debugging, smoke tests | Human stays attached |
| `sbatch script.sh` | Reproducible experiment runs | Script runs after scheduling |

Use `srun` to explore. Use `sbatch` for anything that should become evidence,
tables, figures, or repeated experimental output.

## Safe Interactive Allocation

For CPU-only repository benchmark work, start without a GPU:

```bash
srun -p main --cpus-per-task=16 --mem=64G --time=01:00:00 --pty bash -l
```

For GPU smoke tests or GPU-specific experiment cards, request one H100 with a
bounded time limit:

```bash
srun -p main --cpus-per-task=16 --mem=256G --gres=gpu:1 --time=01:00:00 --pty bash -l
```

Avoid `--time=UNLIMITED` for diagnostics. Use longer allocations only when a
run card states expected runtime, stop conditions, and output paths.

## Environment Setup Pattern

Prefer job-local environments under `/tmp` for lab jobs because persistent
storage is crowded and the cluster is not a product dependency.

```bash
export JOB_SCRATCH="/tmp/$USER/${SLURM_JOB_ID:-manual}"
mkdir -p "$JOB_SCRATCH"/{repo,npm,venv,hf,torch,outputs}

python3 -m venv "$JOB_SCRATCH/venv"
source "$JOB_SCRATCH/venv/bin/activate"
python -m pip install --upgrade pip wheel setuptools
```

For model-heavy jobs, keep large caches in job scratch:

```bash
export HF_HOME="$JOB_SCRATCH/hf"
export TRANSFORMERS_CACHE="$JOB_SCRATCH/hf/transformers"
export TORCH_HOME="$JOB_SCRATCH/torch"
```

For current Gwent TypeScript benchmarks, Node dependencies should also cache in
job scratch:

```bash
export npm_config_cache="$JOB_SCRATCH/npm"
npm ci
```

Do not store credentials, API keys, or private data in job scripts.

## Gwent Repo Benchmark Pattern

Run this from an allocated worker, not the login node. If the repo is not
already present on the cluster, clone or copy it into `$JOB_SCRATCH/repo`
without printing credentials in the shell history or job log.

```bash
cd "$JOB_SCRATCH/repo/gwent-learning-project"
git status --short
npm ci
npm run benchmark:v1-smoke -- --out "$JOB_SCRATCH/outputs/benchmark-v1-smoke-v1/latest"
npm run benchmark:v1-starter-matrix -- --out "$JOB_SCRATCH/outputs/benchmark-v1-starter-matrix-v1/latest"
```

After the run, copy only the small audited artifacts you intend to keep:

```bash
mkdir -p "$RESULT_DIR"
cp -r "$JOB_SCRATCH/outputs/." "$RESULT_DIR/"
```

The existing benchmark artifact schema is documented in
`docs/research/literature/ai/benchmark-harness.md`. Do not copy raw debug
states, hand/deck arrays, credentials, dependency caches, model weights, or
unreviewed bulky outputs into Git.

## Storage Discipline

Use persistent storage for:

- code;
- small configs;
- run manifests;
- logs;
- result CSV files;
- final figures.

Use `/tmp` for:

- model caches;
- package build caches;
- temporary datasets;
- intermediate tensors;
- scratch output that can be regenerated.

At the end of a job, copy durable outputs back to the project:

```bash
mkdir -p "$RESULT_DIR"
cp -r "$JOB_SCRATCH/outputs/." "$RESULT_DIR/"
```

## Minimum Job Metadata

Every non-trivial run should record:

- project name;
- experiment ID;
- git commit or `git status --short`;
- command;
- Slurm job ID;
- node name;
- GPU model and driver;
- Python environment;
- random seeds;
- input data location;
- output location;
- start and end time.

## Failure Handling

If a run fails:

- keep the log;
- record the failing command;
- record whether the failure was environment, data, code, memory, timeout, or scheduler-related;
- do not overwrite the failed output directory with a later successful run.

## Claim Audit

Operational guide. No research claims.
