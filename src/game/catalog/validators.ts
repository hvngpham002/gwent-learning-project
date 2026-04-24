import {
  CATALOG_CARD_KINDS,
  CATALOG_FACTIONS,
  CATALOG_IMAGE_PATH_PREFIX,
  CATALOG_ROWS,
} from "./constants";
import { isCatalogAbilityId, isCatalogLeaderAbilityId } from "./abilities";
import {
  CatalogCardKind,
  CatalogCardSource,
  CatalogDeckPreset,
  CatalogFaction,
  CatalogLeaderSource,
  CatalogRow,
  CatalogValidationError,
  CatalogValidationResult,
} from "./types";

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isCatalogFaction = (value: unknown): value is CatalogFaction =>
  typeof value === "string" && CATALOG_FACTIONS.includes(value as CatalogFaction);

const isCatalogCardKind = (value: unknown): value is CatalogCardKind =>
  typeof value === "string" && CATALOG_CARD_KINDS.includes(value as CatalogCardKind);

const isCatalogRow = (value: unknown): value is CatalogRow =>
  typeof value === "string" && CATALOG_ROWS.includes(value as CatalogRow);

const result = (errors: CatalogValidationError[]): CatalogValidationResult => ({
  valid: errors.length === 0,
  errors,
});

const push = (
  errors: CatalogValidationError[],
  path: string,
  code: CatalogValidationError["code"],
  message: string,
) => {
  errors.push({ path, code, message });
};

const validateRequiredString = (
  errors: CatalogValidationError[],
  value: unknown,
  path: string,
  fieldLabel: string,
) => {
  if (!isNonEmptyString(value)) {
    push(errors, path, "missing_required_field", `${fieldLabel} is required.`);
  }
};

const validateImage = (errors: CatalogValidationError[], value: unknown, path: string) => {
  if (!isNonEmptyString(value) || !value.startsWith(CATALOG_IMAGE_PATH_PREFIX)) {
    push(
      errors,
      path,
      "invalid_image",
      `Image must be a non-empty path beginning with ${CATALOG_IMAGE_PATH_PREFIX}.`,
    );
  }
};

const validateDeckLimit = (errors: CatalogValidationError[], value: unknown, path: string) => {
  if (!Number.isInteger(value) || (value as number) < 1) {
    push(errors, path, "invalid_deck_limit", "Deck limit must be an integer of at least 1.");
  }
};

const validateStrength = (
  errors: CatalogValidationError[],
  value: unknown,
  kind: unknown,
  path: string,
) => {
  if (!Number.isInteger(value) || (value as number) < 0) {
    push(errors, path, "invalid_strength", "Strength must be a non-negative integer.");
    return;
  }

  if (kind === "special" && value !== 0) {
    push(errors, path, "invalid_strength", "Special cards must have strength 0.");
  }
};

const validateRows = (
  errors: CatalogValidationError[],
  value: unknown,
  kind: unknown,
  path: string,
) => {
  if (!Array.isArray(value)) {
    push(errors, path, "invalid_rows", "Rows must be an array.");
    return;
  }

  value.forEach((row, index) => {
    if (!isCatalogRow(row)) {
      push(errors, `${path}.${index}`, "invalid_rows", "Row is not a known catalog row.");
    }
  });

  const uniqueRows = new Set(value);
  if (uniqueRows.size !== value.length) {
    push(errors, path, "invalid_rows", "Rows must not contain duplicates.");
  }

  if ((kind === "unit" || kind === "hero") && value.length < 1) {
    push(errors, path, "invalid_rows", "Unit and hero cards must declare at least one row.");
  }

  if (kind === "special" && value.length !== 0) {
    push(errors, path, "invalid_rows", "Special cards must declare an empty row list.");
  }
};

const validateAbilities = (
  errors: CatalogValidationError[],
  value: unknown,
  path: string,
) => {
  if (!Array.isArray(value)) {
    push(errors, path, "unknown_ability", "Abilities must be an array.");
    return;
  }

  value.forEach((ability, index) => {
    if (!isCatalogAbilityId(ability)) {
      push(errors, `${path}.${index}`, "unknown_ability", "Ability is not known.");
    }
  });
};

