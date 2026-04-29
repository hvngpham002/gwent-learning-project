// Manifest of official Game8 non-leader catalog promotion (cBp4 + cBp4.1).
// Records which scrape candidates were directly promoted, which were split into
// multiple permanent catalog source records, which were deferred, and the resulting
// permanent catalog source counts by faction and kind.
//
// This module is data-only. It does not import the Game8 scrape JSON or the cBp3
// staging candidate arrays at runtime. Tests cross-check the manifest against the
// staging exports.

export interface OfficialPromotionDeferredEntry {
  readonly sourceId: string;
  readonly reasons: readonly string[];
}

export interface OfficialPromotionSplitResolution {
  readonly originalSourceId: string;
  readonly catalogSourceIds: readonly string[];
  readonly reasons: readonly string[];
}

export interface OfficialPromotionDuplicateResolution {
  readonly originalSourceId: string;
  readonly catalogSourceId: string;
  readonly reasons: readonly string[];
}

export interface OfficialPromotionManifest {
  readonly directPromotedCandidateCount: number;
  readonly deferredCandidateCount: number;
  readonly promotedCatalogSourceCount: number;
  readonly directPromotedCandidateIds: readonly string[];
  readonly promotedCatalogSourceIds: readonly string[];
  readonly deferred: readonly OfficialPromotionDeferredEntry[];
  readonly splitResolutions: readonly OfficialPromotionSplitResolution[];
  readonly duplicateResolutions: readonly OfficialPromotionDuplicateResolution[];
  readonly countsByFaction: Readonly<Record<string, number>>;
  readonly countsByKind: Readonly<Record<string, number>>;
}

const splitResolutions: readonly OfficialPromotionSplitResolution[] = [
  {
    originalSourceId: "skellige.berserker-vildkaarl",
    catalogSourceIds: ["skellige.berserker", "skellige.vildkaarl"],
    reasons: [
      "transform_link_required:berserker: combined base/replacement scrape row split into a base Berserker and a side-deck Vildkaarl replacement linked through linkedSourceIds[0].",
      "catalog_split_required:berserker: split into separate base/replacement catalog source records.",
    ],
  },
  {
    originalSourceId: "skellige.young-berserker-young-vildkaarl",
    catalogSourceIds: ["skellige.young-berserker", "skellige.young-vildkaarl"],
    reasons: [
      "transform_link_required:berserker: combined base/replacement scrape row split into a base Young Berserker and a side-deck Young Vildkaarl replacement linked through linkedSourceIds[0].",
      "catalog_split_required:berserker: split into separate base/replacement catalog source records.",
    ],
  },
];

const deferred: readonly OfficialPromotionDeferredEntry[] = [
  {
    sourceId: "neutral.cow-bovine-defense-force",
    reasons: [
      "catalog_split_required:avenger: combined Cow/Bovine Defense Force scrape candidate is already represented in the permanent catalog as the legacy split records `neutral.cow` and `neutral.bovine-defense-force`.",
      "rule_gap:avenger: Avenger remains a planned ability, so the combined candidate cannot be cleanly promoted until Avenger lands.",
    ],
  },
];

const duplicateResolutions: readonly OfficialPromotionDuplicateResolution[] = [
  {
    originalSourceId: "nilfgaard.menno-coehorn",
    catalogSourceId: "nilfgaard.menno-coehoorn",
    reasons: [
      "duplicate_existing_current_source: spelling-mismatched Game8 source resolved to the existing Menno Coehoorn catalog record.",
    ],
  },
  {
    originalSourceId: "scoiatael.dwarven-skirmisher-2",
    catalogSourceId: "scoiatael.dwarven-skirmisher",
    reasons: [
      "duplicate_physical_copy: Game8 scrape split Dwarven Skirmisher copies into separate source rows, but the official card is one Close Combat Muster source with deckLimit 3.",
    ],
  },
];

