import {
  currentCatalogCards,
  currentCatalogLeaders,
  currentDeckPresets,
  resolveCatalogDeckPreset,
} from "@/data/catalog";
import type { CatalogCardKind, CatalogDeckPreset, CatalogFaction, CatalogLeaderSource } from "@/game/catalog";
import type { CatalogCardSource } from "@/game/catalog";
import {
  aiPolicyIdFromSearch,
  DEFAULT_PRODUCT_AI_POLICY_ID,
  PRODUCT_AI_POLICIES,
  type ProductAiPolicyId,
} from "@/game/ai";
import type { StartEngineMatchOptions } from "@/store/thunks/engineThunks";
import type { CardStudioBlockedSources, CardStudioSourceSets } from "./cardStudioTypes";

import { deckNameKey, validateDeckPreset } from "./deckBuilderViewModel";
import { getFactionDisplay, getLeaderAbilityDisplay } from "./displayMetadata";

export interface AuthenticMatchSetupConfig {
  readonly humanDeckPresetId: string;
  readonly humanDeckPreset?: CatalogDeckPreset;
  readonly opponentDeckPresetId: string;
  readonly modeId: "human-vs-ai";
  readonly roundId: "standard";
  readonly formatId: "best-of-3";
  readonly seed: string | number;
  readonly aiPolicyId: ProductAiPolicyId;
  readonly catalogCards?: readonly CatalogCardSource[];
  readonly catalogLeaders?: readonly CatalogLeaderSource[];
}

export interface PreGameDeckOptionViewModel {
  readonly optionId: string;
  readonly presetId: string;
  readonly name: string;
  readonly faction: CatalogFaction;
  readonly factionName: string;
  readonly leader: CatalogLeaderSource | null;
  readonly leaderName: string;
  readonly leaderAbilityName: string;
  readonly cardCount: number;
  readonly unitCount: number;
  readonly heroCount: number;
  readonly specialCount: number;
  readonly ready: boolean;
  readonly disabledReason: string | null;
  readonly description: string;
  readonly source: "catalog" | "local";
}

export interface PreGameModeOptionViewModel {
  readonly id: "human-vs-ai" | "ranked" | "training" | "seed-suite";
  readonly name: string;
  readonly icon: string;
  readonly description: string;
  readonly available: boolean;
  readonly note: string;
}

export interface PreGameFormatOptionViewModel {
  readonly id: "best-of-3" | "best-of-1" | "training";
  readonly name: string;
  readonly available: boolean;
  readonly note: string;
}

export interface PreGameRoundOptionViewModel {
  readonly id: "standard" | "instant-death";
  readonly name: string;
  readonly available: boolean;
  readonly note: string;
}

export interface PreGameAiPolicyOptionViewModel {
  readonly id: ProductAiPolicyId;
  readonly label: string;
  readonly shortLabel: string;
  readonly statusLabel: string;
  readonly description: string;
}

const countEntries = (entries: CatalogDeckPreset["mainDeck"]) => entries.reduce((total, entry) => total + entry.count, 0);

const countKinds = (
  preset: CatalogDeckPreset,
  cards: readonly CatalogCardSource[] = currentCatalogCards,
): Record<CatalogCardKind, number> => {
  const byId = new Map<string, CatalogCardSource>(cards.map((card) => [card.sourceId, card]));
  return preset.mainDeck.reduce<Record<CatalogCardKind, number>>(
    (counts, entry) => {
      const kind = byId.get(entry.sourceId)?.kind;
      if (kind) {
        counts[kind] += entry.count;
      }
      return counts;
    },
    { unit: 0, hero: 0, special: 0 },
  );
};

