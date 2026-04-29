import { describe, expect, it } from "vitest";

import {
  currentCatalogCards,
  currentCatalogLeaders,
} from "@/data/catalog";
import {
  readCardStudioStore,
  writeCardStudioStore,
} from "@/components/gwent/cardStudioStorage";
import {
  appendImportedCustomRecords,
  parseCardStudioImport,
  stringifyCardStudioBundleExport,
  stringifyCardStudioRecordExport,
} from "@/components/gwent/cardStudioImportExport";
import {
  buildCardStudioBlockedSources,
  buildCustomCatalogSourceSets,
  buildCardStudioValidationContext,
  createEmptyCustomCatalogStore,
} from "@/components/gwent/cardStudioViewModel";
import {
  makeUniqueCustomSourceId,
  sourceIdFromName,
  validateCustomCardRecord,
  validateCustomLeaderRecord,
} from "@/components/gwent/cardStudioValidation";
import type { CardStudioStoreV1, CustomCardRecord, CustomLeaderRecord } from "@/components/gwent/cardStudioTypes";
import type { CardStudioStorageLike } from "@/components/gwent/cardStudioTypes";

class MemoryStorage implements CardStudioStorageLike {
  readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

const emptyStore = (): CardStudioStoreV1 => createEmptyCustomCatalogStore();

const playableCard = (overrides: Partial<CustomCardRecord["source"]> = {}, draft = false): CustomCardRecord => ({
  recordId: "card-1",
  createdAt: "2026-04-28T00:00:00.000Z",
  updatedAt: "2026-04-28T00:00:00.000Z",
  imageMode: "path",
  draft,
  source: {
    sourceId: "custom_test_unit",
    name: "Test Unit",
    faction: "northern_realms",
    kind: "unit",
    strength: 4,
    rows: ["close"],
    abilities: ["none"],
    tags: [],
    deckLimit: 3,
    image: "/images/custom/test-unit.png",
    ...overrides,
  },
});

const playableLeader = (overrides: Partial<CustomLeaderRecord["source"]> = {}, draft = false): CustomLeaderRecord => ({
  recordId: "leader-1",
  createdAt: "2026-04-28T00:00:00.000Z",
  updatedAt: "2026-04-28T00:00:00.000Z",
  imageMode: "path",
  draft,
  source: {
    sourceId: "custom_leader_test",
    name: "Test Leader",
    faction: "northern_realms",
    ability: "clear_weather",
    image: "/images/custom/test-leader.png",
    ...overrides,
  },
});

const context = (store: CardStudioStoreV1, recordId?: string) => ({
  currentCards: currentCatalogCards,
  currentLeaders: currentCatalogLeaders,
  customCards: store.cards,
  customLeaders: store.leaders,
  recordId,
});

describe("Card Studio helpers", () => {
  it("generates normalized custom source IDs and collision suffixes", () => {
    expect(sourceIdFromName("Blue Stripes, Prototype!", "card")).toBe("custom_blue_stripes_prototype");
    expect(sourceIdFromName("Foltest Prototype", "leader")).toBe("custom_leader_foltest_prototype");
    expect(makeUniqueCustomSourceId("custom_test", new Set(["custom_test", "custom_test_2"]), "card")).toBe("custom_test_3");
  });

  it("validates a playable unit with path and data URL image support", () => {
    const store = { ...emptyStore(), cards: [playableCard()], leaders: [] };
    expect(validateCustomCardRecord(playableCard(), context(store, "card-1")).playable).toBe(true);
    expect(
      validateCustomCardRecord(
        playableCard({ sourceId: "custom_data_url", image: "data:image/png;base64,AAAA" }),
        context(emptyStore()),
      ).issues,
    ).toEqual([]);
  });

  it("blocks structural card errors and unimplemented abilities from playability", () => {
    const store = emptyStore();

    expect(validateCustomCardRecord(playableCard({ kind: "special", strength: 3, rows: ["close"] }), context(store)).issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining(["special_strength", "special_rows"]),
    );
    expect(validateCustomCardRecord(playableCard({ rows: ["close", "ranged"], abilities: ["none"] }), context(store)).issues.map((issue) => issue.code)).toContain(
      "multi_row_requires_agile",
    );
    expect(validateCustomCardRecord(playableCard({ abilities: ["none", "medic"] }), context(store)).issues.map((issue) => issue.code)).toContain("none_mixed");
    const draft = playableCard({ abilities: ["muster_roach"] }, true);
    const result = validateCustomCardRecord(draft, context({ ...store, cards: [draft] }, draft.recordId));
    expect(result.structurallyValid).toBe(true);
    expect(result.playable).toBe(false);
    expect(result.issues).toEqual(expect.arrayContaining([expect.objectContaining({ code: "ability_not_implemented" })]));
  });

  it("validates custom leaders and blocks neutral or placeholder leaders from playability", () => {
    const store = emptyStore();
    expect(validateCustomLeaderRecord(playableLeader(), context(store)).playable).toBe(true);
    expect(validateCustomLeaderRecord(playableLeader({ faction: "neutral" as "northern_realms" }), context(store)).issues.map((issue) => issue.code)).toContain(
      "invalid_faction",
    );
    const placeholder = playableLeader({ ability: "play_fog" }, true);
    const result = validateCustomLeaderRecord(placeholder, context({ ...store, leaders: [placeholder] }, placeholder.recordId));
    expect(result.structurallyValid).toBe(true);
    expect(result.playable).toBe(false);
    expect(result.issues).toEqual(expect.arrayContaining([expect.objectContaining({ code: "leader_ability_not_implemented" })]));
  });

  it("round-trips storage and falls back from corrupt localStorage", () => {
    const storage = new MemoryStorage();
    const store = { ...emptyStore(), cards: [playableCard()], activeRecordId: "card-1" };
    expect(writeCardStudioStore(store, storage)).toEqual({ ok: true, warning: null });
    expect(readCardStudioStore(storage).store.cards[0]?.source.sourceId).toBe("custom_test_unit");

    storage.setItem("gwent_custom_catalog_v1", "{nope");
    const fallback = readCardStudioStore(storage);
    expect(fallback.warning).toMatch(/could not be read/i);
    expect(fallback.store.cards).toEqual([]);
  });

  it("exports and imports selected records and bundles with collision notices and linked ID rewrites", () => {
    const existing = { ...emptyStore(), cards: [playableCard()], leaders: [] };
    const importedLinked = playableCard({
      sourceId: "custom_test_unit",
      name: "Test Unit",
      linkedSourceIds: ["custom_test_unit"],
    });
    const result = parseCardStudioImport(stringifyCardStudioRecordExport(importedLinked), existing);

    expect(result.ok).toBe(true);
    expect(result.cards[0]?.source.sourceId).toBe("custom_test_unit_2");
    expect(result.cards[0]?.source.linkedSourceIds).toEqual(["custom_test_unit_2"]);
    expect(result.notices.join(" ")).toContain("imported as custom_test_unit_2");

    const appended = appendImportedCustomRecords(existing, result);
    const bundle = parseCardStudioImport(stringifyCardStudioBundleExport(appended), emptyStore());
    expect(bundle.ok).toBe(true);
    expect(bundle.cards.length).toBeGreaterThanOrEqual(2);
    expect(parseCardStudioImport("{", emptyStore()).errors[0]).toMatch(/JSON|Expected/i);
  });

  it("builds playable source sets and draft blocked-source diagnostics", () => {
    const draft = playableCard({ sourceId: "custom_draft", abilities: ["muster_roach"] }, true);
    const playable = playableCard({ sourceId: "custom_playable" }, false);
    const store = { ...emptyStore(), cards: [draft, playable], leaders: [] };

    expect(buildCustomCatalogSourceSets(store).cards.map((card) => card.sourceId)).toContain("custom_playable");
    expect(buildCustomCatalogSourceSets(store).cards.map((card) => card.sourceId)).not.toContain("custom_draft");
    expect(buildCardStudioBlockedSources(store).cards.get("custom_draft")?.reason).toMatch(/draft/i);
    expect(buildCardStudioValidationContext(store, "card-1").customCards).toHaveLength(2);
  });
});
