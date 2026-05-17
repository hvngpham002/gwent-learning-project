# Lab Compute Hardware Spec

> **CLAIM STATUS: INFRASTRUCTURE / OBSERVED COMPUTE INVENTORY**
> This file records a point-in-time diagnostic snapshot of available compute.
> It is not a manuscript claim. Refresh before reporting hardware in any paper,
> proposal, or reproducibility appendix.

Last observed: 2026-05-12
Observed by: user-provided terminal diagnostics
Cluster scheduler: Slurm

## Access Pattern

| Surface | Observation |
|---|---|
| Login node observed | `login-restricted-1` |
| Worker node observed | `worker-0` |
| Slurm partition | `main` |
| Tested interactive request | `srun -p main --cpus-per-task=16 --mem=256G --gres=gpu:1 --time=01:00:00 --pty bash -l` |
| Tested allocation | 1 GPU, 16 CPUs, 256 GB RAM |
| Job ID observed | `13628` |
| GPU visibility inside job | `CUDA_VISIBLE_DEVICES=0` |

Use the login node for SSH, file management, and job submission. Use allocated
worker nodes for GPU or heavy CPU work.

## Node Snapshot

| Component | Observation |
|---|---|
| Partition state at observation time | 2 nodes `drain*`, 2 nodes `mix` |
| GPU type per listed node | `gpu:nvidia_h100_80gb_hbm3:8` |
| GPU tested | NVIDIA H100 80GB HBM3 |
| GPU memory tested | 81,559 MiB |
| GPU power limit | 700 W |
| CPU model | Intel Xeon Platinum 8462Y+ |
| Logical CPUs per worker | 128 |
| Sockets / cores | 2 sockets, 32 cores per socket, 2 threads per core |
| Memory per worker | about 2.0 TiB |
| NUMA layout | 2 NUMA nodes |

## Software Snapshot

| Component | Observation |
|---|---|
| NVIDIA driver | 570.133.20 |
| CUDA reported by driver | 12.8 |
| Base Python | 3.10.12 |
| Base PyTorch | Not installed |
| CUDA compiler `nvcc` | Not found in base environment |
| Environment modules | No modules loaded during diagnostic |
| Internet access | PyPI and Hugging Face reachable from worker node |

The base environment is bare. Create project-specific virtual environments or
use approved container/module workflows if the lab later provides them.

## Storage Snapshot

| Path | Observation | Recommended Use |
|---|---|---|
| `$HOME` / root-mounted persistent storage | 4.0 TB total, 3.8 TB used, about 208 GB free, 95% used | Code, small configs, small result summaries |
| `/tmp` | about 1.0 TB free during diagnostic | Temporary caches, model downloads, intermediate outputs |

Treat `/tmp` as temporary. Do not rely on it for durable results. Copy final
metrics, logs, configs, and figures back to persistent project paths.

## Practical Interpretation

This compute is strong enough for future Gwent AI work such as:

- large automated benchmark and failure-mining sweeps once the scripts are
  reproducible and output-bounded;
- GPU neural evaluator or policy pilots after the benchmark ladder is stable;
- local model inference or embedding jobs when external API exposure is
  undesirable;
- future search/self-play experiments that need many parallel simulations.

Current TypeScript benchmark commands (`npm run benchmark:*`) are CPU/Node
workloads and should not consume an H100 unless paired with a GPU-specific
experiment. Use a CPU-only Slurm allocation or local hardware for those runs.

This compute does not solve:

- literature grounding;
- dataset access permissions;
- data sensitivity classification;
- experiment design;
- claim audit and manuscript evidence standards.
- repo correctness or hidden-info safety checks, which still have to pass in
  the normal project test suite.

## Refresh Protocol

Before a new experiment series or before writing hardware details into an
external-facing artifact, rerun:

```bash
hostname
sinfo -p main -o "%P %a %l %D %t %G %m %c"
squeue -p main -u "$USER"
nvidia-smi
nvidia-smi --query-gpu=name,memory.total,driver_version,power.limit --format=csv
lscpu
free -h
df -h "$HOME" /tmp 2>/dev/null
python3 --version
which nvcc || true
```

Inside the active Python environment, also run:

```bash
python - <<'PY'
import sys
print("python:", sys.version)
try:
    import torch
    print("torch:", torch.__version__)
    print("cuda available:", torch.cuda.is_available())
    print("cuda version:", torch.version.cuda)
    print("gpu count:", torch.cuda.device_count())
    if torch.cuda.is_available():
        print("gpu name:", torch.cuda.get_device_name(0))
except Exception as e:
    print("torch check failed:", repr(e))
PY
```

## Claim Audit

| Claim Type | Status |
|---|---|
| Hardware/software/storage values | OBSERVED from user-provided terminal output on 2026-05-12 |
| Future availability | NOT CLAIMED |
| Suitability for thesis or paper claims | NOT CLAIMED |
| Manuscript-ready hardware statement | REQUIRES REFRESH at the time of final experiment run |
