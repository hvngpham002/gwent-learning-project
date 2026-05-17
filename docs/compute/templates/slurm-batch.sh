#!/usr/bin/env bash
# Template: reproducible Gwent benchmark Slurm batch job.
# Submit from the repository root after copying to a project-specific run path.
# Default workload is CPU/Node benchmark generation, so no GPU is requested.
# For H100 jobs, add a GPU directive only when the experiment card requires it.

#SBATCH --job-name=gwent-<experiment>
#SBATCH --partition=main
#SBATCH --cpus-per-task=16
#SBATCH --mem=64G
#SBATCH --time=02:00:00
#SBATCH --output=logs/%x-%j.out
#SBATCH --error=logs/%x-%j.err

set -euo pipefail

REPO_ROOT="${REPO_ROOT:-$PWD}"
EXPERIMENT_ID="${EXPERIMENT_ID:-<experiment-id>}"
BENCHMARK_SUITE="${BENCHMARK_SUITE:-benchmark-v1-starter-matrix-v1}"
RUN_ID="${SLURM_JOB_ID:-manual}-$(date +%Y%m%d-%H%M%S)"
RESULT_DIR="${RESULT_DIR:-$REPO_ROOT/.local/compute-results/$EXPERIMENT_ID/$RUN_ID}"
JOB_SCRATCH="/tmp/$USER/${SLURM_JOB_ID:-manual}"

mkdir -p "$RESULT_DIR" "$JOB_SCRATCH"/{npm,outputs}

export npm_config_cache="$JOB_SCRATCH/npm"

{
  echo "run_id=$RUN_ID"
  echo "job_id=${SLURM_JOB_ID:-manual}"
  echo "host=$(hostname)"
  echo "date_start=$(date -Is)"
  echo "repo_root=$REPO_ROOT"
  echo "experiment_id=$EXPERIMENT_ID"
  echo "benchmark_suite=$BENCHMARK_SUITE"
  echo "git_status_start:"
  git -C "$REPO_ROOT" status --short || true
  echo "node:"
  node --version || true
  echo "npm:"
  npm --version || true
} > "$RESULT_DIR/run-metadata.txt"

npm ci
npx tsx scripts/run-benchmark-report.ts \
  --suite "$BENCHMARK_SUITE" \
  --out "$JOB_SCRATCH/outputs/$BENCHMARK_SUITE/latest" \
  2>&1 | tee "$RESULT_DIR/run.log"

cp -r "$JOB_SCRATCH/outputs/." "$RESULT_DIR/"

{
  echo "date_end=$(date -Is)"
  echo "git_status_end:"
  git -C "$REPO_ROOT" status --short || true
} >> "$RESULT_DIR/run-metadata.txt"
