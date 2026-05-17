"""Minimal PyTorch/CUDA smoke test for Slurm GPU allocations."""

from __future__ import annotations

import platform
import sys
import time


def main() -> int:
    print("python:", sys.version.replace("\n", " "))
    print("platform:", platform.platform())

    try:
        import torch
    except Exception as exc:  # pragma: no cover - diagnostic script
        print("torch import failed:", repr(exc))
        return 2

    print("torch:", torch.__version__)
    print("cuda available:", torch.cuda.is_available())
    print("cuda version:", torch.version.cuda)
    print("gpu count:", torch.cuda.device_count())

    if not torch.cuda.is_available():
        return 3

    print("gpu name:", torch.cuda.get_device_name(0))
    props = torch.cuda.get_device_properties(0)
    print("gpu memory GB:", round(props.total_memory / 1024**3, 1))

    start = time.perf_counter()
    x = torch.randn(12_000, 12_000, device="cuda")
    y = x @ x
    torch.cuda.synchronize()
    elapsed = time.perf_counter() - start
    print("matmul shape:", tuple(y.shape))
    print("max allocated GB:", round(torch.cuda.max_memory_allocated() / 1024**3, 2))
    print("elapsed seconds:", round(elapsed, 3))
    print("smoke test: OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
