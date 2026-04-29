import {
  CATALOG_ABILITY_METADATA,
  CATALOG_CARD_KINDS,
  CATALOG_FACTIONS,
  CATALOG_LEADER_ABILITY_METADATA,
  CATALOG_ROWS,
  type CatalogAbilityId,
  type CatalogCardKind,
  type CatalogFaction,
  type CatalogLeaderAbilityId,
  type CatalogRow,
  isCatalogAbilityId,
  isCatalogLeaderAbilityId,
} from "@/game/catalog";

import type {
  CardStudioIssue,
  CardStudioValidationContext,
  CardStudioValidationResult,
  CustomCardRecord,
  CustomLeaderRecord,
} from "./cardStudioTypes";

export const CUSTOM_SOURCE_ID_PATTERN = /^custom(_leader)?_[a-z0-9_]+$/;
const DATA_URL_IMAGE_PATTERN = /^data:image\/(png|jpeg|webp);base64,[a-z0-9+/=]+$/i;

const isCatalogFaction = (value: string): value is CatalogFaction =>
  CATALOG_FACTIONS.includes(value as CatalogFaction);

const isCatalogCardKind = (value: string): value is CatalogCardKind =>
  CATALOG_CARD_KINDS.includes(value as CatalogCardKind);

const isCatalogRow = (value: string): value is CatalogRow =>
  CATALOG_ROWS.includes(value as CatalogRow);

const pushIssue = (
  issues: CardStudioIssue[],
  severity: CardStudioIssue["severity"],
  code: string,
  field: string | undefined,
  message: string,
) => {
  issues.push({ severity, code, field, message });
};

export const isCustomSourceId = (value: string): boolean => CUSTOM_SOURCE_ID_PATTERN.test(value);

export const slugifyCustomSourceName = (name: string): string => {
  const slug = name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_");
  return slug || "untitled";
};

export const normalizeCustomSourceId = (value: string, kind: "card" | "leader"): string => {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_");
  const prefix = kind === "leader" ? "custom_leader_" : "custom_";
  const withoutPrefix =
    kind === "leader"
      ? normalized.replace(/^custom_leader_/, "").replace(/^custom_/, "")
      : normalized.replace(/^custom_/, "");
  return `${prefix}${withoutPrefix || "untitled"}`;
};

export const sourceIdFromName = (name: string, kind: "card" | "leader"): string =>
  normalizeCustomSourceId(slugifyCustomSourceName(name), kind);

export const makeUniqueCustomSourceId = (
  preferredSourceId: string,
  usedSourceIds: ReadonlySet<string>,
  kind: "card" | "leader",
): string => {
  const base = normalizeCustomSourceId(preferredSourceId, kind);
  let candidate = base;
  let suffix = 2;
  while (usedSourceIds.has(candidate)) {
    candidate = `${base}_${suffix}`;
    suffix += 1;
  }
  return candidate;
};

export const makeUniqueCustomName = (
  preferredName: string,
  usedNames: ReadonlySet<string>,
): string => {
  const base = preferredName.trim().replace(/\s+/g, " ") || "Untitled";
  let candidate = base;
  let suffix = 2;
  while (usedNames.has(candidate.toLowerCase())) {
    candidate = `${base} ${suffix}`;
    suffix += 1;
  }
  return candidate;
};

export const isValidCardStudioImage = (image: string): boolean =>
  image.startsWith("/images/") || DATA_URL_IMAGE_PATTERN.test(image);

const sourceIdsInContext = (
  context: CardStudioValidationContext,
  recordId?: string,
): Set<string> => {
  const ids = new Set<string>();
  context.currentCards.forEach((card) => ids.add(card.sourceId));
  context.currentLeaders.forEach((leader) => ids.add(leader.sourceId));
  context.customCards
    .filter((record) => record.recordId !== recordId)
    .forEach((record) => ids.add(record.source.sourceId));
  context.customLeaders
    .filter((record) => record.recordId !== recordId)
    .forEach((record) => ids.add(record.source.sourceId));
  return ids;
};

