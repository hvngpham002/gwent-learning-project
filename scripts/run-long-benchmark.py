#!/usr/bin/env python3
"""Run long Gwent benchmark profiles with durable logs and optional progress bars.

The runner deliberately orchestrates existing npm benchmark commands instead of
changing benchmark semantics. Install `alive-progress` for a live progress bar:

    python3 -m pip install --user alive-progress
"""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import time
from contextlib import contextmanager
from dataclasses import dataclass, asdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Callable, Iterable


try:
    from alive_progress import alive_bar
except Exception:  # pragma: no cover - exercised manually when dependency exists.
    alive_bar = None


@dataclass(frozen=True)
class BenchmarkStep:
    name: str
    command: str
    artifacts: tuple[str, ...]


@dataclass
class StepResult:
    name: str
    command: str
    status: str
    exitCode: int | None
    durationSeconds: float
    logPath: str
    artifacts: list[str]


@dataclass
class RunResult:
    schemaVersion: str
    runId: str
    profile: str
    dryRun: bool
    startedAt: str
    finishedAt: str
    status: str
    repoRoot: str
    outDir: str
    steps: list[StepResult]


BENCHMARK_RESULT_ROOT = "docs/research/literature/ai/benchmark-results"

PROFILES: dict[str, tuple[BenchmarkStep, ...]] = {
    "smoke": (
        BenchmarkStep(
            name="v1 smoke comparison",
            command="npm run benchmark:v1-smoke",
            artifacts=(f"{BENCHMARK_RESULT_ROOT}/benchmark-v1-smoke-v1/latest",),
        ),
    ),
    "v1-current": (
        BenchmarkStep(
            name="v1 smoke comparison",
            command="npm run benchmark:v1-smoke",
            artifacts=(f"{BENCHMARK_RESULT_ROOT}/benchmark-v1-smoke-v1/latest",),
        ),
        BenchmarkStep(
            name="v1 starter matrix",
            command="npm run benchmark:v1-starter-matrix",
            artifacts=(f"{BENCHMARK_RESULT_ROOT}/benchmark-v1-starter-matrix-v1/latest",),
        ),
        BenchmarkStep(
            name="v1 failure mining",
            command="npm run benchmark:v1-failure-mining",
            artifacts=(
                f"{BENCHMARK_RESULT_ROOT}/benchmark-v1-starter-matrix-v1/failure-mining/latest",
            ),
        ),
    ),
    "v1-current-repeat": (
        BenchmarkStep(
            name="v1 smoke comparison",
            command="npm run benchmark:v1-smoke",
            artifacts=(f"{BENCHMARK_RESULT_ROOT}/benchmark-v1-smoke-v1/latest",),
        ),
        BenchmarkStep(
            name="v1 starter matrix",
            command="npm run benchmark:v1-starter-matrix",
            artifacts=(f"{BENCHMARK_RESULT_ROOT}/benchmark-v1-starter-matrix-v1/latest",),
        ),
        BenchmarkStep(
            name="v1 failure mining",
            command="npm run benchmark:v1-failure-mining",
            artifacts=(
                f"{BENCHMARK_RESULT_ROOT}/benchmark-v1-starter-matrix-v1/failure-mining/latest",
            ),
        ),
        BenchmarkStep(
            name="v1 starter matrix repeat",
            command="npm run benchmark:v1-starter-matrix",
            artifacts=(f"{BENCHMARK_RESULT_ROOT}/benchmark-v1-starter-matrix-v1/latest",),
        ),
        BenchmarkStep(
            name="v1 failure mining repeat",
            command="npm run benchmark:v1-failure-mining",
            artifacts=(
                f"{BENCHMARK_RESULT_ROOT}/benchmark-v1-starter-matrix-v1/failure-mining/latest",
            ),
        ),
    ),
    "v1-expanded": (
        BenchmarkStep(
            name="v1 expanded starter matrix",
            command="npm run benchmark:v1-starter-matrix-expanded",
            artifacts=(
                f"{BENCHMARK_RESULT_ROOT}/benchmark-v1-starter-matrix-expanded-v1/latest",
            ),
        ),
        BenchmarkStep(
            name="v1 expanded failure mining",
            command="npm run benchmark:v1-failure-mining-expanded",
            artifacts=(
                f"{BENCHMARK_RESULT_ROOT}/benchmark-v1-starter-matrix-expanded-v1/failure-mining/latest",
            ),
        ),
    ),
    "v1-expanded-repeat": (
        BenchmarkStep(
            name="v1 expanded starter matrix",
            command="npm run benchmark:v1-starter-matrix-expanded",
            artifacts=(
                f"{BENCHMARK_RESULT_ROOT}/benchmark-v1-starter-matrix-expanded-v1/latest",
            ),
        ),
        BenchmarkStep(
            name="v1 expanded failure mining",
            command="npm run benchmark:v1-failure-mining-expanded",
            artifacts=(
                f"{BENCHMARK_RESULT_ROOT}/benchmark-v1-starter-matrix-expanded-v1/failure-mining/latest",
            ),
        ),
        BenchmarkStep(
            name="v1 expanded starter matrix repeat",
            command="npm run benchmark:v1-starter-matrix-expanded",
            artifacts=(
                f"{BENCHMARK_RESULT_ROOT}/benchmark-v1-starter-matrix-expanded-v1/latest",
            ),
        ),
        BenchmarkStep(
            name="v1 expanded failure mining repeat",
            command="npm run benchmark:v1-failure-mining-expanded",
            artifacts=(
                f"{BENCHMARK_RESULT_ROOT}/benchmark-v1-starter-matrix-expanded-v1/failure-mining/latest",
            ),
        ),
    ),
    "all-current": (
        BenchmarkStep(
            name="baseline smoke",
            command="npm run benchmark:smoke",
            artifacts=(f"{BENCHMARK_RESULT_ROOT}/benchmark-smoke-v1/latest",),
        ),
        BenchmarkStep(
            name="baseline starter matrix",
            command="npm run benchmark:starter-matrix",
            artifacts=(f"{BENCHMARK_RESULT_ROOT}/benchmark-starter-matrix-v1/latest",),
        ),
        BenchmarkStep(
            name="v1 smoke comparison",
            command="npm run benchmark:v1-smoke",
            artifacts=(f"{BENCHMARK_RESULT_ROOT}/benchmark-v1-smoke-v1/latest",),
        ),
        BenchmarkStep(
            name="v1 starter matrix",
            command="npm run benchmark:v1-starter-matrix",
            artifacts=(f"{BENCHMARK_RESULT_ROOT}/benchmark-v1-starter-matrix-v1/latest",),
        ),
        BenchmarkStep(
            name="v1 failure mining",
            command="npm run benchmark:v1-failure-mining",
            artifacts=(
                f"{BENCHMARK_RESULT_ROOT}/benchmark-v1-starter-matrix-v1/failure-mining/latest",
            ),
        ),
    ),
}