// Original Game8 scrape candidate IDs that were directly promoted (i.e. ended up
// in `currentCatalogCards` as a single matching catalog source record). Excludes
// candidates resolved through `splitResolutions`, `duplicateResolutions`, and candidates listed in `deferred`.
const directPromotedCandidateIds: readonly string[] = [
  "monsters.arachas",
  "monsters.arachas-behemoth",
  "monsters.botchling",
  "monsters.celaeno-harpy",
  "monsters.cockatrice",
  "monsters.crone-brewess",
  "monsters.crone-weavess",
  "monsters.crone-whispess",
  "monsters.draug",
  "monsters.earth-elemental",
  "monsters.endrega",
  "monsters.fiend",
  "monsters.fire-elemental",
  "monsters.foglet",
  "monsters.forktail",
  "monsters.frightener",
  "monsters.gargoyle",
  "monsters.ghoul",
  "monsters.grave-hag",
  "monsters.griffin",
  "monsters.harpy",
  "monsters.ice-giant",
  "monsters.imlerith",
  "monsters.kayran",
  "monsters.leshen",
  "monsters.nekker",
  "monsters.plague-maiden",
  "monsters.toad",
  "monsters.vampire-bruxa",
  "monsters.vampire-ekimmara",
  "monsters.vampire-fleder",
  "monsters.vampire-garkain",
  "monsters.vampire-katakan",
  "monsters.werewolf",
  "monsters.wyvern",
  "neutral.biting-frost",
  "neutral.cirilla-fiona-elen-riannon",
  "neutral.clear-weather",
  "neutral.commanders-horn",
  "neutral.dandelion",
  "neutral.decoy",
  "neutral.emiel-regis-rohellec-terzieff",
  "neutral.gaunter-odimm",
  "neutral.gaunter-odimm-darkness",
  "neutral.geralt-of-rivia",
  "neutral.impenetrable-fog",
  "neutral.mysterious-elf",
  "neutral.olgierd-von-everec",
  "neutral.scorch",
  "neutral.skellige-storm",
  "neutral.torrential-rain",
  "neutral.triss-merigold",
  "neutral.vesemir",
  "neutral.villentretenmerth",
  "neutral.yennefer-of-vengerberg",
  "neutral.zoltan-chivay",
  "nilfgaard.albrich",
  "nilfgaard.assire-var-anahid",
  "nilfgaard.black-infantry-archer",
  "nilfgaard.cahir-mawr-dyffryn-aep-ceallach",
  "nilfgaard.cynthia",
  "nilfgaard.etolian-auxiliary-archers",
  "nilfgaard.fringilla-vigo",
  "nilfgaard.heavy-zerrikanian-fire-scorpion",
  "nilfgaard.impera-brigade-guard",
  "nilfgaard.letho-of-gulet",
  "nilfgaard.morteisen",
  "nilfgaard.morvran-voorhis",
  "nilfgaard.nausicaa-cavalry-rider",
  "nilfgaard.puttkammer",
  "nilfgaard.rainfarn",
  "nilfgaard.renuald-aep-matsen",
  "nilfgaard.rotten-mangonel",
  "nilfgaard.shilard-fitz-oesterlen",
  "nilfgaard.siege-engineer",
  "nilfgaard.siege-technician",
  "nilfgaard.stefan-skellen",
  "nilfgaard.sweers",
  "nilfgaard.tibor-eggebracht",
  "nilfgaard.vanhemar",
  "nilfgaard.vattier-de-rideaux",
  "nilfgaard.vreemde",
  "nilfgaard.young-emissary",
  "nilfgaard.zerrikanian-fire-scorpion",
  "northern-realms.ballista",
  "northern-realms.blue-stripes-commando",
  "northern-realms.catapult",
  "northern-realms.crinfrid-reavers-dragon-hunter",
  "northern-realms.dethmold",
  "northern-realms.dun-banner-medic",
  "northern-realms.esterad-thyssen",
  "northern-realms.john-natalis",
  "northern-realms.kaedweni-siege-expert",
  "northern-realms.keira-metz",
  "northern-realms.philippa-eilhart",
  "northern-realms.poor-fucking-infantry",
  "northern-realms.prince-stennis",
  "northern-realms.redanian-foot-soldier",
  "northern-realms.sabrina-glevissig",
  "northern-realms.sheldon-skaggs",
  "northern-realms.siege-tower",
  "northern-realms.siegfried-of-denesle",
  "northern-realms.sigismund-dijkstra",
  "northern-realms.sile-de-tansarville",
  "northern-realms.thaler",
  "northern-realms.trebuchet",
  "northern-realms.vernon-roche",
  "northern-realms.ves",
  "northern-realms.yarpen-zigrin",
  "scoiatael.barclay-els",
  "scoiatael.ciaran-aep-easnillien",
  "scoiatael.dennis-cranmer",
  "scoiatael.dol-blathanna-archer",
  "scoiatael.dol-blathanna-scout",
  "scoiatael.dwarven-skirmisher",
  "scoiatael.eithne",
  "scoiatael.elven-skirmisher",
  "scoiatael.filavandrel-aen-fidhail",
  "scoiatael.havekar-healer",
  "scoiatael.havekar-smuggler",
  "scoiatael.ida-emean-aep-sivney",
  "scoiatael.iorveth",
  "scoiatael.isengrim-faoiltiarna",
  "scoiatael.mahakaman-defender",
  "scoiatael.milva",
  "scoiatael.riordain",
  "scoiatael.saesenthessis",
  "scoiatael.schirru",
  "scoiatael.toruviel",
  "scoiatael.vrihedd-brigade-recruit",
  "scoiatael.vrihedd-brigade-veteran",
  "scoiatael.yaevinn",
  "skellige.birna-bran",
  "skellige.blueboy-lugos",
  "skellige.cerys",
  "skellige.clan-an-craite-warrior",
  "skellige.clan-brokvar-archer",
  "skellige.clan-dimun-pirate",
  "skellige.clan-drummond-shield-maiden",
  "skellige.clan-heymaey-skald",
  "skellige.clan-tordarroch-armorsmith",
  "skellige.donar-an-hindar",
  "skellige.draig-bon-dhu",
  "skellige.ermion",
  "skellige.hjalmar",
  "skellige.holger-blackhand",
  "skellige.kambi-hemdall",
  "skellige.light-longship",
  "skellige.madman-lugos",
  "skellige.mardroeme",
  "skellige.olaf",
  "skellige.svanrige",
  "skellige.udalryk",
  "skellige.war-longship",
];