export const buildPreGameDeckOptions = (
  presets: readonly CatalogDeckPreset[] = currentDeckPresets,
  source: "catalog" | "local" = "catalog",
  sourceSets: CardStudioSourceSets = { cards: currentCatalogCards, leaders: currentCatalogLeaders },
  blockedSources: CardStudioBlockedSources = { cards: new Map(), leaders: new Map() },
): readonly PreGameDeckOptionViewModel[] =>
  presets.map((preset) => {
    try {
      const resolved = resolveCatalogDeckPreset(preset, sourceSets.cards, sourceSets.leaders);
      const kindCounts = countKinds(preset, sourceSets.cards);
      const leaderAbility = getLeaderAbilityDisplay(resolved.leader.ability);
      const faction = getFactionDisplay(preset.faction);
      const validation = validateDeckPreset(preset, sourceSets.cards, sourceSets.leaders, blockedSources);
      const errors = validation.issues.filter((issue) => issue.severity === "error");
      return {
        optionId: `${source}:${preset.presetId}`,
        presetId: preset.presetId,
        name: preset.name,
        faction: preset.faction,
        factionName: faction.name,
        leader: resolved.leader,
        leaderName: resolved.leader.name,
        leaderAbilityName: leaderAbility.name,
        cardCount: countEntries(preset.mainDeck),
        unitCount: kindCounts.unit,
        heroCount: kindCounts.hero,
        specialCount: kindCounts.special,
        ready: errors.length === 0,
        disabledReason: errors[0]?.message ?? null,
        description: `${source === "local" ? "Local" : "Current"} ${faction.name} - ${resolved.leader.name}`,
        source,
      };
    } catch (error) {
      const faction = getFactionDisplay(preset.faction);
      return {
        optionId: `${source}:${preset.presetId}`,
        presetId: preset.presetId,
        name: preset.name,
        faction: preset.faction,
        factionName: faction.name,
        leader: null,
        leaderName: "Missing leader",
        leaderAbilityName: "Unavailable",
        cardCount: countEntries(preset.mainDeck),
        unitCount: 0,
        heroCount: 0,
        specialCount: 0,
        ready: false,
        disabledReason: error instanceof Error ? error.message : "Preset cannot be resolved.",
        description: `${faction.name} preset cannot be resolved.`,
        source,
      };
    }
  });

const findShadowedCatalogPresetId = (localDeck: CatalogDeckPreset): string | null => {
  const seededSourceId = localDeck.presetId.startsWith("local-") ? localDeck.presetId.slice("local-".length) : "";
  if (currentDeckPresets.some((preset) => preset.presetId === seededSourceId)) {
    return seededSourceId;
  }
  return currentDeckPresets.find((preset) => deckNameKey(preset.name) === deckNameKey(localDeck.name))?.presetId ?? null;
};

export const buildPreGameDeckOptionsWithLocal = (
  localDecks: readonly CatalogDeckPreset[] = [],
  sourceSets: CardStudioSourceSets = { cards: currentCatalogCards, leaders: currentCatalogLeaders },
  blockedSources: CardStudioBlockedSources = { cards: new Map(), leaders: new Map() },
) => {
  const localByCatalogId = new Map<string, CatalogDeckPreset>();
  const unmatchedLocalDecks: CatalogDeckPreset[] = [];

  localDecks.forEach((localDeck) => {
    const shadowedCatalogId = findShadowedCatalogPresetId(localDeck);
    if (shadowedCatalogId && !localByCatalogId.has(shadowedCatalogId)) {
      localByCatalogId.set(shadowedCatalogId, localDeck);
    } else {
      unmatchedLocalDecks.push(localDeck);
    }
  });

  return [
    ...currentDeckPresets.flatMap((preset) => {
      const localReplacement = localByCatalogId.get(preset.presetId);
      return localReplacement
        ? buildPreGameDeckOptions([localReplacement], "local", sourceSets, blockedSources)
        : buildPreGameDeckOptions([preset], "catalog", sourceSets, blockedSources);
    }),
    ...buildPreGameDeckOptions(unmatchedLocalDecks, "local", sourceSets, blockedSources),
  ];
};

export const buildPreGameModeOptions = (
  aiPolicyId: ProductAiPolicyId = DEFAULT_PRODUCT_AI_POLICY_ID,
): readonly PreGameModeOptionViewModel[] => [
  {
    id: "human-vs-ai",
    name: "Casual",
    icon: "☕",
    description: "Practice match versus AI. No ranking.",
    available: true,
    note: aiPolicyId,
  },
  { id: "ranked", name: "Ranked", icon: "⚔", description: "Climb the ladder. Win streaks affect MMR.", available: false, note: "coming later" },
  { id: "training", name: "Training", icon: "✎", description: "Single round, free mulligans, undo enabled.", available: false, note: "coming later" },
  { id: "seed-suite", name: "Seed Suite", icon: "⚙", description: "Replay deterministic suite from research lab.", available: false, note: "coming later" },
];

