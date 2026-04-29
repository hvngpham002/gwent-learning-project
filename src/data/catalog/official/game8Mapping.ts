import {
  CATALOG_ABILITY_METADATA,
  CATALOG_LEADER_ABILITY_METADATA,
  type CatalogAbilityId,
  type CatalogCardKind,
  type CatalogCardSource,
  type CatalogFaction,
  type CatalogLeaderAbilityId,
  type CatalogLeaderSource,
  type CatalogRow,
  isCatalogAbilityId,
  isCatalogLeaderAbilityId,
} from "@/game/catalog";

import {
  monstersCatalogCards,
  neutralCatalogCards,
  nilfgaardCatalogCards,
  northernRealmsCatalogCards,
  scoiataelCatalogCards,
  skelligeCatalogCards,
} from "../cards";
import {
  monstersCatalogLeaders,
  nilfgaardCatalogLeaders,
  northernRealmsCatalogLeaders,
  scoiataelCatalogLeaders,
  skelligeCatalogLeaders,
} from "../leaders";
import { game8PublicImagePaths } from "./game8PublicImagePaths";
import type {
  OfficialAcquisitionRow,
  OfficialCandidateBuildResult,
  OfficialCardCandidate,
  OfficialImageCandidate,
  OfficialImageCrop,
  OfficialLeaderCandidate,
  OfficialPortingStatus,
  OfficialPortingSummary,
  OfficialScrapeCountSummary,
} from "./officialTypes";

interface RawGame8LeaderAbility {
  readonly id?: unknown;
  readonly status?: unknown;
}

interface RawGame8UniqueCard {
  readonly suggestedSourceId?: unknown;
  readonly name?: unknown;
  readonly faction?: unknown;
  readonly unitType?: unknown;
  readonly kind?: unknown;
  readonly strength?: unknown;
  readonly rows?: unknown;
  readonly abilities?: unknown;
  readonly leaderAbility?: RawGame8LeaderAbility | null;
  readonly tags?: unknown;
  readonly copyCount?: unknown;
  readonly deckLimitSuggestion?: unknown;
  readonly suggestedLocalImagePath?: unknown;
  readonly game8ImageUrl?: unknown;
  readonly game8Urls?: unknown;
  readonly copyIds?: unknown;
  readonly acquisitionRows?: unknown;
  readonly catalogCandidate?: unknown;
  readonly leaderCandidate?: unknown;
}

interface RawGame8Instance {
  readonly suggestedSourceId?: unknown;
  readonly name?: unknown;
  readonly game8?: {
    readonly leaderEffect?: unknown;
  };
}

interface RawGame8Scrape {
  readonly schemaVersion?: unknown;
  readonly retrievedAt?: unknown;
  readonly source?: unknown;
  readonly counts?: unknown;
  readonly uniqueCards?: unknown;
  readonly instances?: unknown;
}

const currentCards: readonly CatalogCardSource[] = [
  ...neutralCatalogCards,
  ...northernRealmsCatalogCards,
  ...nilfgaardCatalogCards,
  ...monstersCatalogCards,
  ...scoiataelCatalogCards,
  ...skelligeCatalogCards,
];

const currentLeaders: readonly CatalogLeaderSource[] = [
  ...northernRealmsCatalogLeaders,
  ...nilfgaardCatalogLeaders,
  ...monstersCatalogLeaders,
  ...scoiataelCatalogLeaders,
  ...skelligeCatalogLeaders,
];

const publicImagePathSet = new Set<string>(game8PublicImagePaths);

const defaultCrop: OfficialImageCrop = {
  fit: "contain",
  scale: 1,
  offsetX: 0,
  offsetY: 0,
  cropBottomPx: 15,
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const stringValue = (value: unknown, fallback = ""): string =>
  typeof value === "string" ? value : fallback;

const stringArray = (value: unknown): readonly string[] =>
  Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string") : [];

const integerValue = (value: unknown, fallback: number): number =>
  Number.isInteger(value) ? Number(value) : fallback;

const normalizeNameKey = (value: string): string =>
  value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/f[\s-]*king/g, "fucking")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");

const currentLookupKey = (faction: string, name: string): string =>
  `${faction}:${normalizeNameKey(name)}`;

const currentCardByFactionAndName = new Map(
  currentCards.map((card) => [currentLookupKey(card.faction, card.name), card]),
);

