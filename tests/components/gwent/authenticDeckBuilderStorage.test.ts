import { describe, expect, it } from "vitest";

import { currentNorthernRealmsDeckPreset } from "@/data/catalog";
import {
  AUTHENTIC_DECK_SCHEMA_VERSION,
  AUTHENTIC_DECK_STORAGE_KEY,
  readDeckBuilderStore,
  writeDeckBuilderStore,
} from "@/components/gwent/deckBuilderStorage";
import { makeUniqueDeckName, normalizeDeckPreset } from "@/components/gwent/deckBuilderViewModel";
import { parseDeckImport, stringifyDeckExport } from "@/components/gwent/deckBuilderImportExport";
import type { DeckBuilderStorageLike } from "@/components/gwent/deckBuilderStorage";

class MemoryStorage implements DeckBuilderStorageLike {
  readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

describe("authentic deck builder storage", () => {
  it("seeds from current presets when storage is empty", () => {
    const result = readDeckBuilderStore(new MemoryStorage(), [currentNorthernRealmsDeckPreset]);

    expect(result.warning).toBeNull();
    expect(result.store.decks).toHaveLength(1);
    expect(result.store.decks[0]).not.toBe(currentNorthernRealmsDeckPreset);
    expect(result.store.decks[0]).toEqual({
      ...currentNorthernRealmsDeckPreset,
      presetId: "local-current-northern-realms",
    });
  });

  it("falls back safely when storage is corrupt", () => {
    const storage = new MemoryStorage();
    storage.setItem(AUTHENTIC_DECK_STORAGE_KEY, "{nope");

    const result = readDeckBuilderStore(storage, [currentNorthernRealmsDeckPreset]);

    expect(result.warning).toMatch(/could not be read/i);
    expect(result.store.decks[0]?.presetId).toBe("local-current-northern-realms");
  });

  it("round trips saved deck preset data", () => {
    const storage = new MemoryStorage();
    const store = {
      schemaVersion: AUTHENTIC_DECK_SCHEMA_VERSION,
      decks: [{ ...currentNorthernRealmsDeckPreset, name: "Local NR" }],
      activePresetId: currentNorthernRealmsDeckPreset.presetId,
    } as const;

    expect(writeDeckBuilderStore(store, storage)).toEqual({ ok: true, warning: null });
    const loaded = readDeckBuilderStore(storage);

    expect(loaded.warning).toBeNull();
    expect(loaded.store.decks[0]?.name).toBe("Local NR");
    expect(loaded.store.activePresetId).toBe(currentNorthernRealmsDeckPreset.presetId);
  });

  it("normalizes saved duplicate deck names and IDs to one editable instance per name", () => {
    const storage = new MemoryStorage();
    const store = {
      schemaVersion: AUTHENTIC_DECK_SCHEMA_VERSION,
      decks: [
        { ...currentNorthernRealmsDeckPreset, presetId: "local-copy", name: "Current Northern Realms" },
        { ...currentNorthernRealmsDeckPreset, presetId: "local-copy", name: " Current   Northern Realms " },
      ],
      activePresetId: "local-copy",
    } as const;

    expect(writeDeckBuilderStore(store, storage)).toEqual({ ok: true, warning: null });
    const loaded = readDeckBuilderStore(storage);

    expect(loaded.store.decks.map((deck) => deck.presetId)).toEqual(["local-copy", "local-copy-2"]);
    expect(loaded.store.decks.map((deck) => deck.name)).toEqual(["Current Northern Realms", "Current Northern Realms 2"]);
  });

  it("exports JSON that imports back to an equivalent preset", () => {
    const json = stringifyDeckExport(currentNorthernRealmsDeckPreset);
    const parsed = JSON.parse(json);

    expect(parsed.schemaVersion).toBe("catalog-deck-preset-v1");
    expect(parseDeckImport(json)).toEqual({
      ok: true,
      preset: normalizeDeckPreset(currentNorthernRealmsDeckPreset),
      errors: [],
    });
  });

  it("imports raw preset shapes", () => {
    const result = parseDeckImport(JSON.stringify(currentNorthernRealmsDeckPreset));

    expect(result.ok).toBe(true);
    expect(result.preset).toEqual(normalizeDeckPreset(currentNorthernRealmsDeckPreset));
  });

  it("renames duplicate imported preset IDs instead of overwriting", () => {
    const result = parseDeckImport(stringifyDeckExport(currentNorthernRealmsDeckPreset), [
      currentNorthernRealmsDeckPreset.presetId,
    ]);

    expect(result.ok).toBe(true);
    expect(result.preset?.presetId).toBe("current-northern-realms-imported");
    expect(result.preset?.name).toBe("Current Northern Realms");
    expect(result.notices?.join(" ")).toContain("Imported ID changed");
  });

  it("applies the shared name uniqueness rule to imported deck conflicts", () => {
    const result = parseDeckImport(stringifyDeckExport(currentNorthernRealmsDeckPreset));

    expect(result.ok).toBe(true);
    expect(result.preset).toBeDefined();
    expect(result.preset ? makeUniqueDeckName(result.preset.name, [currentNorthernRealmsDeckPreset]) : "").toBe(
      "Current Northern Realms 2",
    );
  });

  it("returns structured import errors for invalid decks", () => {
    const invalid = {
      ...currentNorthernRealmsDeckPreset,
      mainDeck: [{ sourceId: "missing.card", count: 1 }],
    };
    const result = parseDeckImport(JSON.stringify(invalid));

    expect(result.ok).toBe(false);
    expect(result.errors.join(" ")).toMatch(/Unknown card/i);
  });

  it("rejects imported presets with invalid counts before normalization", () => {
    const invalid = {
      ...currentNorthernRealmsDeckPreset,
      mainDeck: currentNorthernRealmsDeckPreset.mainDeck.map((entry, index) =>
        index === 0 ? { ...entry, count: 0 } : entry,
      ),
    };
    const result = parseDeckImport(JSON.stringify(invalid));

    expect(result.ok).toBe(false);
    expect(result.errors.join(" ")).toMatch(/Invalid count/i);
  });
});