class FallbackBar:
    def __init__(self, total: int) -> None:
        self.total = total
        self.count = 0
        self.text = ""

    def __call__(self) -> None:
        self.count += 1
        print(f"[{self.count}/{self.total}] {self.text}")


@contextmanager
def make_progress(total: int, title: str, disabled: bool) -> Iterable[Callable[[], None]]:
    if alive_bar is not None and not disabled:
        with alive_bar(total, title=title, dual_line=True) as bar:
            yield bar
    else:
        if not disabled:
            print(
                "alive-progress is not installed; using plain progress. "
                "Install with: python3 -m pip install --user alive-progress"
            )
        yield FallbackBar(total)


def utc_timestamp() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def default_run_id(profile: str) -> str:
    stamp = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S-%f")[:-3]
    return f"{stamp}-{profile}"


def repo_root_from_script() -> Path:
    return Path(__file__).resolve().parents[1]


def write_json(path: Path, data: object) -> None:
    path.write_text(json.dumps(data, indent=2, sort_keys=False) + "\n", encoding="utf-8")


def write_markdown(path: Path, result: RunResult) -> None:
    lines = [
        f"# Long Benchmark Run `{result.runId}`",
        "",
        f"- Profile: `{result.profile}`",
        f"- Status: `{result.status}`",
        f"- Dry run: `{str(result.dryRun).lower()}`",
        f"- Started: `{result.startedAt}`",
        f"- Finished: `{result.finishedAt}`",
        f"- Repo root: `{result.repoRoot}`",
        f"- Output directory: `{result.outDir}`",
        "",
        "| Step | Status | Exit | Seconds | Log | Artifacts |",
        "| --- | --- | ---: | ---: | --- | --- |",
    ]

    for step in result.steps:
        artifact_text = "<br>".join(f"`{artifact}`" for artifact in step.artifacts) or "-"
        exit_text = "-" if step.exitCode is None else str(step.exitCode)
        lines.append(
            "| "
            + " | ".join(
                [
                    f"`{step.name}`",
                    f"`{step.status}`",
                    exit_text,
                    f"{step.durationSeconds:.2f}",
                    f"`{step.logPath}`",
                    artifact_text,
                ]
            )
            + " |"
        )

    lines.extend(
        [
            "",
            "Paste this summary path or the `run.json` path back into Codex after the run finishes.",
        ]
    )
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def stream_step(step: BenchmarkStep, repo_root: Path, log_path: Path) -> tuple[int, float]:
    start = time.perf_counter()
    with log_path.open("w", encoding="utf-8") as log:
        log.write(f"$ {step.command}\n\n")
        log.flush()
        process = subprocess.Popen(
            step.command,
            cwd=repo_root,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            shell=True,
            text=True,
            bufsize=1,
            env={**os.environ, "FORCE_COLOR": os.environ.get("FORCE_COLOR", "0")},
        )
        assert process.stdout is not None
        for line in process.stdout:
            print(line, end="")
            log.write(line)
        exit_code = process.wait()
    return exit_code, time.perf_counter() - start


