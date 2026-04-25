import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const root = process.cwd();

const scanTargets = [
  "src/components/game/EngineGameManager.tsx",
  "src/components/game/engine",
  "src/game/ai",
  "src/store/selectors/engineSelectors.ts",
  "src/store/slices/engineSlice.ts",
  "src/store/thunks/engineThunks.ts",
];

const forbiddenPatterns = [
  "src/utils/gameHelpers",
  "@/utils/gameHelpers",
  "gameHelpers",
  "calculateTotalScore",
  "calculateRowStrength",
  "useReduxAI",
  "AIStrategyCoordinator",
  "gameSlice",
  "gameThunks",
  "gameSelectors",
  "GameBoard",
];

const sourceExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);

const collectFiles = (target) => {
  const absolute = path.join(root, target);
  if (!existsSync(absolute)) return [];
  const stats = statSync(absolute);
  if (stats.isFile()) return sourceExtensions.has(path.extname(absolute)) ? [absolute] : [];
  if (!stats.isDirectory()) return [];

  return readdirSync(absolute, { withFileTypes: true }).flatMap((entry) => {
    const next = path.join(target, entry.name);
    return collectFiles(next);
  });
};

const matches = scanTargets.flatMap(collectFiles).flatMap((file) => {
  const text = readFileSync(file, "utf8");
  return forbiddenPatterns.flatMap((pattern) => {
    const lines = text.split(/\r?\n/);
    return lines.flatMap((line, index) =>
      line.includes(pattern)
        ? [
            {
              file: path.relative(root, file),
              line: index + 1,
              pattern,
            },
          ]
        : [],
    );
  });
});

if (matches.length > 0) {
  console.error("Forbidden engine UI/adapter imports or legacy identifiers found:");
  for (const match of matches) {
    console.error(`- ${match.file}:${match.line} matched "${match.pattern}"`);
  }
  process.exit(1);
}

console.log("Forbidden import check passed.");
