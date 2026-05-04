import type { CatalogAbilityId, CatalogCardSource, CatalogLeaderSource, CatalogRow } from "@/game/catalog";

import { isLeaderSuppressedThisRound } from "./leaderCancel";
import type { CardInstanceId, MatchState, SeatId } from "./types";

export type WeatherPolicy = "normal" | "king_bran";
export type WeatherEffectId = "frost" | "fog" | "rain" | "skellige_storm";

export type RowHornPolicyBySeat = Partial<Record<SeatId, Partial<Record<CatalogRow, boolean>>>>;

export type DoubleSpiesPolicyBySeat = Partial<Record<SeatId, boolean>>;

export interface CalculateScoresInput {
  state: MatchState;
  catalogCards: readonly CatalogCardSource[];
  catalogLeaders?: readonly CatalogLeaderSource[];
  weatherPolicyBySeat?: Partial<Record<SeatId, WeatherPolicy>>;
  rowHornPolicyBySeat?: RowHornPolicyBySeat;
  doubleSpiesPolicyBySeat?: DoubleSpiesPolicyBySeat;
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
  spyMultiplier: number;
  afterSpyMultiplier: number;
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
  spyMultiplier: 1,
  afterSpyMultiplier: 0,
  tightBondMultiplier: 1,
  afterTightBond: 0,
  moraleBonus: 0,
  afterMorale: 0,
  hornMultiplier: 1,
  finalStrength: 0,
  eligibleForScorch: false,
  modifiers: ["diagnostic:missing"],
});

export const getWeatherPolicyBySeat = (
  state: MatchState,
  catalogLeaders: readonly CatalogLeaderSource[],
): Partial<Record<SeatId, WeatherPolicy>> => {
  const lookup = new Map(catalogLeaders.map((leader) => [leader.sourceId, leader]));
  const policy: Partial<Record<SeatId, WeatherPolicy>> = {};
  SEATS.forEach((seatId) => {
    const leaderSourceId = state.seats[seatId]?.leaderSourceId;
    if (!leaderSourceId) {
      return;
    }
    if (isLeaderSuppressedThisRound({ state, seatId })) {
      return;
    }
    const leader = lookup.get(leaderSourceId);
    if (leader?.ability === "weather_half_penalty") {
      policy[seatId] = "king_bran";
    }
  });
  return policy;
};

const ROW_HORN_LEADER_ABILITY_TO_ROW: Partial<Record<CatalogLeaderSource["ability"], CatalogRow>> = {
  double_close: "close",
  double_ranged: "ranged",
  double_siege: "siege",
};

export const getRowHornPolicyBySeat = (
  state: MatchState,
  catalogLeaders: readonly CatalogLeaderSource[],
): RowHornPolicyBySeat => {
  const lookup = new Map(catalogLeaders.map((leader) => [leader.sourceId, leader]));
  const policy: RowHornPolicyBySeat = {};
  SEATS.forEach((seatId) => {
    const leaderSourceId = state.seats[seatId]?.leaderSourceId;
    if (!leaderSourceId) {
      return;
    }
    if (isLeaderSuppressedThisRound({ state, seatId })) {
      return;
    }
    const leader = lookup.get(leaderSourceId);
    if (!leader) {
      return;
    }
    const row = ROW_HORN_LEADER_ABILITY_TO_ROW[leader.ability];
    if (!row) {
      return;
    }
    policy[seatId] = { [row]: true };
  });
  return policy;
};

export const getDoubleSpiesPolicyBySeat = (
  state: MatchState,
  catalogLeaders: readonly CatalogLeaderSource[],
): DoubleSpiesPolicyBySeat => {
  const lookup = new Map(catalogLeaders.map((leader) => [leader.sourceId, leader]));
  const policy: DoubleSpiesPolicyBySeat = {};
  SEATS.forEach((seatId) => {
    const leaderSourceId = state.seats[seatId]?.leaderSourceId;
    if (!leaderSourceId) {
      return;
    }
    if (isLeaderSuppressedThisRound({ state, seatId })) {
      return;
    }
    const leader = lookup.get(leaderSourceId);
    if (leader?.ability === "double_spies") {
      policy[seatId] = true;
    }
  });
  return policy;
};

