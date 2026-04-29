import { currentCatalogCards, currentCatalogLeaders } from "@/data/catalog";

import {
  CARD_STUDIO_BUNDLE_SCHEMA_VERSION,
  CARD_STUDIO_RECORD_SCHEMA_VERSION,
  type CardStudioBundleExportWrapper,
  type CardStudioImportResult,
  type CardStudioRecordExportWrapper,
  type CardStudioStoreV1,
  type CustomCardRecord,
  type CustomCatalogRecord,
  type CustomLeaderRecord,
} from "./cardStudioTypes";
import { normalizeCardStudioStore } from "./cardStudioStorage";
import {
  makeUniqueCustomName,
  makeUniqueCustomSourceId,
  normalizeCustomSourceId,
  sourceIdFromName,
} from "./cardStudioValidation";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isCustomCardRecordLike = (value: unknown): value is CustomCardRecord =>
  isRecord(value) &&
  isRecord(value.source) &&
  typeof value.recordId === "string" &&
  typeof value.source.name === "string" &&
  typeof value.source.sourceId === "string" &&
  typeof value.source.image === "string";

const isCustomLeaderRecordLike = (value: unknown): value is CustomLeaderRecord =>
  isRecord(value) &&
  isRecord(value.source) &&
  typeof value.recordId === "string" &&
  typeof value.source.name === "string" &&
  typeof value.source.sourceId === "string" &&
  typeof value.source.image === "string" &&
  typeof value.source.ability === "string";

const recordKind = (record: CustomCatalogRecord): "card" | "leader" =>
  "abilities" in record.source ? "card" : "leader";

export const stringifyCardStudioRecordExport = (record: CustomCatalogRecord): string =>
  JSON.stringify(
    {
      schemaVersion: CARD_STUDIO_RECORD_SCHEMA_VERSION,
      record,
    } satisfies CardStudioRecordExportWrapper,
    null,
    2,
  );

export const stringifyCardStudioBundleExport = (store: Pick<CardStudioStoreV1, "cards" | "leaders">): string =>
  JSON.stringify(
    {
      schemaVersion: CARD_STUDIO_BUNDLE_SCHEMA_VERSION,
      cards: store.cards,
      leaders: store.leaders,
    } satisfies CardStudioBundleExportWrapper,
    null,
    2,
  );

const collectImportRecords = (parsed: unknown): { cards: CustomCardRecord[]; leaders: CustomLeaderRecord[]; errors: string[] } => {
  if (!isRecord(parsed) || typeof parsed.schemaVersion !== "string") {
    return { cards: [], leaders: [], errors: ["Import must declare a custom catalog schemaVersion."] };
  }
  if (parsed.schemaVersion === CARD_STUDIO_RECORD_SCHEMA_VERSION) {
    const record = parsed.record;
    if (isCustomCardRecordLike(record)) {
      return { cards: [record], leaders: [], errors: [] };
    }
    if (isCustomLeaderRecordLike(record)) {
      return { cards: [], leaders: [record], errors: [] };
    }
    return { cards: [], leaders: [], errors: ["custom-catalog-record-v1 record cannot be edited safely."] };
  }
  if (parsed.schemaVersion === CARD_STUDIO_BUNDLE_SCHEMA_VERSION) {
    if (!Array.isArray(parsed.cards) || !Array.isArray(parsed.leaders)) {
      return { cards: [], leaders: [], errors: ["custom-catalog-bundle-v1 requires cards and leaders arrays."] };
    }
    const cards = parsed.cards.filter(isCustomCardRecordLike);
    const leaders = parsed.leaders.filter(isCustomLeaderRecordLike);
    const skipped = parsed.cards.length + parsed.leaders.length - cards.length - leaders.length;
    return {
      cards,
      leaders,
      errors: skipped > 0 ? [`${skipped} imported record${skipped === 1 ? "" : "s"} could not be edited safely.`] : [],
    };
  }
  return { cards: [], leaders: [], errors: [`Unsupported custom catalog schema: ${parsed.schemaVersion}`] };
};

const usedSourceIdsForImport = (store: CardStudioStoreV1): Set<string> =>
  new Set([
    ...currentCatalogCards.map((card) => card.sourceId),
    ...currentCatalogLeaders.map((leader) => leader.sourceId),
    ...store.cards.map((record) => record.source.sourceId),
    ...store.leaders.map((record) => record.source.sourceId),
  ]);

