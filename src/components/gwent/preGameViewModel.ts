import {
  currentCatalogCards,
  currentCatalogLeaders,
  currentDeckPresets,
  resolveCatalogDeckPreset,
} from "@/data/catalog";
import type { CatalogCardKind, CatalogDeckPreset, CatalogFaction, CatalogLeaderSource } from "@/game/catalog";
import type { StartEngineMatchOptions } from "@/store/thunks/engineThunks";

import { ENGINE_AI_POLICY_ID } from "../game/engine/engineShellViewModels";
import { getFactionDisplay, getLeaderAbilityDisplay } from "./displayMetadata";

export interface AuthenticMatchSetupConfig {
  readonly humanDeckPresetId: string;
  readonly opponentDeckPresetId: string;
  readonly modeId: "human-vs-ai";
  readonly roundId: "standard";
  readonly formatId: "best-of-3";
  readonly seed: string | number;
  readonly aiPolicyId: typeof ENGINE_AI_POLICY_ID;
}

export interface PreGameDeckOptionViewModel {
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

const countEntries = (entries: CatalogDeckPreset["mainDeck"]) => entries.reduce((total, entry) => total + entry.count, 0);

const countKinds = (preset: CatalogDeckPreset): Record<CatalogCardKind, number> => {
  const byId = new Map<string, (typeof currentCatalogCards)[number]>(currentCatalogCards.map((card) => [card.sourceId, card]));
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
): readonly PreGameDeckOptionViewModel[] =>
  presets.map((preset) => {
    try {
      const resolved = resolveCatalogDeckPreset(preset, currentCatalogCards, currentCatalogLeaders);
      const kindCounts = countKinds(preset);
      const leaderAbility = getLeaderAbilityDisplay(resolved.leader.ability);
      const faction = getFactionDisplay(preset.faction);
      return {
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
        ready: true,
        disabledReason: null,
        description: `Current ${faction.name} - ${resolved.leader.name}`,
      };
    } catch (error) {
      const faction = getFactionDisplay(preset.faction);
      return {
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
      };
    }
  });

export const buildPreGameModeOptions = (): readonly PreGameModeOptionViewModel[] => [
  {
    id: "human-vs-ai",
    name: "Casual",
    icon: "☕",
    description: "Practice match versus AI. No ranking.",
    available: true,
    note: ENGINE_AI_POLICY_ID,
  },
  { id: "ranked", name: "Ranked", icon: "⚔", description: "Climb the ladder. Win streaks affect MMR.", available: false, note: "coming later" },
  { id: "training", name: "Training", icon: "✎", description: "Single round, free mulligans, undo enabled.", available: false, note: "coming later" },
  { id: "seed-suite", name: "Seed Suite", icon: "⚙", description: "Replay deterministic suite from research lab.", available: false, note: "coming later" },
];

export const buildPreGameFormatOptions = (): readonly PreGameFormatOptionViewModel[] => [
  { id: "best-of-3", name: "Bo3", available: true, note: "current match format" },
  { id: "best-of-1", name: "Bo1", available: false, note: "coming later" },
  { id: "training", name: "Training", available: false, note: "coming later" },
];

export const buildPreGameRoundOptions = (): readonly PreGameRoundOptionViewModel[] => [
  { id: "standard", name: "Standard", available: true, note: "two gems each" },
  { id: "instant-death", name: "Instant Death", available: false, note: "one gem each" },
];

export const getDefaultPreGameSelection = () => ({
  humanDeckPresetId: "current-northern-realms",
  opponentDeckPresetId: "current-nilfgaard",
  modeId: "human-vs-ai" as const,
  roundId: "standard" as const,
  formatId: "best-of-3" as const,
  aiPolicyId: ENGINE_AI_POLICY_ID,
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

export const generateVisibleSeed = (now = Date.now()): string => `ep4-${now.toString(36)}`;

export const normalizePreGameSeed = (seedInput: string, generate = generateVisibleSeed): string => {
  const trimmed = seedInput.trim();
  return trimmed.length > 0 ? trimmed : generate();
};

export const buildSetupConfig = (input: {
  readonly humanDeckPresetId: string;
  readonly opponentDeckPresetId: string;
  readonly roundId: "standard";
  readonly formatId: "best-of-3";
  readonly seed: string;
}): AuthenticMatchSetupConfig => ({
  humanDeckPresetId: input.humanDeckPresetId,
  opponentDeckPresetId: input.opponentDeckPresetId,
  modeId: "human-vs-ai",
  roundId: input.roundId,
  formatId: input.formatId,
  seed: normalizePreGameSeed(input.seed),
  aiPolicyId: ENGINE_AI_POLICY_ID,
});

export const setupConfigToStartEngineOptions = (config: AuthenticMatchSetupConfig): StartEngineMatchOptions => ({
  seed: config.seed,
  humanDeckPresetId: config.humanDeckPresetId,
  aiDeckPresetId: config.opponentDeckPresetId,
  humanSeat: "seat_a",
  aiSeat: "seat_b",
  playerIds: { seat_a: "human", seat_b: "ai" },
  controllerKinds: { seat_a: "human", seat_b: "ai" },
});