const currentLeaderByFactionAndName = new Map(
  currentLeaders.map((leader) => [currentLookupKey(leader.faction, leader.name), leader]),
);

const slugFileName = (name: string): string => {
  const slug = name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_");
  return `${slug || "Unknown"}.png`;
};

const kindFolder = (kind: CatalogCardKind | "leader", tags: readonly string[]): string => {
  if (kind === "leader") return "leaders";
  if (kind === "hero") return "heroes";
  if (kind === "special" && tags.includes("weather")) return "weather";
  if (kind === "special") return "specials";
  return "units";
};

const preferredImagePath = (
  raw: Pick<RawGame8UniqueCard, "suggestedLocalImagePath" | "name" | "faction" | "kind" | "tags">,
): string => {
  const suggested = stringValue(raw.suggestedLocalImagePath).trim();
  if (suggested.startsWith("/images/")) {
    return suggested;
  }
  const faction = stringValue(raw.faction, "neutral");
  const name = stringValue(raw.name, "Unknown");
  const kind = stringValue(raw.kind, "unit") as CatalogCardKind | "leader";
  const tags = stringArray(raw.tags);
  return `/images/${faction}/${kindFolder(kind, tags)}/${slugFileName(name)}`;
};

const acquisitionRows = (value: unknown): readonly OfficialAcquisitionRow[] =>
  Array.isArray(value)
    ? value.flatMap((row) => {
        if (!isRecord(row)) return [];
        return [
          {
            method: stringValue(row.method),
            location: stringValue(row.location),
            region: stringValue(row.region),
            availability: stringValue(row.availability),
            quest: stringValue(row.quest),
            questUrl: stringValue(row.questUrl),
          },
        ];
      })
    : [];

const catalogFaction = (value: unknown): CatalogFaction => {
  const faction = stringValue(value, "neutral");
  if (
    faction === "northern_realms" ||
    faction === "nilfgaard" ||
    faction === "monsters" ||
    faction === "scoiatael" ||
    faction === "skellige" ||
    faction === "neutral"
  ) {
    return faction;
  }
  return "neutral";
};

const nonNeutralFaction = (value: unknown): Exclude<CatalogFaction, "neutral"> => {
  const faction = catalogFaction(value);
  return faction === "neutral" ? "northern_realms" : faction;
};

const catalogKind = (value: unknown): CatalogCardKind | "leader" => {
  const kind = stringValue(value, "unit");
  if (kind === "unit" || kind === "hero" || kind === "special" || kind === "leader") {
    return kind;
  }
  return "unit";
};

const catalogRows = (value: unknown): readonly CatalogRow[] =>
  stringArray(value).flatMap((row) =>
    row === "close" || row === "ranged" || row === "siege" ? [row] : [],
  );

const catalogAbilities = (value: unknown, kind: CatalogCardKind): readonly CatalogAbilityId[] => {
  const abilities = stringArray(value).flatMap((ability) =>
    isCatalogAbilityId(ability) ? [ability] : [],
  );
  if (abilities.length === 0 && (kind === "unit" || kind === "hero")) {
    return ["none"];
  }
  if (abilities.length === 0 && kind === "special") {
    return ["none"];
  }
  return abilities.filter((ability) => ability !== "none").length === 0 ? ["none"] : abilities;
};

const catalogTags = (rawTags: unknown, kind: CatalogCardKind): readonly string[] => {
  const tags = stringArray(rawTags);
  const withKind = kind === "hero" && !tags.includes("hero") ? [...tags, "hero"] : tags;
  return kind === "unit" && withKind.length === 0 ? ["non_hero"] : withKind;
};

const statusFromIssues = (issues: readonly string[], imageExists: boolean): OfficialPortingStatus => {
  if (issues.some((issue) => issue.startsWith("leader_"))) {
    return "needs_leader_rule";
  }
  if (issues.some((issue) => issue.startsWith("ability_") || issue.startsWith("rule_gap:"))) {
    return "needs_rule";
  }
  if (
    issues.some(
      (issue) =>
        issue.startsWith("catalog_split_required:") ||
        issue.startsWith("transform_link_required:"),
    )
  ) {
    return "needs_review";
  }
  if (!imageExists) {
    return "needs_image";
  }
  if (issues.length > 0) {
    return "needs_review";
  }
  return "ready_for_catalog";
};