export const buildPreGameAiPolicyOptions = (): readonly PreGameAiPolicyOptionViewModel[] =>
  PRODUCT_AI_POLICIES.filter((policy) => policy.productSelectable).map((policy) => ({
    id: policy.id,
    label: `${policy.shortLabel} · ${policy.label}`,
    shortLabel: policy.shortLabel,
    statusLabel: policy.productStatus,
    description: policy.description,
  }));

export const buildPreGameFormatOptions = (): readonly PreGameFormatOptionViewModel[] => [
  { id: "best-of-3", name: "Bo3", available: true, note: "current match format" },
  { id: "best-of-1", name: "Bo1", available: false, note: "coming later" },
  { id: "training", name: "Training", available: false, note: "coming later" },
];

export const buildPreGameRoundOptions = (): readonly PreGameRoundOptionViewModel[] => [
  { id: "standard", name: "Standard", available: true, note: "two gems each" },
  { id: "instant-death", name: "Instant Death", available: false, note: "one gem each" },
];

export const getDefaultPreGameSelection = (
  aiPolicyId: ProductAiPolicyId = DEFAULT_PRODUCT_AI_POLICY_ID,
) => ({
  humanDeckPresetId: "current-northern-realms",
  opponentDeckPresetId: "current-nilfgaard",
  modeId: "human-vs-ai" as const,
  roundId: "standard" as const,
  formatId: "best-of-3" as const,
  aiPolicyId,
});

export const getSuggestedOpponentPresetId = (humanPresetId: string, options = buildPreGameDeckOptions()): string => {
  const preferred = getDefaultPreGameSelection().opponentDeckPresetId;
  if (humanPresetId !== preferred && options.some((option) => option.presetId === preferred && option.ready)) {
    return preferred;
  }
  return options.find((option) => option.ready && option.presetId !== humanPresetId)?.presetId ?? preferred;
};

export const seedFromSearch = (search = ""): string => {
  const params = new URLSearchParams(search.startsWith("?") ? search : `?${search}`);
  return params.get("seed") ?? "";
};

export { aiPolicyIdFromSearch };

export const generateVisibleSeed = (now = Date.now()): string => `ep4-${now.toString(36)}`;

export const normalizePreGameSeed = (seedInput: string, generate = generateVisibleSeed): string => {
  const trimmed = seedInput.trim();
  return trimmed.length > 0 ? trimmed : generate();
};

export const buildSetupConfig = (input: {
  readonly humanDeckPresetId: string;
  readonly humanDeckPreset?: CatalogDeckPreset;
  readonly opponentDeckPresetId: string;
  readonly roundId: "standard";
  readonly formatId: "best-of-3";
  readonly seed: string;
  readonly aiPolicyId?: ProductAiPolicyId;
  readonly catalogCards?: readonly CatalogCardSource[];
  readonly catalogLeaders?: readonly CatalogLeaderSource[];
}): AuthenticMatchSetupConfig => {
  const config: AuthenticMatchSetupConfig = {
    humanDeckPresetId: input.humanDeckPresetId,
    opponentDeckPresetId: input.opponentDeckPresetId,
    modeId: "human-vs-ai",
    roundId: input.roundId,
    formatId: input.formatId,
    seed: normalizePreGameSeed(input.seed),
    aiPolicyId: input.aiPolicyId ?? DEFAULT_PRODUCT_AI_POLICY_ID,
    ...(input.catalogCards ? { catalogCards: input.catalogCards } : {}),
    ...(input.catalogLeaders ? { catalogLeaders: input.catalogLeaders } : {}),
  };
  return input.humanDeckPreset ? { ...config, humanDeckPreset: input.humanDeckPreset } : config;
};

export const setupConfigToStartEngineOptions = (config: AuthenticMatchSetupConfig): StartEngineMatchOptions => ({
  seed: config.seed,
  humanDeckPresetId: config.humanDeckPresetId,
  ...(config.humanDeckPreset ? { humanDeckPreset: config.humanDeckPreset } : {}),
  aiDeckPresetId: config.opponentDeckPresetId,
  humanSeat: "seat_a",
  aiSeat: "seat_b",
  playerIds: { seat_a: "human", seat_b: "ai" },
  controllerKinds: { seat_a: "human", seat_b: "ai" },
  aiPolicyId: config.aiPolicyId,
  ...(config.catalogCards ? { catalogCards: config.catalogCards } : {}),
  ...(config.catalogLeaders ? { catalogLeaders: config.catalogLeaders } : {}),
});
