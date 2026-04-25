import { execFileSync } from "node:child_process";

const strict = process.argv.includes("--strict") || process.env.CI === "true" || process.env.GITHUB_ACTIONS === "true";

const runGit = (args) => execFileSync("git", args, { encoding: "utf8" }).trim();

try {
  runGit(["update-index", "-q", "--refresh"]);
  runGit(["diff", "--exit-code", "--"]);
} catch {
  console.error("Tracked files have unstaged changes after checks.");
  console.error("Changed files:");
  const changed = runGit(["diff", "--name-only", "--"]);
  console.error(changed || "(none)");
  process.exit(1);
}

if (strict) {
  const untracked = runGit(["ls-files", "--others", "--exclude-standard"]).split(/\r?\n/).filter(Boolean);
  const unexpected = untracked.filter((file) => !file.startsWith(".claude/"));
  if (unexpected.length > 0) {
    console.error("Unexpected untracked files in strict worktree check:");
    for (const file of unexpected) console.error(`- ${file}`);
    process.exit(1);
  }
}

console.log("Worktree cleanliness check passed.");