const validateTags = (errors: CatalogValidationError[], value: unknown, path: string) => {
  if (!Array.isArray(value) || value.some((tag) => !isNonEmptyString(tag))) {
    push(errors, path, "missing_required_field", "Tags must be an array of strings.");
  }
};

const validateCard = (
  errors: CatalogValidationError[],
  value: unknown,
  path: string,
  knownSourceIds: Set<string>,
) => {
  if (!isObject(value)) {
    push(errors, path, "missing_required_field", "Card source must be an object.");
    return;
  }

  validateRequiredString(errors, value.sourceId, `${path}.sourceId`, "Source ID");
  validateRequiredString(errors, value.name, `${path}.name`, "Name");

  if (!isCatalogFaction(value.faction)) {
    push(errors, `${path}.faction`, "invalid_faction", "Faction is not known.");
  }

  if (!isCatalogCardKind(value.kind)) {
    push(errors, `${path}.kind`, "invalid_kind", "Card kind is not known.");
  }

  validateStrength(errors, value.strength, value.kind, `${path}.strength`);
  validateRows(errors, value.rows, value.kind, `${path}.rows`);
  validateAbilities(errors, value.abilities, `${path}.abilities`);
  validateTags(errors, value.tags, `${path}.tags`);
  validateDeckLimit(errors, value.deckLimit, `${path}.deckLimit`);
  validateImage(errors, value.image, `${path}.image`);

  if (value.linkedSourceIds !== undefined) {
    if (!Array.isArray(value.linkedSourceIds)) {
      push(errors, `${path}.linkedSourceIds`, "unknown_linked_source_id", "Linked IDs must be an array.");
    } else {
      value.linkedSourceIds.forEach((sourceId, index) => {
        if (!isNonEmptyString(sourceId) || !knownSourceIds.has(sourceId)) {
          push(
            errors,
            `${path}.linkedSourceIds.${index}`,
            "unknown_linked_source_id",
            "Linked source ID does not exist in this card set.",
          );
        }
      });
    }
  }
};

export const validateCardSources = (cards: unknown[]): CatalogValidationResult => {
  const errors: CatalogValidationError[] = [];
  const seen = new Set<string>();
  const knownSourceIds = new Set(
    cards
      .filter(isObject)
      .map((card) => card.sourceId)
      .filter(isNonEmptyString),
  );

  cards.forEach((card, index) => {
    const path = `cards.${index}`;
    if (isObject(card) && isNonEmptyString(card.sourceId)) {
      if (seen.has(card.sourceId)) {
        push(errors, `${path}.sourceId`, "duplicate_source_id", "Card source ID must be unique.");
      }
      seen.add(card.sourceId);
    }

    validateCard(errors, card, path, knownSourceIds);
  });

  return result(errors);
};

const validateLeader = (
  errors: CatalogValidationError[],
  value: unknown,
  path: string,
) => {
  if (!isObject(value)) {
    push(errors, path, "missing_required_field", "Leader source must be an object.");
    return;
  }

  validateRequiredString(errors, value.sourceId, `${path}.sourceId`, "Source ID");
  validateRequiredString(errors, value.name, `${path}.name`, "Name");
  validateImage(errors, value.image, `${path}.image`);

  if (!isCatalogFaction(value.faction) || value.faction === "neutral") {
    push(errors, `${path}.faction`, "invalid_faction", "Leader faction must be a non-neutral faction.");
  }

  if (!isCatalogLeaderAbilityId(value.ability)) {
    push(errors, `${path}.ability`, "unknown_leader_ability", "Leader ability is not known.");
  }
};

export const validateLeaderSources = (leaders: unknown[]): CatalogValidationResult => {
  const errors: CatalogValidationError[] = [];
  const seen = new Set<string>();

  leaders.forEach((leader, index) => {
    const path = `leaders.${index}`;
    if (isObject(leader) && isNonEmptyString(leader.sourceId)) {
      if (seen.has(leader.sourceId)) {
        push(
          errors,
          `${path}.sourceId`,
          "duplicate_leader_source_id",
          "Leader source ID must be unique.",
        );
      }
      seen.add(leader.sourceId);
    }

    validateLeader(errors, leader, path);
  });

  return result(errors);
};