const allCardSourceIdsInContext = (context: CardStudioValidationContext): Set<string> => {
  const ids = new Set<string>();
  context.currentCards.forEach((card) => ids.add(card.sourceId));
  context.customCards.forEach((record) => ids.add(record.source.sourceId));
  return ids;
};

const finish = (issues: readonly CardStudioIssue[], draft: boolean): CardStudioValidationResult => {
  const structurallyValid = !issues.some((issue) => issue.severity === "error");
  const implemented = !issues.some((issue) => issue.code === "ability_not_implemented" || issue.code === "leader_ability_not_implemented");
  return {
    issues,
    structurallyValid,
    playable: structurallyValid && implemented && !draft,
  };
};

export const validateCustomCardRecord = (
  record: CustomCardRecord,
  context: CardStudioValidationContext,
): CardStudioValidationResult => {
  const source = record.source;
  const issues: CardStudioIssue[] = [];
  const knownSourceIds = sourceIdsInContext(context, record.recordId);
  const knownCardIds = allCardSourceIdsInContext(context);

  if (source.name.trim().length === 0) {
    pushIssue(issues, "error", "empty_name", "name", "Name is required.");
  }

  if (source.sourceId.trim().length === 0) {
    pushIssue(issues, "error", "empty_source_id", "sourceId", "Source ID is required.");
  } else {
    if (!isCustomSourceId(source.sourceId) || source.sourceId.startsWith("custom_leader_")) {
      pushIssue(
        issues,
        "error",
        "invalid_source_id",
        "sourceId",
        "Card source ID must match custom_[a-z0-9_]+.",
      );
    }
    if (knownSourceIds.has(source.sourceId)) {
      pushIssue(issues, "error", "duplicate_source_id", "sourceId", "Source ID already exists.");
    }
  }

  if (!isCatalogFaction(source.faction)) {
    pushIssue(issues, "error", "invalid_faction", "faction", "Faction is not known.");
  }

  if (!isCatalogCardKind(source.kind)) {
    pushIssue(issues, "error", "invalid_kind", "kind", "Card kind is not known.");
  }

  if (!Number.isInteger(source.strength) || source.strength < 0) {
    pushIssue(issues, "error", "invalid_strength", "strength", "Strength must be a non-negative integer.");
  }
  if (source.kind === "special" && source.strength !== 0) {
    pushIssue(issues, "error", "special_strength", "strength", "Special cards must have strength 0.");
  }

  const rowSet = new Set(source.rows);
  if (rowSet.size !== source.rows.length) {
    pushIssue(issues, "error", "duplicate_rows", "rows", "Rows must not contain duplicates.");
  }
  source.rows.forEach((row) => {
    if (!isCatalogRow(row)) {
      pushIssue(issues, "error", "invalid_row", "rows", "Rows may contain only close, ranged, or siege.");
    }
  });
  if ((source.kind === "unit" || source.kind === "hero") && source.rows.length < 1) {
    pushIssue(issues, "error", "missing_rows", "rows", "Unit and hero cards need at least one row.");
  }
  if (source.kind === "special" && source.rows.length > 0) {
    pushIssue(issues, "error", "special_rows", "rows", "Special cards must not declare rows.");
  }
  if ((source.kind === "unit" || source.kind === "hero") && source.rows.length > 1 && !source.abilities.includes("agile")) {
    pushIssue(issues, "error", "multi_row_requires_agile", "rows", "Multi-row cards must include Agile.");
  }

  if (source.abilities.length === 0) {
    pushIssue(issues, "error", "missing_ability", "abilities", "Choose at least one ability, or None.");
  }
  if (source.abilities.includes("none") && source.abilities.length > 1) {
    pushIssue(issues, "error", "none_mixed", "abilities", "None cannot be mixed with another ability.");
  }
  const abilitySet = new Set(source.abilities);
  if (abilitySet.size !== source.abilities.length) {
    pushIssue(issues, "error", "duplicate_abilities", "abilities", "Abilities must not contain duplicates.");
  }
  source.abilities.forEach((abilityId) => {
    if (!isCatalogAbilityId(abilityId)) {
      pushIssue(issues, "error", "unknown_ability", "abilities", `Unknown ability: ${abilityId}`);
      return;
    }
    const metadata = CATALOG_ABILITY_METADATA[abilityId as CatalogAbilityId];
    if (!metadata.appliesTo.includes(source.kind)) {
      pushIssue(
        issues,
        "error",
        "ability_kind_mismatch",
        "abilities",
        `${metadata.name} does not apply to ${source.kind} cards.`,
      );
    }
    if (abilityId !== "none" && metadata.status !== "implemented") {
      pushIssue(
        issues,
        "warning",
        "ability_not_implemented",
        "abilities",
        `${metadata.name} is ${metadata.status}; this record can be saved only as a draft.`,
      );
    }
  });

  if (!Number.isInteger(source.deckLimit) || source.deckLimit < 1) {
    pushIssue(issues, "error", "invalid_deck_limit", "deckLimit", "Deck limit must be an integer of at least 1.");
  }
  if (source.kind === "hero" && source.deckLimit > 1) {
    pushIssue(issues, "error", "hero_deck_limit", "deckLimit", "Heroes must use deck limit 1.");
  }

  if (!isValidCardStudioImage(source.image)) {
    pushIssue(
      issues,
      "error",
      "invalid_image",
      "image",
      "Image must be a /images/... path or a supported PNG, JPEG, or WebP data URL.",
    );
  }

  (source.linkedSourceIds ?? []).forEach((sourceId) => {
    if (!knownCardIds.has(sourceId)) {
      pushIssue(
        issues,
        "warning",
        "unresolved_linked_source",
        "linkedSourceIds",
        `Linked source is unresolved: ${sourceId}`,
      );
    }
  });

  return finish(issues, record.draft);
};

