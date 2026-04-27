import type { CatalogDeckPreset } from "@/game/catalog";

import type { DeckBuilderImportResult } from "./deckBuilderTypes";
import { normalizeDeckPreset, validateDeckPreset } from "./deckBuilderViewModel";

export const DECK_EXPORT_SCHEMA_VERSION = "catalog-deck-preset-v1";

export interface DeckBuilderExportWrapper {
  readonly schemaVersion: typeof DECK_EXPORT_SCHEMA_VERSION;
  readonly preset: CatalogDeckPreset;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isDeckPresetLike = (value: unknown): value is CatalogDeckPreset => {
  if (!isRecord(value)) return false;
  return (
    typeof value.presetId === "string" &&
    typeof value.name === "string" &&
    typeof value.faction === "string" &&
    typeof value.leaderSourceId === "string" &&
    Array.isArray(value.mainDeck) &&
    Array.isArray(value.sideDeck)
  );
};

export const stringifyDeckExport = (preset: CatalogDeckPreset): string =>
  JSON.stringify(
    {
      schemaVersion: DECK_EXPORT_SCHEMA_VERSION,
      preset: normalizeDeckPreset(preset),
    } satisfies DeckBuilderExportWrapper,
    null,
    2,
  );

export const parseDeckImport = (
  text: string,
  existingPresetIds: readonly string[] = [],
): DeckBuilderImportResult => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    return { ok: false, errors: [error instanceof Error ? error.message : "Invalid JSON."] };
  }

  const maybePreset = isRecord(parsed) && "preset" in parsed ? parsed.preset : parsed;
  if (!isDeckPresetLike(maybePreset)) {
    return {
      ok: false,
      errors: ["Import must be a catalog deck preset or catalog-deck-preset-v1 wrapper."],
    };
  }

  const rawStats = validateDeckPreset(maybePreset);
  const rawErrors = rawStats.issues.filter((issue) => issue.severity === "error").map((issue) => issue.message);
  if (rawErrors.length > 0) {
    return { ok: false, errors: rawErrors };
  }

  const preset = normalizeDeckPreset(maybePreset);
  const stats = validateDeckPreset(preset);
  const errors = stats.issues.filter((issue) => issue.severity === "error").map((issue) => issue.message);
  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const existingIds = new Set(existingPresetIds);
  if (!existingIds.has(preset.presetId)) {
    return { ok: true, preset, errors: [] };
  }

  let suffix = 1;
  let nextId = `${preset.presetId}-imported`;
  while (existingIds.has(nextId)) {
    suffix += 1;
    nextId = `${preset.presetId}-imported-${suffix}`;
  }

  return {
    ok: true,
    preset: {
      ...preset,
      presetId: nextId,
      name: `${preset.name} (Imported)`,
    },
    errors: [],
  };
};
