#!/usr/bin/env bash
# Local-only benchmark execution wrapper.
# Active setup authority: docs/compute/experiment-status-ledger.md

set -euo pipefail

REPO_ROOT="${REPO_ROOT:-$PWD}"
EXPERIMENT_ID="${EXPERIMENT_ID:-local-benchmark}"
BENCHMARK_SUITE="${BENCHMARK_SUITE:-benchmark-v1-starter-matrix-v1}"
RUN_ID="${RUN_ID:-local-$(date +%Y%m%d-%H%M%S)}"
RESULT_DIR="${RESULT_DIR:-$REPO_ROOT/.local/compute-results/$EXPERIMENT_ID/$RUN_ID}"

mkdir -p "$RESULT_DIR"

{
  echo "run_id=$RUN_ID"
  echo "execution_setup=local_workstation"
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

cd "$REPO_ROOT"
npx tsx scripts/run-benchmark-report.ts \
  --suite "$BENCHMARK_SUITE" \
  --out "$RESULT_DIR/$BENCHMARK_SUITE/latest" \
  2>&1 | tee "$RESULT_DIR/run.log"

{
  echo "date_end=$(date -Is)"
  echo "git_status_end:"
  git -C "$REPO_ROOT" status --short || true
} >> "$RESULT_DIR/run-metadata.txt"