export const validateCustomLeaderRecord = (
  record: CustomLeaderRecord,
  context: CardStudioValidationContext,
): CardStudioValidationResult => {
  const source = record.source;
  const issues: CardStudioIssue[] = [];
  const knownSourceIds = sourceIdsInContext(context, record.recordId);

  if (source.name.trim().length === 0) {
    pushIssue(issues, "error", "empty_name", "name", "Name is required.");
  }
  if (source.sourceId.trim().length === 0) {
    pushIssue(issues, "error", "empty_source_id", "sourceId", "Source ID is required.");
  } else {
    if (!isCustomSourceId(source.sourceId) || !source.sourceId.startsWith("custom_leader_")) {
      pushIssue(
        issues,
        "error",
        "invalid_source_id",
        "sourceId",
        "Leader source ID must match custom_leader_[a-z0-9_]+.",
      );
    }
    if (knownSourceIds.has(source.sourceId)) {
      pushIssue(issues, "error", "duplicate_source_id", "sourceId", "Source ID already exists.");
    }
  }
  const faction = source.faction as string;
  if (!isCatalogFaction(faction) || faction === "neutral") {
    pushIssue(issues, "error", "invalid_faction", "faction", "Leader faction must be non-neutral.");
  }
  if (!isCatalogLeaderAbilityId(source.ability)) {
    pushIssue(issues, "error", "unknown_leader_ability", "ability", `Unknown leader ability: ${source.ability}`);
  } else {
    const metadata = CATALOG_LEADER_ABILITY_METADATA[source.ability as CatalogLeaderAbilityId];
    if (metadata.status !== "implemented") {
      pushIssue(
        issues,
        "warning",
        "leader_ability_not_implemented",
        "ability",
        `${metadata.name} is ${metadata.status}; this record can be saved only as a draft.`,
      );
    }
  }
  if (!isValidCardStudioImage(source.image)) {
    pushIssue(
      issues,
      "error",
      "invalid_image",
      "image",
      "Image must be a /images/... path or a supported PNG, JPEG, or WebP data URL.",
    );
  }

  return finish(issues, record.draft);
};
