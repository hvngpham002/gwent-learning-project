import type {
  CatalogAbilityId,
  CatalogCardSource,
  CatalogLeaderAbilityId,
} from "@/game/catalog";

const WEATHER_LEADER_ABILITY_IDS = new Set<CatalogLeaderAbilityId>([
  "play_frost",
  "play_fog",
  "play_rain",
  "play_any_weather",
]);

const WEATHER_EFFECT_ABILITIES = new Set<CatalogAbilityId>([
  "frost",
  "fog",
  "rain",
  "skellige_storm",
]);

const SINGLE_WEATHER_LEADER_TO_SOURCE: Partial<
  Record<CatalogLeaderAbilityId, { sourceId: string; abilityId: CatalogAbilityId }>
> = {
  play_frost: { sourceId: "neutral.biting-frost", abilityId: "frost" },
  play_fog: { sourceId: "neutral.impenetrable-fog", abilityId: "fog" },
  play_rain: { sourceId: "neutral.torrential-rain", abilityId: "rain" },
};

const CLEAR_WEATHER_SOURCE_ID = "neutral.clear-weather";

const WEATHER_SOURCE_ORDER: readonly string[] = [
  "neutral.biting-frost",
  "neutral.impenetrable-fog",
  "neutral.torrential-rain",
  "neutral.skellige-storm",
];

export const isWeatherLeaderAbility = (
  ability: CatalogLeaderAbilityId,
): boolean => WEATHER_LEADER_ABILITY_IDS.has(ability);

const isEligibleWeatherSource = (source: CatalogCardSource | undefined): source is CatalogCardSource => {
  if (!source) return false;
  if (source.kind !== "special") return false;
  if (source.sourceId === CLEAR_WEATHER_SOURCE_ID) return false;
  if (!WEATHER_SOURCE_ORDER.includes(source.sourceId)) return false;
  return source.abilities.some((ability) => WEATHER_EFFECT_ABILITIES.has(ability));
};

export const isEligibleWeatherSourceForLeader = (
  ability: CatalogLeaderAbilityId,
  source: CatalogCardSource | undefined,
): boolean => {
  if (!isEligibleWeatherSource(source)) return false;
  if (ability === "play_any_weather") return true;
  const required = SINGLE_WEATHER_LEADER_TO_SOURCE[ability];
  if (!required) return false;
  return source.sourceId === required.sourceId && source.abilities.includes(required.abilityId);
};

export const sortedWeatherSourceIds = (sourceIds: readonly string[]): string[] => {
  const orderIndex = (sourceId: string): number => {
    const index = WEATHER_SOURCE_ORDER.indexOf(sourceId);
    return index >= 0 ? index : WEATHER_SOURCE_ORDER.length;
  };
  return [...sourceIds].sort((a, b) => {
    const ai = orderIndex(a);
    const bi = orderIndex(b);
    if (ai !== bi) return ai - bi;
    return a.localeCompare(b);
  });
};