const imageCandidate = (
  sourceId: string,
  path: string,
  game8ImageUrl?: string,
): OfficialImageCandidate => ({
  sourceId,
  preferredImagePath: path,
  game8ImageUrl,
  existsInPublicImages: publicImagePathSet.has(path),
  crop: defaultCrop,
  approved: false,
});

const cardIssues = (
  source: CatalogCardSource,
  imageExists: boolean,
  copyCount: number,
  rawStrength: number,
): readonly string[] => {
  const issues: string[] = [];
  if (!imageExists) {
    issues.push("image_missing: preferred image path is not present under public/images.");
  }
  source.abilities.forEach((ability) => {
    const metadata = CATALOG_ABILITY_METADATA[ability];
    if (!metadata) {
      issues.push(`ability_unknown:${ability}`);
      return;
    }
    if (ability !== "none" && metadata.status !== "implemented") {
      issues.push(`ability_status:${ability}:${metadata.status}`);
    }
    if (ability === "berserker") {
      const linkedCount = source.linkedSourceIds?.length ?? 0;
      if (linkedCount === 0) {
        issues.push(
          "transform_link_required:berserker: official Berserker scrape candidates need a side-deck transform link before catalog promotion.",
        );
      }
    }
  });
  const isUnitOrHero = source.kind === "unit" || source.kind === "hero";
  if (isUnitOrHero && rawStrength <= 0 && source.abilities.includes("berserker")) {
    issues.push(
      "catalog_split_required:berserker: official Berserker scrape candidates may be combined base/replacement rows; split into separate sources before catalog promotion.",
    );
  }
  if (isUnitOrHero && rawStrength <= 0 && copyCount > 1 && !source.abilities.includes("berserker")) {
    issues.push(
      "catalog_split_required:zero_strength: scraped strength is null/zero with multiple copies; review base/replacement split before catalog promotion.",
    );
  }
  if (source.sourceId === "neutral.cow-bovine-defense-force") {
    issues.push(
      "catalog_split_required:avenger: combined Cow/Bovine Defense Force scrape candidate is split in the permanent catalog as `neutral.cow` and `neutral.bovine-defense-force`.",
    );
    issues.push(
      "rule_gap:avenger: Avenger remains a planned ability; the combined candidate cannot be cleanly promoted until Avenger lands.",
    );
  }
  return issues;
};

const leaderIssues = (
  mappedAbilityId: CatalogLeaderAbilityId | undefined,
  pendingAbilityId: string | undefined,
  imageExists: boolean,
): readonly string[] => {
  const issues: string[] = [];
  if (!imageExists) {
    issues.push("image_missing: preferred image path is not present under public/images.");
  }
  if (!mappedAbilityId) {
    issues.push(`leader_ability_unmapped:${pendingAbilityId ?? "unknown"}`);
    return issues;
  }
  const metadata = CATALOG_LEADER_ABILITY_METADATA[mappedAbilityId];
  if (metadata.status !== "implemented") {
    issues.push(`leader_ability_status:${mappedAbilityId}:${metadata.status}`);
  }
  if (mappedAbilityId !== "clear_weather") {
    issues.push(`leader_engine_gap:${mappedAbilityId}: only clear_weather is executable now.`);
  }
  return issues;
};

const sourceWithUniqueId = (
  sourceId: string,
  used: Map<string, number>,
  issues: string[],
): string => {
  const count = used.get(sourceId) ?? 0;
  used.set(sourceId, count + 1);
  if (count === 0) {
    return sourceId;
  }
  const nextSourceId = `${sourceId}-${count + 1}`;
  issues.push(`source_id_conflict:${sourceId}: renamed staging candidate to ${nextSourceId}.`);
  return nextSourceId;
};

const scrapeCounts = (value: unknown): OfficialScrapeCountSummary => {
  const counts = isRecord(value) ? value : {};
  const objectValue = (field: string): Readonly<Record<string, number>> =>
    isRecord(counts[field])
      ? Object.fromEntries(
          Object.entries(counts[field]).flatMap(([key, count]) =>
            typeof count === "number" ? [[key, count]] : [],
          ),
        )
      : {};
  return {
    totalInstances: integerValue(counts.totalInstances, 0),
    uniqueCards: integerValue(counts.uniqueCards, 0),
    byFaction: objectValue("byFaction"),
    byKind: objectValue("byKind"),
    byUnitType: objectValue("byUnitType"),
    byAbility: objectValue("byAbility"),
    byLeaderAbilityStatus: objectValue("byLeaderAbilityStatus"),
  };
};

