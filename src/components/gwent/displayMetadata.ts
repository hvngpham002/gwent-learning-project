import {
  CATALOG_ABILITY_METADATA,
  CATALOG_LEADER_ABILITY_METADATA,
  type CatalogAbilityId,
  type CatalogCardKind,
  type CatalogFaction,
  type CatalogLeaderAbilityId,
  type CatalogRow,
  isCatalogAbilityId,
  isCatalogLeaderAbilityId,
} from "@/game/catalog";

export interface FactionDisplay {
  id: CatalogFaction;
  name: string;
  short: string;
  color: string;
  accent: string;
  glyph: string;
}

export interface RowDisplay {
  id: CatalogRow;
  name: string;
  glyph: string;
  pathD: string;
}

export interface AbilityDisplay {
  id: string;
  name: string;
  glyph: string;
  status: "implemented" | "planned" | "placeholder";
  description?: string;
}

export interface LeaderAbilityDisplay {
  id: string;
  name: string;
  status: "implemented" | "planned" | "placeholder";
  description?: string;
}

export interface CardKindDisplay {
  id: CatalogCardKind;
  name: string;
  badge: string;
}

const FACTION_DISPLAY: Record<CatalogFaction, FactionDisplay> = {
  northern_realms: {
    id: "northern_realms",
    name: "Northern Realms",
    short: "NR",
    color: "#2a4a7a",
    accent: "#7aa6d8",
    glyph: "crown",
  },
  nilfgaard: {
    id: "nilfgaard",
    name: "Nilfgaard",
    short: "NG",
    color: "#1a1a1a",
    accent: "#c9a050",
    glyph: "sun",
  },
  monsters: {
    id: "monsters",
    name: "Monsters",
    short: "MN",
    color: "#5a2030",
    accent: "#c47080",
    glyph: "fang",
  },
  scoiatael: {
    id: "scoiatael",
    name: "Scoia'tael",
    short: "ST",
    color: "#4a6a30",
    accent: "#a8c870",
    glyph: "leaf",
  },
  skellige: {
    id: "skellige",
    name: "Skellige",
    short: "SK",
    color: "#6a5030",
    accent: "#d8b06a",
    glyph: "horn",
  },
  neutral: {
    id: "neutral",
    name: "Neutral",
    short: "N",
    color: "#5a5a5a",
    accent: "#bababa",
    glyph: "star",
  },
};

const UNKNOWN_FACTION_DISPLAY: FactionDisplay = {
  id: "neutral",
  name: "Unknown faction",
  short: "?",
  color: "#5a5a5a",
  accent: "#bababa",
  glyph: "star",
};

const ROW_DISPLAY: Record<CatalogRow, RowDisplay> = {
  close: {
    id: "close",
    name: "Close Combat",
    glyph: "⚔",
    pathD: "M3 14 L9 4 L15 14 Z",
  },
  ranged: {
    id: "ranged",
    name: "Ranged",
    glyph: "➶",
    pathD: "M3 9 Q9 3 15 9 Q9 15 3 9 Z",
  },
  siege: {
    id: "siege",
    name: "Siege",
    glyph: "⚒",
    pathD: "M3 13 L3 8 L9 4 L15 8 L15 13 Z",
  },
};

const UNKNOWN_ROW_DISPLAY: RowDisplay = {
  id: "close",
  name: "Unknown row",
  glyph: "·",
  pathD: "M3 12 L15 12",
};

const ABILITY_GLYPH: Record<CatalogAbilityId, string> = {
  tight_bond: "∞",
  medic: "✚",
  morale_boost: "↑",
  spy: "◐",
  muster: "☷",
  muster_roach: "☷",
  agile: "↔",
  avenger: "✜",
  scorch_close: "✦",
  scorch: "✦",
  skellige_storm: "❅",
  commanders_horn: "◊",
  decoy: "⇄",
  frost: "❄",
  fog: "☁",
  rain: "☂",
  clear_weather: "☼",
  mardroeme: "✿",
  berserker: "⚔",
  summon: "✶",
  none: "",
};

const KIND_DISPLAY: Record<CatalogCardKind, CardKindDisplay> = {
  unit: { id: "unit", name: "Unit", badge: "UNIT" },
  hero: { id: "hero", name: "Hero", badge: "HERO" },
  special: { id: "special", name: "Special", badge: "SPECIAL" },
};

const UNKNOWN_KIND_DISPLAY: CardKindDisplay = {
  id: "unit",
  name: "Unknown",
  badge: "·",
};

export const getFactionDisplay = (id: string | null | undefined): FactionDisplay => {
  if (id && id in FACTION_DISPLAY) {
    return FACTION_DISPLAY[id as CatalogFaction];
  }
  return UNKNOWN_FACTION_DISPLAY;
};

export const getRowDisplay = (id: string | null | undefined): RowDisplay => {
  if (id && id in ROW_DISPLAY) {
    return ROW_DISPLAY[id as CatalogRow];
  }
  return UNKNOWN_ROW_DISPLAY;
};

export const getCardKindDisplay = (id: string | null | undefined): CardKindDisplay => {
  if (id && id in KIND_DISPLAY) {
    return KIND_DISPLAY[id as CatalogCardKind];
  }
  return UNKNOWN_KIND_DISPLAY;
};

const titleCaseFromId = (id: string) =>
  id
    .split("_")
    .filter(Boolean)
    .map((part) => `${part[0]?.toUpperCase() ?? ""}${part.slice(1)}`)
    .join(" ");

export const getAbilityDisplay = (id: string | null | undefined): AbilityDisplay => {
  if (id && isCatalogAbilityId(id)) {
    const meta = CATALOG_ABILITY_METADATA[id];
    return {
      id: meta.id,
      name: meta.name,
      glyph: ABILITY_GLYPH[meta.id] ?? "·",
      status: meta.status,
      description: meta.description,
    };
  }
  if (id && id.length > 0) {
    return {
      id,
      name: titleCaseFromId(id),
      glyph: "·",
      status: "placeholder",
    };
  }
  return {
    id: "none",
    name: "No ability",
    glyph: "",
    status: "implemented",
  };
};

export const getLeaderAbilityDisplay = (id: string | null | undefined): LeaderAbilityDisplay => {
  if (id && isCatalogLeaderAbilityId(id)) {
    const meta = CATALOG_LEADER_ABILITY_METADATA[id];
    return {
      id: meta.id,
      name: meta.name,
      status: meta.status,
      description: meta.description,
    };
  }
  if (id && id.length > 0) {
    return {
      id,
      name: titleCaseFromId(id),
      status: "placeholder",
    };
  }
  return {
    id: "unknown",
    name: "Unknown leader ability",
    status: "placeholder",
  };
};

export const listFactionDisplays = (): readonly FactionDisplay[] => Object.values(FACTION_DISPLAY);

export const listRowDisplays = (): readonly RowDisplay[] => Object.values(ROW_DISPLAY);

export type { CatalogFaction, CatalogRow, CatalogAbilityId, CatalogCardKind, CatalogLeaderAbilityId };