export const calculateScores = ({
  state,
  catalogCards,
  catalogLeaders,
  weatherPolicyBySeat,
  rowHornPolicyBySeat,
  doubleSpiesPolicyBySeat,
}: CalculateScoresInput): MatchScoreBreakdown => {
  const catalogLookup = createCardLookup(catalogCards);
  const diagnostics: ScoringDiagnostic[] = [];
  const activeWeatherEffects = getActiveWeatherEffects(state, catalogLookup, diagnostics);
  const rowTotalsBySeat = createEmptySeatTotals();
  const totalBySeat: Record<SeatId, number> = { seat_a: 0, seat_b: 0 };
  const cards: CardScoreEntry[] = [];
  const derivedPolicy = catalogLeaders ? getWeatherPolicyBySeat(state, catalogLeaders) : {};
  const policyBySeat: Partial<Record<SeatId, WeatherPolicy>> = {
    ...derivedPolicy,
    ...(weatherPolicyBySeat ?? {}),
  };
  const derivedRowHornPolicy = catalogLeaders ? getRowHornPolicyBySeat(state, catalogLeaders) : {};
  const rowHornPolicy: RowHornPolicyBySeat = {
    ...derivedRowHornPolicy,
    ...(rowHornPolicyBySeat ?? {}),
  };
  const derivedDoubleSpiesPolicy = catalogLeaders
    ? getDoubleSpiesPolicyBySeat(state, catalogLeaders)
    : {};
  const doubleSpiesPolicy: DoubleSpiesPolicyBySeat = {
    ...derivedDoubleSpiesPolicy,
    ...(doubleSpiesPolicyBySeat ?? {}),
  };
  const doubleSpiesActive = SEATS.some((seatId) => doubleSpiesPolicy[seatId] === true);

  SEATS.forEach((seatId) => {
    ROWS.forEach((row) => {
      const rowState = state.seats[seatId].board[row];
      const rowSources = rowState.units.map((cardId) => {
        const instance = state.cardsById[cardId];
        return instance ? catalogLookup.get(instance.sourceId) : undefined;
      });
      const moraleSourceCount = rowSources.filter(
        (source) =>
          (source?.kind === "unit" || source?.kind === "hero") && hasAbility(source, "morale_boost"),
      ).length;
      const specialHornSourceId = rowState.horn;
      const unitHornSourceIds = rowState.units.filter((cardId) => {
        const source = rowSources[rowState.units.indexOf(cardId)];
        return (
          (source?.kind === "unit" || source?.kind === "hero") && hasAbility(source, "commanders_horn")
        );
      });
      const physicalHornSourceId = specialHornSourceId ?? unitHornSourceIds[0] ?? null;
      const hasPhysicalHorn = Boolean(physicalHornSourceId);
      const leaderHornActive = Boolean(rowHornPolicy[seatId]?.[row]);

      if ((specialHornSourceId ? 1 : 0) + unitHornSourceIds.length > 1) {
        diagnostics.push({
          code: "multiple_horn_sources",
          message: "Multiple horn sources found on a row; only one horn modifier was applied.",
          cardId: physicalHornSourceId ?? undefined,
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
          const policy = policyBySeat[seatId] ?? "normal";
          afterWeather = getWeatheredStrength(printedStrength, policy);
          modifiers.push(policy === "king_bran" ? "weather:king_bran" : "weather");
        }

        const isSpy = hasAbility(source, "spy");
        const spyMultiplier =
          isUnit && !isHero && isSpy && doubleSpiesActive ? 2 : 1;
        if (spyMultiplier > 1) {
          modifiers.push("leader_double_spies");
        }
        const afterSpyMultiplier = afterWeather * spyMultiplier;

        const tightBondMultiplier =
          isUnit && !isHero && hasAbility(source, "tight_bond")
            ? Math.max(1, countTightBondGroup(state, catalogLookup, seatId, source.sourceId))
            : 1;
        if (tightBondMultiplier > 1) {
          modifiers.push("tight_bond");
        }
        const afterTightBond = afterSpyMultiplier * tightBondMultiplier;

        const moraleBonus =
          isUnit && !isHero ? moraleSourceCount - (hasAbility(source, "morale_boost") ? 1 : 0) : 0;
        if (moraleBonus > 0) {
          modifiers.push("morale_boost");
        }
        const afterMorale = afterTightBond + moraleBonus;

        const physicalHornAppliesToCard =
          isUnit &&
          !isHero &&
          hasPhysicalHorn &&
          !(physicalHornSourceId === cardId && hasAbility(source, "commanders_horn"));
        const leaderHornAppliesToCard = isUnit && !isHero && leaderHornActive && !hasPhysicalHorn;
        const hornMultiplier = physicalHornAppliesToCard || leaderHornAppliesToCard ? 2 : 1;
        if (physicalHornAppliesToCard) {
          modifiers.push("commanders_horn");
        } else if (leaderHornAppliesToCard) {
          modifiers.push("leader_horn");
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
          spyMultiplier,
          afterSpyMultiplier,
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

export interface UnitScorchRowResult {
  outcome: "destroyed" | "no_targets" | "below_threshold";
  oppositeSeatId: SeatId;
  row: CatalogRow;
  rowTotal: number;
  targets: ScorchTarget[];
}

export const findUnitScorchRowTargets = (
  breakdown: MatchScoreBreakdown,
  sourceController: SeatId,
  row: CatalogRow,
): UnitScorchRowResult => {
  const oppositeSeatId = opponentOf(sourceController);
  const rowTotal = breakdown.rowTotalsBySeat[oppositeSeatId][row];

  if (rowTotal < 10) {
    return {
      outcome: "below_threshold",
      oppositeSeatId,
      row,
      rowTotal,
      targets: [],
    };
  }

  const candidates = breakdown.cards.filter(
    (entry) => entry.seatId === oppositeSeatId && entry.row === row && entry.eligibleForScorch,
  );
  const maxStrength = Math.max(0, ...candidates.map((entry) => entry.finalStrength));
  const targets =
    maxStrength > 0
      ? candidates.filter((entry) => entry.finalStrength === maxStrength).map(toScorchTarget)
      : [];

  return {
    outcome: targets.length > 0 ? "destroyed" : "no_targets",
    oppositeSeatId,
    row,
    rowTotal,
    targets,
  };
};

export const findUnitScorchCloseTargets = (
  breakdown: MatchScoreBreakdown,
  sourceController: SeatId,
): UnitScorchCloseResult => {
  const result = findUnitScorchRowTargets(breakdown, sourceController, "close");
  return {
    outcome: result.outcome,
    oppositeSeatId: result.oppositeSeatId,
    rowTotal: result.rowTotal,
    targets: result.targets,
  };
};