const usedNamesForImport = (store: CardStudioStoreV1): Set<string> =>
  new Set([
    ...currentCatalogCards.map((card) => card.name.toLowerCase()),
    ...currentCatalogLeaders.map((leader) => leader.name.toLowerCase()),
    ...store.cards.map((record) => record.source.name.toLowerCase()),
    ...store.leaders.map((record) => record.source.name.toLowerCase()),
  ]);

export const parseCardStudioImport = (
  text: string,
  existingStore: CardStudioStoreV1,
): CardStudioImportResult => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    return {
      ok: false,
      cards: [],
      leaders: [],
      errors: [error instanceof Error ? error.message : "Invalid JSON."],
      notices: [],
    };
  }

  const collected = collectImportRecords(parsed);
  if (collected.errors.length > 0 && collected.cards.length + collected.leaders.length === 0) {
    return { ok: false, cards: [], leaders: [], errors: collected.errors, notices: [] };
  }

  const usedSourceIds = usedSourceIdsForImport(existingStore);
  const usedNames = usedNamesForImport(existingStore);
  const sourceRenameMap = new Map<string, string>();
  const notices: string[] = [...collected.errors];
  const now = new Date().toISOString();

  const cards = collected.cards.map((record, index) => {
    const oldSourceId = record.source.sourceId;
    const preferred = normalizeCustomSourceId(oldSourceId || sourceIdFromName(record.source.name, "card"), "card");
    const nextSourceId = makeUniqueCustomSourceId(preferred, usedSourceIds, "card");
    usedSourceIds.add(nextSourceId);
    if (nextSourceId !== oldSourceId) {
      sourceRenameMap.set(oldSourceId, nextSourceId);
      notices.push(`${oldSourceId || record.source.name} imported as ${nextSourceId}.`);
    }
    const name = makeUniqueCustomName(record.source.name, usedNames);
    usedNames.add(name.toLowerCase());
    return {
      ...record,
      recordId: `imported-card-${Date.now().toString(36)}-${index}`,
      createdAt: record.createdAt || now,
      updatedAt: now,
      source: {
        ...record.source,
        sourceId: nextSourceId,
        name,
      },
    };
  });

  const leaders = collected.leaders.map((record, index) => {
    const oldSourceId = record.source.sourceId;
    const preferred = normalizeCustomSourceId(oldSourceId || sourceIdFromName(record.source.name, "leader"), "leader");
    const nextSourceId = makeUniqueCustomSourceId(preferred, usedSourceIds, "leader");
    usedSourceIds.add(nextSourceId);
    if (nextSourceId !== oldSourceId) {
      sourceRenameMap.set(oldSourceId, nextSourceId);
      notices.push(`${oldSourceId || record.source.name} imported as ${nextSourceId}.`);
    }
    const name = makeUniqueCustomName(record.source.name, usedNames);
    usedNames.add(name.toLowerCase());
    return {
      ...record,
      recordId: `imported-leader-${Date.now().toString(36)}-${index}`,
      createdAt: record.createdAt || now,
      updatedAt: now,
      source: {
        ...record.source,
        sourceId: nextSourceId,
        name,
      },
    };
  });

  const renamedLinkedCards = cards.map((record) => ({
    ...record,
    source: {
      ...record.source,
      linkedSourceIds: record.source.linkedSourceIds?.map((sourceId) => sourceRenameMap.get(sourceId) ?? sourceId),
    },
  }));

  const normalized = normalizeCardStudioStore({
    cards: renamedLinkedCards,
    leaders,
    activeRecordId: renamedLinkedCards[0]?.recordId ?? leaders[0]?.recordId,
  });

  return {
    ok: true,
    cards: normalized.cards,
    leaders: normalized.leaders,
    errors: [],
    notices,
  };
};

export const appendImportedCustomRecords = (
  store: CardStudioStoreV1,
  result: Pick<CardStudioImportResult, "cards" | "leaders">,
): CardStudioStoreV1 =>
  normalizeCardStudioStore({
    cards: [...store.cards, ...result.cards],
    leaders: [...store.leaders, ...result.leaders],
    activeRecordId: result.cards[0]?.recordId ?? result.leaders[0]?.recordId ?? store.activeRecordId,
  });

export const customRecordFileName = (record: CustomCatalogRecord): string => {
  const suffix = recordKind(record);
  return `${record.source.sourceId || "custom"}-${suffix}.json`;
};
