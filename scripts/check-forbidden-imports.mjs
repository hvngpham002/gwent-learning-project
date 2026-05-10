import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const root = process.cwd();

const scanTargets = [
  "src/components/game/EngineGameManager.tsx",
  "src/components/game/engine",
  "src/components/gwent",
  "src/game",
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
  "@/legacy",
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

const protectedMatches = scanTargets.flatMap(collectFiles).flatMap((file) => {
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

const importPattern =
  /(?:import|export)\s+(?:type\s+)?(?:[\s\S]*?\s+from\s+)?["']([^"']+)["']|import\s*\(\s*["']([^"']+)["']\s*\)|require\s*\(\s*["']([^"']+)["']\s*\)/g;

const legacyImportSpecifiers = (text) =>
  [...text.matchAll(importPattern)]
    .map((match) => match[1] ?? match[2] ?? match[3])
    .filter(Boolean)
    .filter((specifier) => specifier === "@/legacy" || specifier.includes("@/legacy/") || specifier.includes("/legacy/"));

const allowedStoreLegacyImports = new Set([
  "@/legacy/store/slices/gameSlice",
  "@/legacy/store/slices/uiSlice",
]);

const isAllowedLegacyImport = (relativeFile, specifier) => {
  if (relativeFile.startsWith("src/legacy/")) return true;

  if (relativeFile === "src/App.tsx") {
    return specifier === "./legacy/LegacyRoute" || specifier === "@/legacy/LegacyRoute";
  }

  if (relativeFile === "src/store/index.ts") {
    return allowedStoreLegacyImports.has(specifier);
  }

  if (relativeFile.startsWith("tests/baseline/")) return true;
  if (/^tests\/game\/legacy.*\.test\.tsx?$/.test(relativeFile)) return true;
  if (relativeFile === "tests/e2e/engine-shell-smoke.spec.ts") return true;

  return false;
};

const legacyBoundaryMatches = ["src", "tests"].flatMap(collectFiles).flatMap((file) => {
  const relativeFile = path.relative(root, file);
  const text = readFileSync(file, "utf8");
  return legacyImportSpecifiers(text)
    .filter((specifier) => !isAllowedLegacyImport(relativeFile, specifier))
    .map((specifier) => ({ file: relativeFile, specifier }));
});

if (protectedMatches.length > 0) {
  console.error("Forbidden engine UI/adapter imports or legacy identifiers found:");
  for (const match of protectedMatches) {
    console.error(`- ${match.file}:${match.line} matched "${match.pattern}"`);
  }
  process.exit(1);
}

if (legacyBoundaryMatches.length > 0) {
  console.error("Disallowed imports from the quarantined legacy namespace found:");
  for (const match of legacyBoundaryMatches) {
    console.error(`- ${match.file} imports "${match.specifier}"`);
  }
  process.exit(1);
}

console.log("Forbidden import and legacy boundary checks passed.");
