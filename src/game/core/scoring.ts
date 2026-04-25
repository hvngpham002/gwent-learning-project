import type { CatalogAbilityId, CatalogCardSource, CatalogLeaderSource, CatalogRow } from "@/game/catalog";

import type { CardInstanceId, MatchState, SeatId } from "./types";

export type WeatherPolicy = "normal" | "king_bran";
export type WeatherEffectId = "frost" | "fog" | "rain" | "skellige_storm";

export interface CalculateScoresInput {
  state: MatchState;
  catalogCards: readonly CatalogCardSource[];
  catalogLeaders?: readonly CatalogLeaderSource[];
  weatherPolicyBySeat?: Partial<Record<SeatId, WeatherPolicy>>;
}

export interface CardScoreEntry {
  cardId: CardInstanceId;
  sourceId: string;
  seatId: SeatId;
  row: CatalogRow;
  cardKind: CatalogCardSource["kind"] | "missing";
  isUnit: boolean;
  isHero: boolean;
  printedStrength: number;
  afterWeather: number;
  tightBondMultiplier: number;
  afterTightBond: number;
  moraleBonus: number;
  afterMorale: number;
  hornMultiplier: number;
  finalStrength: number;
  eligibleForScorch: boolean;
  modifiers: string[];
}

export interface ActiveWeatherEffect {
  effect: WeatherEffectId;
  sourceCardIds: CardInstanceId[];
  affectedRows: CatalogRow[];
}

export interface ScoringDiagnostic {
  code:
    | "missing_card_instance"
    | "missing_catalog_source"
    | "weather_missing_catalog_source"
    | "unsupported_weather_card"
    | "multiple_horn_sources";
  message: string;
  cardId?: CardInstanceId;
  sourceId?: string;
  seatId?: SeatId;
  row?: CatalogRow;
}

export interface MatchScoreBreakdown {
  totalBySeat: Record<SeatId, number>;
  rowTotalsBySeat: Record<SeatId, Record<CatalogRow, number>>;
  cards: CardScoreEntry[];
  activeWeatherEffects: ActiveWeatherEffect[];
  diagnostics: ScoringDiagnostic[];
}

export interface ScorchTarget {
  cardId: CardInstanceId;
  sourceId: string;
  seatId: SeatId;
  row: CatalogRow;
  effectiveStrength: number;
}

export interface UnitScorchCloseResult {
  outcome: "destroyed" | "no_targets" | "below_threshold";
  oppositeSeatId: SeatId;
  rowTotal: number;
  targets: ScorchTarget[];
}

const ROWS: readonly CatalogRow[] = ["close", "ranged", "siege"];
const SEATS: readonly SeatId[] = ["seat_a", "seat_b"];

const WEATHER_ROWS: Record<WeatherEffectId, readonly CatalogRow[]> = {
  frost: ["close"],
  fog: ["ranged"],
  rain: ["siege"],
  skellige_storm: ["ranged", "siege"],
};

const WEATHER_ABILITIES = new Set<CatalogAbilityId>(["frost", "fog", "rain", "skellige_storm"]);
const ROW_WEATHER_EFFECTS: Record<CatalogRow, readonly WeatherEffectId[]> = {
  close: ["frost"],
  ranged: ["fog", "skellige_storm"],
  siege: ["rain", "skellige_storm"],
};

const opponentOf = (seatId: SeatId): SeatId => (seatId === "seat_a" ? "seat_b" : "seat_a");

const createCardLookup = (catalogCards: readonly CatalogCardSource[]) =>
  new Map(catalogCards.map((card) => [card.sourceId, card]));

const hasAbility = (source: CatalogCardSource | undefined, abilityId: CatalogAbilityId) =>
  Boolean(source?.abilities.includes(abilityId));

const createEmptyRowTotals = (): Record<CatalogRow, number> => ({
  close: 0,
  ranged: 0,
  siege: 0,
});

const createEmptySeatTotals = (): Record<SeatId, Record<CatalogRow, number>> => ({
  seat_a: createEmptyRowTotals(),
  seat_b: createEmptyRowTotals(),
});

