import { describe, expect, it } from "vitest";

import {
  parseOfficialPortingReviewImport,
  stringifyOfficialPortingReviewBundle,
} from "@/components/gwent/officialPortingImportExport";
import {
  clampOfficialCrop,
  createEmptyOfficialPortingStore,
  readOfficialPortingStore,
  writeOfficialPortingStore,
} from "@/components/gwent/officialPortingStorage";
import type { OfficialPortingStorageLike } from "@/components/gwent/officialPortingTypes";
import {
  buildOfficialPortingRecords,
  defaultOfficialPortingFilters,
  filterOfficialPortingRecords,
  officialPortingCounts,
  setOfficialApproved,
  setOfficialNote,
  upsertOfficialDataOverride,
  upsertOfficialImageOverride,
} from "@/components/gwent/officialPortingViewModel";
import { game8OfficialImageCandidates } from "@/data/catalog/official";

class MemoryStorage implements OfficialPortingStorageLike {
  readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

describe("official porting view-model helpers", () => {
  it("normalizes official porting storage and falls back from corrupt JSON", () => {
    const storage = new MemoryStorage();
    const store = setOfficialApproved(createEmptyOfficialPortingStore(), "neutral.decoy", true);

    expect(writeOfficialPortingStore(store, storage)).toEqual({ ok: true, warning: null });
    expect(readOfficialPortingStore(storage).store.approvedSourceIds).toContain("neutral.decoy");

    storage.setItem("gwent_official_porting_v1", "{nope");
    const fallback = readOfficialPortingStore(storage);
    expect(fallback.warning).toMatch(/could not be read/i);
    expect(fallback.store.approvedSourceIds).toEqual([]);
  });

  it("builds candidate rows with filters, notes, approval, and overrides", () => {
    const image = game8OfficialImageCandidates.find((candidate) => candidate.sourceId === "neutral.decoy");
    expect(image).toBeDefined();
    let store = createEmptyOfficialPortingStore();
    store = upsertOfficialDataOverride(store, "neutral.decoy", { name: "Decoy Reviewed" });
    store = setOfficialNote(store, "neutral.decoy", "crop checked");
    store = setOfficialApproved(store, "neutral.decoy", true);
    store = upsertOfficialImageOverride(store, "neutral.decoy", {
      ...image!,
      approved: true,
      crop: { fit: "cover", scale: 1.25, offsetX: 4, offsetY: -3, cropBottomPx: 12 },
    });

    const records = buildOfficialPortingRecords(store);
    const decoy = records.find((record) => record.originalSourceId === "neutral.decoy");
    expect(decoy).toEqual(
      expect.objectContaining({
        name: "Decoy Reviewed",
        approved: true,
        note: "crop checked",
      }),
    );
    expect(decoy?.image.crop.fit).toBe("cover");

    const filtered = filterOfficialPortingRecords(records, {
      ...defaultOfficialPortingFilters(),
      search: "decoy reviewed",
      approvedOnly: true,
    });
    expect(filtered.map((record) => record.originalSourceId)).toContain("neutral.decoy");
    expect(officialPortingCounts(store).approved).toBe(1);
  });

  it("clamps crop values to bounded review ranges", () => {
    expect(
      clampOfficialCrop({
        fit: "cover",
        scale: 99,
        offsetX: -999,
        offsetY: 999,
        cropBottomPx: 999,
      }),
    ).toEqual({
      fit: "cover",
      scale: 2,
      offsetX: -100,
      offsetY: 100,
      cropBottomPx: 80,
    });
  });

  it("exports and imports a hidden-info-free review bundle", () => {
    let store = createEmptyOfficialPortingStore();
    store = setOfficialApproved(store, "neutral.decoy", true);
    store = setOfficialNote(store, "neutral.decoy", "ready after local art");

    const text = stringifyOfficialPortingReviewBundle(store);
    expect(text).toContain('"schemaVersion": "official-porting-v1"');
    expect(text).toContain('"totalInstances": 254');
    expect(text).not.toMatch(/instanceId|seat_b:\d{3}:|seat_a:\d{3}:/);

    const parsed = parseOfficialPortingReviewImport(text);
    expect(parsed.ok).toBe(true);
    expect(parsed.store?.approvedSourceIds).toContain("neutral.decoy");
    expect(parsed.store?.notesBySourceId["neutral.decoy"]).toBe("ready after local art");
    expect(parseOfficialPortingReviewImport("{").errors[0]).toMatch(/JSON|Expected/i);
  });
});
