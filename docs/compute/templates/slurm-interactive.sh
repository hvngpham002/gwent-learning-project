#!/usr/bin/env bash
# Template: short interactive Slurm allocation for H100 diagnostics.
# Usage: run from the login node only when an experiment card requires GPU work.
# For current TypeScript benchmark commands, prefer a CPU-only allocation:
# srun -p main --cpus-per-task=16 --mem=64G --time=01:00:00 --pty bash -l

srun \
  -p main \
  --cpus-per-task=16 \
  --mem=256G \
  --gres=gpu:1 \
  --time=01:00:00 \
  --pty bash -l