const getActiveWeatherEffects = (
  state: MatchState,
  catalogLookup: ReadonlyMap<string, CatalogCardSource>,
  diagnostics: ScoringDiagnostic[],
): ActiveWeatherEffect[] => {
  const byEffect = new Map<WeatherEffectId, CardInstanceId[]>();

  state.weather.entries.forEach((cardId) => {
    const instance = state.cardsById[cardId];
    if (!instance) {
      diagnostics.push({
        code: "missing_card_instance",
        message: `Weather entry ${cardId} has no card instance.`,
        cardId,
      });
      return;
    }

    const source = catalogLookup.get(instance.sourceId);
    if (!source) {
      diagnostics.push({
        code: "weather_missing_catalog_source",
        message: `Weather entry ${cardId} references missing source ${instance.sourceId}.`,
        cardId,
        sourceId: instance.sourceId,
      });
      return;
    }

    const effect = source.abilities.find((abilityId): abilityId is WeatherEffectId =>
      WEATHER_ABILITIES.has(abilityId),
    );
    if (!effect) {
      diagnostics.push({
        code: "unsupported_weather_card",
        message: `Weather entry ${cardId} has no active weather ability.`,
        cardId,
        sourceId: source.sourceId,
      });
      return;
    }

    byEffect.set(effect, [...(byEffect.get(effect) ?? []), cardId]);
  });

  return [...byEffect.entries()].map(([effect, sourceCardIds]) => ({
    effect,
    sourceCardIds,
    affectedRows: [...WEATHER_ROWS[effect]],
  }));
};

const isWeatheredRow = (row: CatalogRow, activeWeatherEffects: readonly ActiveWeatherEffect[]) => {
  const active = new Set(activeWeatherEffects.map((entry) => entry.effect));
  return ROW_WEATHER_EFFECTS[row].some((effect) => active.has(effect));
};

const getWeatheredStrength = (printedStrength: number, policy: WeatherPolicy) => {
  if (policy === "king_bran") {
    return printedStrength - Math.floor(printedStrength / 2);
  }
  return 1;
};

const countTightBondGroup = (
  state: MatchState,
  catalogLookup: ReadonlyMap<string, CatalogCardSource>,
  seatId: SeatId,
  sourceId: string,
) =>
  ROWS.reduce(
    (count, row) =>
      count +
      state.seats[seatId].board[row].units.filter((cardId) => {
        const instance = state.cardsById[cardId];
        const source = instance ? catalogLookup.get(instance.sourceId) : undefined;
        return source?.sourceId === sourceId && source.kind === "unit" && hasAbility(source, "tight_bond");
      }).length,
    0,
  );

const createMissingEntry = (cardId: CardInstanceId, seatId: SeatId, row: CatalogRow): CardScoreEntry => ({
  cardId,
  sourceId: "missing",
  seatId,
  row,
  cardKind: "missing",
  isUnit: false,
  isHero: false,
  printedStrength: 0,
  afterWeather: 0,
  tightBondMultiplier: 1,
  afterTightBond: 0,
  moraleBonus: 0,
  afterMorale: 0,
  hornMultiplier: 1,
  finalStrength: 0,
  eligibleForScorch: false,
  modifiers: ["diagnostic:missing"],
});

