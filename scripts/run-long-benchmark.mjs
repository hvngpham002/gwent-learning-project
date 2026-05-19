#!/usr/bin/env node
import { spawn, spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const pythonScript = resolve(scriptDir, "run-long-benchmark.py");
const forwardedArgs = process.argv.slice(2);

function commandExists(command, args = []) {
  const result = spawnSync(command, [...args, "--version"], {
    encoding: "utf8",
    stdio: "ignore",
  });
  return result.status === 0;
}

function resolvePython() {
  if (process.env.PYTHON) {
    return { command: process.env.PYTHON, args: [] };
  }

  const candidates =
    process.platform === "win32"
      ? [
          { command: "py", args: ["-3"] },
          { command: "python", args: [] },
          { command: "python3", args: [] },
        ]
      : [
          { command: "python3", args: [] },
          { command: "python", args: [] },
        ];

  for (const candidate of candidates) {
    if (commandExists(candidate.command, candidate.args)) {
      return candidate;
    }
  }

  return null;
}

const python = resolvePython();

if (!python) {
  console.error(
    "No Python 3 executable found. Install Python 3 or set PYTHON=/path/to/python.",
  );
  process.exit(1);
}

const child = spawn(
  python.command,
  [...python.args, pythonScript, ...forwardedArgs],
  {
    stdio: "inherit",
    shell: false,
  },
);

child.on("exit", (code, signal) => {
  if (signal) {
    console.error(`benchmark runner terminated by signal ${signal}`);
    process.exit(1);
  }
  process.exit(code ?? 1);
});