const scrapeSource = (value: unknown): Readonly<Record<string, string | number>> | undefined => {
  if (!isRecord(value)) return undefined;
  return Object.fromEntries(
    Object.entries(value).flatMap(([key, entry]) =>
      typeof entry === "string" || typeof entry === "number" ? [[key, entry]] : [],
    ),
  );
};

export const assertGame8ScrapeShape = (scrape: RawGame8Scrape): void => {
  const counts = scrapeCounts(scrape.counts);
  const uniqueCards = Array.isArray(scrape.uniqueCards) ? scrape.uniqueCards : [];
  const instances = Array.isArray(scrape.instances) ? scrape.instances : [];
  if (scrape.schemaVersion !== "game8-gwent-card-port-v1") {
    throw new Error("Game8 scrape schemaVersion must be game8-gwent-card-port-v1.");
  }
  if (
    counts.totalInstances !== 254 ||
    counts.uniqueCards !== 181 ||
    instances.length !== 254 ||
    uniqueCards.length !== 181
  ) {
    throw new Error(
      `Game8 scrape count mismatch: expected 254 instances and 181 unique cards, got ${instances.length} instances and ${uniqueCards.length} unique cards.`,
    );
  }
};

export const buildOfficialCandidatesFromGame8Scrape = (
  scrape: RawGame8Scrape,
): OfficialCandidateBuildResult => {
  assertGame8ScrapeShape(scrape);
  const uniqueCards = (Array.isArray(scrape.uniqueCards) ? scrape.uniqueCards : []) as RawGame8UniqueCard[];
  const instances = (Array.isArray(scrape.instances) ? scrape.instances : []) as RawGame8Instance[];
  const leaderEffectBySourceId = new Map(
    instances.flatMap((instance) => {
      const sourceId = stringValue(instance.suggestedSourceId);
      const effect = stringValue(instance.game8?.leaderEffect);
      return sourceId && effect ? [[sourceId, effect] as const] : [];
    }),
  );
  const usedCardSourceIds = new Map<string, number>();
  const usedLeaderSourceIds = new Map<string, number>();
  const sourceIdConflicts: string[] = [];
  const preservedCurrentSourceIds = new Set<string>();

  const cards: OfficialCardCandidate[] = [];
  const leaders: OfficialLeaderCandidate[] = [];
  const images: OfficialImageCandidate[] = [];

  uniqueCards.forEach((raw) => {
    const kind = catalogKind(raw.kind);
    const path = preferredImagePath(raw);
    const game8ImageUrl = stringValue(raw.game8ImageUrl) || undefined;
    const rawSourceId = stringValue(raw.suggestedSourceId, `${stringValue(raw.faction, "neutral")}.${slugFileName(stringValue(raw.name, "unknown")).replace(/\.png$/, "").toLowerCase()}`);
    const name = stringValue(raw.name, "Unknown");
    const faction = catalogFaction(raw.faction);

    if (kind === "leader") {
      const matched = currentLeaderByFactionAndName.get(currentLookupKey(faction, name));
      const pendingAbilityId = stringValue(raw.leaderAbility?.id) || undefined;
      const rawMappedAbility = isCatalogLeaderAbilityId(pendingAbilityId) ? pendingAbilityId : undefined;
      const mappedAbilityId = matched?.ability ?? rawMappedAbility;
      const issues: string[] = [];
      const sourceId = sourceWithUniqueId(matched?.sourceId ?? rawSourceId, usedLeaderSourceIds, issues);
      if (matched) {
        preservedCurrentSourceIds.add(matched.sourceId);
      }
      const image = imageCandidate(sourceId, path, game8ImageUrl);
      const leaderSpecificIssues = leaderIssues(
        mappedAbilityId,
        pendingAbilityId,
        image.existsInPublicImages,
      );
      const portingIssues = [...issues, ...leaderSpecificIssues];
      sourceIdConflicts.push(...issues);
      leaders.push({
        sourceId,
        name,
        faction: nonNeutralFaction(raw.faction),
        mappedAbilityId,
        pendingAbilityId,
        game8Urls: stringArray(raw.game8Urls),
        game8ImageUrl,
        leaderEffectText: leaderEffectBySourceId.get(rawSourceId),
        portingStatus: statusFromIssues(portingIssues, image.existsInPublicImages),
        portingIssues,
        image: path,
        matchedCurrentSourceId: matched?.sourceId,
      });
      images.push(image);
      return;
    }

    const cardKind = kind;
    const matched = currentCardByFactionAndName.get(currentLookupKey(faction, name));
    const issues: string[] = [];
    const sourceId = sourceWithUniqueId(matched?.sourceId ?? rawSourceId, usedCardSourceIds, issues);
    if (matched) {
      preservedCurrentSourceIds.add(matched.sourceId);
    }
    const image = imageCandidate(sourceId, path, game8ImageUrl);
    const rawStrength = integerValue(raw.strength, 0);
    const rawCopyCount = integerValue(raw.copyCount, 1);
    const matchedLinkedSourceIds = matched?.linkedSourceIds ? [...matched.linkedSourceIds] : undefined;
    const source: CatalogCardSource = {
      sourceId,
      name,
      faction,
      kind: cardKind,
      strength: cardKind === "special" ? 0 : rawStrength,
      rows: [...catalogRows(raw.rows)],
      abilities: [...catalogAbilities(raw.abilities, cardKind)],
      tags: [...catalogTags(raw.tags, cardKind)],
      deckLimit: integerValue(raw.deckLimitSuggestion, Math.max(1, rawCopyCount)),
      image: path,
      ...(matchedLinkedSourceIds ? { linkedSourceIds: matchedLinkedSourceIds } : {}),
    };
    const cardSpecificIssues = cardIssues(source, image.existsInPublicImages, rawCopyCount, rawStrength);
    const portingIssues = [...issues, ...cardSpecificIssues];
    sourceIdConflicts.push(...issues);
    cards.push({
      source,
      copyCount: integerValue(raw.copyCount, 1),
      game8CopyIds: stringArray(raw.copyIds),
      game8Urls: stringArray(raw.game8Urls),
      game8ImageUrl,
      acquisitionRows: acquisitionRows(raw.acquisitionRows),
      portingStatus: statusFromIssues(portingIssues, image.existsInPublicImages),
      portingIssues,
      matchedCurrentSourceId: matched?.sourceId,
    });
    images.push(image);
  });

  const unsupportedAbilityCounts: Record<string, number> = {};
  cards.forEach((candidate) => {
    candidate.source.abilities.forEach((ability) => {
      if (ability === "none") return;
      const metadata = CATALOG_ABILITY_METADATA[ability];
      if (metadata.status !== "implemented") {
        unsupportedAbilityCounts[ability] = (unsupportedAbilityCounts[ability] ?? 0) + candidate.copyCount;
      }
    });
  });

  const unsupportedLeaderAbilityCounts: Record<string, number> = {};
  leaders.forEach((leader) => {
    const key = leader.mappedAbilityId ?? leader.pendingAbilityId ?? "unknown";
    if (!leader.mappedAbilityId || leader.mappedAbilityId !== "clear_weather") {
      unsupportedLeaderAbilityCounts[key] = (unsupportedLeaderAbilityCounts[key] ?? 0) + 1;
    }
  });

  const summary: OfficialPortingSummary = {
    schemaVersion: "game8-gwent-card-port-v1",
    retrievedAt: stringValue(scrape.retrievedAt) || undefined,
    source: scrapeSource(scrape.source),
    counts: scrapeCounts(scrape.counts),
    cardCandidateCount: cards.length,
    leaderCandidateCount: leaders.length,
    totalCandidateCount: cards.length + leaders.length,
    totalPhysicalCopies: cards.reduce((total, candidate) => total + candidate.copyCount, 0) + leaders.length,
    missingImageCount: images.filter((image) => !image.existsInPublicImages).length,
    readyForCatalogCount:
      cards.filter((candidate) => candidate.portingStatus === "ready_for_catalog").length +
      leaders.filter((candidate) => candidate.portingStatus === "ready_for_catalog").length,
    ruleGapCount: cards.filter((candidate) => candidate.portingStatus === "needs_rule").length,
    leaderRuleGapCount: leaders.filter((candidate) => candidate.portingStatus === "needs_leader_rule").length,
    needsReviewCount:
      cards.filter((candidate) => candidate.portingStatus === "needs_review").length +
      leaders.filter((candidate) => candidate.portingStatus === "needs_review").length,
    preservedCurrentSourceIds: [...preservedCurrentSourceIds].sort(),
    sourceIdConflicts,
    unsupportedAbilityCounts,
    unsupportedLeaderAbilityCounts,
  };

  return { cards, leaders, images, summary };
};