export const calculateScores = ({
  state,
  catalogCards,
  weatherPolicyBySeat = {},
}: CalculateScoresInput): MatchScoreBreakdown => {
  const catalogLookup = createCardLookup(catalogCards);
  const diagnostics: ScoringDiagnostic[] = [];
  const activeWeatherEffects = getActiveWeatherEffects(state, catalogLookup, diagnostics);
  const rowTotalsBySeat = createEmptySeatTotals();
  const totalBySeat: Record<SeatId, number> = { seat_a: 0, seat_b: 0 };
  const cards: CardScoreEntry[] = [];

  SEATS.forEach((seatId) => {
    ROWS.forEach((row) => {
      const rowState = state.seats[seatId].board[row];
      const rowSources = rowState.units.map((cardId) => {
        const instance = state.cardsById[cardId];
        return instance ? catalogLookup.get(instance.sourceId) : undefined;
      });
      const moraleSourceCount = rowSources.filter(
        (source) => source?.kind === "unit" && hasAbility(source, "morale_boost"),
      ).length;
      const specialHornSourceId = rowState.horn;
      const unitHornSourceIds = rowState.units.filter((cardId) => {
        const source = rowSources[rowState.units.indexOf(cardId)];
        return source?.kind === "unit" && hasAbility(source, "commanders_horn");
      });
      const hornSourceId = specialHornSourceId ?? unitHornSourceIds[0] ?? null;
      const hasHorn = Boolean(hornSourceId);

      if ((specialHornSourceId ? 1 : 0) + unitHornSourceIds.length > 1) {
        diagnostics.push({
          code: "multiple_horn_sources",
          message: "Multiple horn sources found on a row; only one horn modifier was applied.",
          cardId: hornSourceId ?? undefined,
          seatId,
          row,
        });
      }

      rowState.units.forEach((cardId) => {
        const instance = state.cardsById[cardId];
        if (!instance) {
          diagnostics.push({
            code: "missing_card_instance",
            message: `Board row contains missing card instance ${cardId}.`,
            cardId,
            seatId,
            row,
          });
          cards.push(createMissingEntry(cardId, seatId, row));
          return;
        }

        const source = catalogLookup.get(instance.sourceId);
        if (!source) {
          diagnostics.push({
            code: "missing_catalog_source",
            message: `Board card ${cardId} references missing source ${instance.sourceId}.`,
            cardId,
            sourceId: instance.sourceId,
            seatId,
            row,
          });
          cards.push({ ...createMissingEntry(cardId, seatId, row), sourceId: instance.sourceId });
          return;
        }

        const isUnit = source.kind === "unit";
        const isHero = source.kind === "hero";
        const printedStrength = isUnit || isHero ? source.strength : 0;
        const modifiers: string[] = [];
        let afterWeather = printedStrength;

        if (isHero) {
          modifiers.push("hero_immune");
        } else if (isUnit && isWeatheredRow(row, activeWeatherEffects)) {
          const policy = weatherPolicyBySeat[seatId] ?? "normal";
          afterWeather = getWeatheredStrength(printedStrength, policy);
          modifiers.push(policy === "king_bran" ? "weather:king_bran" : "weather");
        }

        const tightBondMultiplier =
          isUnit && !isHero && hasAbility(source, "tight_bond")
            ? Math.max(1, countTightBondGroup(state, catalogLookup, seatId, source.sourceId))
            : 1;
        if (tightBondMultiplier > 1) {
          modifiers.push("tight_bond");
        }
        const afterTightBond = afterWeather * tightBondMultiplier;

        const moraleBonus =
          isUnit && !isHero ? moraleSourceCount - (hasAbility(source, "morale_boost") ? 1 : 0) : 0;
        if (moraleBonus > 0) {
          modifiers.push("morale_boost");
        }
        const afterMorale = afterTightBond + moraleBonus;

        const hornMultiplier =
          isUnit && !isHero && hasHorn && !(hornSourceId === cardId && hasAbility(source, "commanders_horn")) ? 2 : 1;
        if (hornMultiplier > 1) {
          modifiers.push("commanders_horn");
        }
        const finalStrength = afterMorale * hornMultiplier;

        const entry: CardScoreEntry = {
          cardId,
          sourceId: source.sourceId,
          seatId,
          row,
          cardKind: source.kind,
          isUnit,
          isHero,
          printedStrength,
          afterWeather,
          tightBondMultiplier,
          afterTightBond,
          moraleBonus,
          afterMorale,
          hornMultiplier,
          finalStrength,
          eligibleForScorch: isUnit && !isHero,
          modifiers,
        };
        cards.push(entry);
        rowTotalsBySeat[seatId][row] += finalStrength;
      });

      totalBySeat[seatId] += rowTotalsBySeat[seatId][row];
    });
  });

  return {
    totalBySeat,
    rowTotalsBySeat,
    cards,
    activeWeatherEffects,
    diagnostics,
  };
};

const toScorchTarget = (entry: CardScoreEntry): ScorchTarget => ({
  cardId: entry.cardId,
  sourceId: entry.sourceId,
  seatId: entry.seatId,
  row: entry.row,
  effectiveStrength: entry.finalStrength,
});

export const findSpecialScorchTargets = (breakdown: MatchScoreBreakdown): ScorchTarget[] => {
  const candidates = breakdown.cards.filter((entry) => entry.eligibleForScorch);
  const maxStrength = Math.max(0, ...candidates.map((entry) => entry.finalStrength));

  if (maxStrength <= 0) {
    return [];
  }

  return candidates.filter((entry) => entry.finalStrength === maxStrength).map(toScorchTarget);
};

export const findUnitScorchCloseTargets = (
  breakdown: MatchScoreBreakdown,
  sourceController: SeatId,
): UnitScorchCloseResult => {
  const oppositeSeatId = opponentOf(sourceController);
  const rowTotal = breakdown.rowTotalsBySeat[oppositeSeatId].close;

  if (rowTotal < 10) {
    return {
      outcome: "below_threshold",
      oppositeSeatId,
      rowTotal,
      targets: [],
    };
  }

  const candidates = breakdown.cards.filter(
    (entry) => entry.seatId === oppositeSeatId && entry.row === "close" && entry.eligibleForScorch,
  );
  const maxStrength = Math.max(0, ...candidates.map((entry) => entry.finalStrength));
  const targets =
    maxStrength > 0 ? candidates.filter((entry) => entry.finalStrength === maxStrength).map(toScorchTarget) : [];

  return {
    outcome: targets.length > 0 ? "destroyed" : "no_targets",
    oppositeSeatId,
    rowTotal,
    targets,
  };
};