def run_profile(args: argparse.Namespace) -> RunResult:
    repo_root = Path(args.repo_root).resolve() if args.repo_root else repo_root_from_script()
    steps = PROFILES[args.profile]
    run_id = args.run_id or default_run_id(args.profile)
    out_dir = (repo_root / args.out_root / run_id).resolve()
    out_dir.mkdir(parents=True, exist_ok=False)

    started_at = utc_timestamp()
    results: list[StepResult] = []
    status = "passed"

    with make_progress(len(steps), f"gwent benchmark {args.profile}", args.no_progress) as bar:
        for index, step in enumerate(steps, start=1):
            try:
                bar.text = step.name
            except AttributeError:
                pass

            step_log = out_dir / f"{index:02d}-{step.name.replace(' ', '-')}.log"
            artifact_paths = [str((repo_root / artifact).resolve()) for artifact in step.artifacts]

            if args.dry_run:
                duration = 0.0
                exit_code: int | None = None
                step_log.write_text(f"dry run: {step.command}\n", encoding="utf-8")
                step_status = "skipped"
                print(f"[dry-run] {step.command}")
            else:
                print(f"\n==> {step.name}: {step.command}")
                exit_code, duration = stream_step(step, repo_root, step_log)
                step_status = "passed" if exit_code == 0 else "failed"

            results.append(
                StepResult(
                    name=step.name,
                    command=step.command,
                    status=step_status,
                    exitCode=exit_code,
                    durationSeconds=duration,
                    logPath=str(step_log),
                    artifacts=artifact_paths,
                )
            )
            bar()

            if step_status == "failed" and not args.keep_going:
                status = "failed"
                break

    if args.dry_run:
        status = "dry-run"
    elif any(step.status == "failed" for step in results):
        status = "failed"

    return RunResult(
        schemaVersion="gwent-long-benchmark-run-v1",
        runId=run_id,
        profile=args.profile,
        dryRun=args.dry_run,
        startedAt=started_at,
        finishedAt=utc_timestamp(),
        status=status,
        repoRoot=str(repo_root),
        outDir=str(out_dir),
        steps=results,
    )


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Run reusable long Gwent benchmark profiles with logs and optional alive-progress output.",
    )
    parser.add_argument(
        "--profile",
        choices=sorted(PROFILES),
        default="v1-current",
        help="Benchmark profile to run.",
    )
    parser.add_argument("--run-id", help="Stable run id. Defaults to UTC timestamp plus profile.")
    parser.add_argument(
        "--out-root",
        default=".local/benchmark-runs",
        help="Ignored output root for run logs and summaries.",
    )
    parser.add_argument("--repo-root", help="Repository root override for tests or unusual shells.")
    parser.add_argument("--dry-run", action="store_true", help="Write a plan without running benchmark commands.")
    parser.add_argument("--keep-going", action="store_true", help="Continue after failed steps.")
    parser.add_argument("--no-progress", action="store_true", help="Disable progress bar output.")
    return parser


def main() -> int:
    args = build_parser().parse_args()
    try:
        result = run_profile(args)
    except FileExistsError as exc:
        print(f"output directory already exists: {exc.filename}", file=sys.stderr)
        return 2

    out_dir = Path(result.outDir)
    write_json(out_dir / "run.json", asdict(result))
    write_markdown(out_dir / "summary.md", result)

    print("\nLong benchmark run complete.")
    print(f"Status: {result.status}")
    print(f"Summary: {out_dir / 'summary.md'}")
    print(f"Run JSON: {out_dir / 'run.json'}")

    return 0 if result.status in {"passed", "dry-run"} else 1


if __name__ == "__main__":
    raise SystemExit(main())
