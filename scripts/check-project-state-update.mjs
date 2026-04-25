import { execFileSync } from "node:child_process";

const args = process.argv.slice(2);
const baseArgIndex = args.indexOf("--base");
const explicitBase = baseArgIndex >= 0 ? args[baseArgIndex + 1] : null;

const envBase =
  process.env.GITHUB_BASE_SHA ||
  process.env.GITHUB_EVENT_PULL_REQUEST_BASE_SHA ||
  (process.env.GITHUB_BASE_REF ? `origin/${process.env.GITHUB_BASE_REF}` : null);
const base = explicitBase || envBase || "HEAD~1";

const runGit = (gitArgs) => execFileSync("git", gitArgs, { encoding: "utf8" }).trim();

let changedFiles = [];
try {
  changedFiles = runGit(["diff", "--name-only", `${base}...HEAD`]).split(/\r?\n/).filter(Boolean);
} catch {
  try {
    changedFiles = runGit(["diff", "--name-only", base, "HEAD"]).split(/\r?\n/).filter(Boolean);
  } catch (error) {
    console.error(`Unable to determine changed files against ${base}.`);
    console.error(error.message);
    process.exit(1);
  }
}

if (!process.env.CI && !process.env.GITHUB_ACTIONS) {
  const unstaged = runGit(["diff", "--name-only"]).split(/\r?\n/).filter(Boolean);
  const staged = runGit(["diff", "--cached", "--name-only"]).split(/\r?\n/).filter(Boolean);
  const untracked = runGit(["ls-files", "--others", "--exclude-standard"]).split(/\r?\n/).filter(Boolean);
  changedFiles = [...new Set([...changedFiles, ...unstaged, ...staged, ...untracked])];
}

const relevant = (file) =>
  file.startsWith("src/") ||
  file.startsWith("tests/") ||
  file.startsWith("docs/spec/") ||
  file.startsWith("audit/reports/") ||
  file.startsWith("docs/overhaul-plan/") ||
  file.startsWith(".github/") ||
  file === "package.json" ||
  file === "package-lock.json" ||
  file === "AGENTS.md" ||
  file === "README.md";

const relevantFiles = changedFiles.filter(relevant);
const projectStateChanged = changedFiles.includes("docs/PROJECT_STATE.md");

if (relevantFiles.length > 0 && !projectStateChanged) {
  console.error("docs/PROJECT_STATE.md must be updated when relevant project files change.");
  console.error(`Base: ${base}`);
  console.error("Relevant changed files:");
  for (const file of relevantFiles) console.error(`- ${file}`);
  process.exit(1);
}

console.log(
  relevantFiles.length > 0
    ? "Project state update check passed."
    : "Project state update check passed: no relevant files changed.",
);