const validateDeckEntry = (
  errors: CatalogValidationError[],
  value: unknown,
  path: string,
  knownCardIds: Set<string>,
) => {
  if (!isObject(value)) {
    push(errors, path, "unknown_card_reference", "Deck entry must be an object.");
    return;
  }

  if (!isNonEmptyString(value.sourceId) || !knownCardIds.has(value.sourceId)) {
    push(errors, `${path}.sourceId`, "unknown_card_reference", "Deck entry references a missing card.");
  }

  if (!Number.isInteger(value.count) || (value.count as number) < 1) {
    push(errors, `${path}.count`, "invalid_deck_count", "Deck entry count must be at least 1.");
  }
};

export const validateDeckPresets = (
  presets: unknown[],
  cards: Pick<CatalogCardSource, "sourceId">[],
  leaders: Pick<CatalogLeaderSource, "sourceId">[],
): CatalogValidationResult => {
  const errors: CatalogValidationError[] = [];
  const knownCardIds = new Set(cards.map((card) => card.sourceId));
  const knownLeaderIds = new Set(leaders.map((leader) => leader.sourceId));
  const seenPresetIds = new Set<string>();

  presets.forEach((preset, index) => {
    const path = `presets.${index}`;
    if (!isObject(preset)) {
      push(errors, path, "missing_required_field", "Deck preset must be an object.");
      return;
    }

    validateRequiredString(errors, preset.presetId, `${path}.presetId`, "Preset ID");
    validateRequiredString(errors, preset.name, `${path}.name`, "Name");

    if (isNonEmptyString(preset.presetId)) {
      if (seenPresetIds.has(preset.presetId)) {
        push(errors, `${path}.presetId`, "duplicate_preset_id", "Preset ID must be unique.");
      }
      seenPresetIds.add(preset.presetId);
    }

    if (!isCatalogFaction(preset.faction) || preset.faction === "neutral") {
      push(errors, `${path}.faction`, "invalid_faction", "Deck preset faction must be non-neutral.");
    }

    if (!isNonEmptyString(preset.leaderSourceId) || !knownLeaderIds.has(preset.leaderSourceId)) {
      push(
        errors,
        `${path}.leaderSourceId`,
        "unknown_leader_reference",
        "Deck preset references a missing leader.",
      );
    }

    if (!Array.isArray(preset.mainDeck)) {
      push(errors, `${path}.mainDeck`, "unknown_card_reference", "Main deck must be an array.");
    } else {
      preset.mainDeck.forEach((entry, entryIndex) => {
        validateDeckEntry(errors, entry, `${path}.mainDeck.${entryIndex}`, knownCardIds);
      });
    }

    if (!Array.isArray(preset.sideDeck)) {
      push(errors, `${path}.sideDeck`, "unknown_card_reference", "Side deck must be an array.");
    } else {
      preset.sideDeck.forEach((entry, entryIndex) => {
        validateDeckEntry(errors, entry, `${path}.sideDeck.${entryIndex}`, knownCardIds);
      });
    }
  });

  return result(errors);
};

export const validateCatalog = (input: {
  cards: unknown[];
  leaders: unknown[];
  presets: unknown[];
}): CatalogValidationResult => {
  const cardResult = validateCardSources(input.cards);
  const leaderResult = validateLeaderSources(input.leaders);
  const cardReferences = input.cards
    .filter(isObject)
    .map((card) => card.sourceId)
    .filter(isNonEmptyString)
    .map((sourceId) => ({ sourceId }));
  const leaderReferences = input.leaders
    .filter(isObject)
    .map((leader) => leader.sourceId)
    .filter(isNonEmptyString)
    .map((sourceId) => ({ sourceId }));
  const presetResult = validateDeckPresets(
    input.presets,
    cardReferences,
    leaderReferences,
  );

  return result([...cardResult.errors, ...leaderResult.errors, ...presetResult.errors]);
};

export type { CatalogCardSource, CatalogDeckPreset, CatalogLeaderSource };