const splitCatalogSourceIds: readonly string[] = splitResolutions.flatMap(
  (resolution) => resolution.catalogSourceIds,
);
const duplicateResolvedCatalogSourceIds: readonly string[] = duplicateResolutions.map(
  (resolution) => resolution.catalogSourceId,
);

const promotedCatalogSourceIds: readonly string[] = [
  ...new Set([
    ...directPromotedCandidateIds,
    ...splitCatalogSourceIds,
    ...duplicateResolvedCatalogSourceIds,
  ]),
].sort();

const countsByFaction: Readonly<Record<string, number>> = {
  monsters: 35,
  neutral: 21,
  nilfgaard: 29,
  northern_realms: 25,
  scoiatael: 23,
  skellige: 26,
};

const countsByKind: Readonly<Record<string, number>> = {
  hero: 25,
  special: 4,
  unit: 125,
  weather: 5,
};

export const officialPromotionManifest: OfficialPromotionManifest = {
  directPromotedCandidateCount: directPromotedCandidateIds.length,
  deferredCandidateCount: deferred.length,
  promotedCatalogSourceCount: promotedCatalogSourceIds.length,
  directPromotedCandidateIds,
  promotedCatalogSourceIds,
  deferred,
  splitResolutions,
  duplicateResolutions,
  countsByFaction,
  countsByKind,
};
