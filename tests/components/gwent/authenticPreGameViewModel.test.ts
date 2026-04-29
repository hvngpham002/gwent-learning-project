import { describe, expect, it } from "vitest";

import { ENGINE_AI_POLICY_ID } from "@/components/game/engine/engineShellViewModels";
import {
  buildPreGameDeckOptions,
  buildPreGameDeckOptionsWithLocal,
  buildPreGameFormatOptions,
  buildPreGameModeOptions,
  buildPreGameRoundOptions,
  buildSetupConfig,
  getDefaultPreGameSelection,
  getSuggestedOpponentPresetId,
  normalizePreGameSeed,
  seedFromSearch,
  setupConfigToStartEngineOptions,
} from "@/components/gwent/preGameViewModel";
import { currentCatalogCards, currentCatalogLeaders, currentNorthernRealmsDeckPreset } from "@/data/catalog";
import type { CatalogCardSource } from "@/game/catalog";

describe("authentic pre-game view model", () => {
  const customCard: CatalogCardSource = {
    sourceId: "custom_pregame_unit",
    name: "Pregame Unit",
    faction: "northern_realms",
    kind: "unit",
    strength: 5,
    rows: ["close"],
    abilities: ["none"],
    tags: [],
    deckLimit: 3,
    image: "/images/custom/pregame-unit.png",
  };
  it("maps current catalog presets to ready deck options", () => {
    const options = buildPreGameDeckOptions();

    expect(options.map((option) => option.presetId)).toEqual(["current-northern-realms", "current-nilfgaard"]);
    expect(options.map((option) => option.optionId)).toEqual([
      "catalog:current-northern-realms",
      "catalog:current-nilfgaard",
    ]);
    expect(options.every((option) => option.ready)).toBe(true);
    expect(options[0]).toEqual(
      expect.objectContaining({
        factionName: "Northern Realms",
        leaderName: "Foltest: Lord Commander of The North",
        leaderAbilityName: "Clear Weather",
      }),
    );
    expect(options[0].unitCount + options[0].heroCount + options[0].specialCount).toBe(options[0].cardCount);
  });

  it("defaults to the current Northern Realms versus Nilfgaard matchup", () => {
    expect(getDefaultPreGameSelection()).toEqual({
      humanDeckPresetId: "current-northern-realms",
      opponentDeckPresetId: "current-nilfgaard",
      modeId: "human-vs-ai",
      roundId: "standard",
      formatId: "best-of-3",
      aiPolicyId: ENGINE_AI_POLICY_ID,
    });
  });

  it("marks only implemented mode and format options as available", () => {
    expect(buildPreGameModeOptions().filter((mode) => mode.available).map((mode) => mode.id)).toEqual(["human-vs-ai"]);
    expect(buildPreGameModeOptions().find((mode) => mode.id === "human-vs-ai")).toEqual(
      expect.objectContaining({
        name: "Casual",
        note: ENGINE_AI_POLICY_ID,
      }),
    );
    expect(buildPreGameModeOptions().filter((mode) => !mode.available).every((mode) => mode.note === "coming later")).toBe(true);
    expect(buildPreGameRoundOptions().filter((round) => round.available).map((round) => round.id)).toEqual(["standard"]);
    expect(buildPreGameRoundOptions().filter((round) => !round.available).map((round) => round.id)).toEqual(["instant-death"]);
    expect(buildPreGameFormatOptions().filter((format) => format.available).map((format) => format.id)).toEqual(["best-of-3"]);
    expect(buildPreGameFormatOptions().filter((format) => !format.available).map((format) => format.id)).toEqual(["best-of-1", "training"]);
  });

  it("derives opponent descriptions from catalog deck and leader data", () => {
    const options = buildPreGameDeckOptions();

    expect(options[1].description).toContain("Current Nilfgaard");
    expect(options[1].description).toContain("Emhyr var Emreis");
  });

  it("prefills, normalizes, and generates visible seeds", () => {
    expect(seedFromSearch("?engine=1&ui=authentic&seed=ep4-smoke")).toBe("ep4-smoke");
    expect(seedFromSearch("?engine=1&ui=authentic")).toBe("");
    expect(normalizePreGameSeed("  fixed-seed  ")).toBe("fixed-seed");
    expect(normalizePreGameSeed(" ", () => "generated-seed")).toBe("generated-seed");
  });

  it("suggests the other current preset when the human deck changes", () => {
    expect(getSuggestedOpponentPresetId("current-nilfgaard")).toBe("current-northern-realms");
  });

  it("adds valid local decks as distinct pre-game options", () => {
    const localDeck = { ...currentNorthernRealmsDeckPreset, presetId: "local-nr", name: "Local NR" };
    const options = buildPreGameDeckOptionsWithLocal([localDeck]);

    expect(options.find((option) => option.presetId === "local-nr")).toEqual(
      expect.objectContaining({
        name: "Local NR",
        source: "local",
        ready: true,
      }),
    );
  });

  it("replaces a catalog option with its local editable copy instead of duplicating it", () => {
    const localDeck = { ...currentNorthernRealmsDeckPreset, presetId: "local-current-northern-realms" };
    const options = buildPreGameDeckOptionsWithLocal([localDeck]);

    expect(options.map((option) => option.optionId)).toEqual([
      "local:local-current-northern-realms",
      "catalog:current-nilfgaard",
    ]);
    expect(options[0]).toEqual(expect.objectContaining({ source: "local", name: "Current Northern Realms" }));
  });

  it("marks invalid local decks disabled with a validation reason", () => {
    const localDeck = {
      ...currentNorthernRealmsDeckPreset,
      presetId: "local-invalid",
      name: "Invalid Local",
      mainDeck: [],
    };
    const option = buildPreGameDeckOptionsWithLocal([localDeck]).find((entry) => entry.presetId === "local-invalid");

    expect(option).toEqual(
      expect.objectContaining({
        source: "local",
        ready: false,
        disabledReason: "Need at least 22 battlefield cards.",
      }),
    );
  });

  it("builds serializable setup config and engine start options", () => {
    const config = buildSetupConfig({
      humanDeckPresetId: "current-nilfgaard",
      opponentDeckPresetId: "current-northern-realms",
      roundId: "standard",
      formatId: "best-of-3",
      seed: "ep4-config",
    });

    expect(config).toEqual({
      humanDeckPresetId: "current-nilfgaard",
      opponentDeckPresetId: "current-northern-realms",
      modeId: "human-vs-ai",
      roundId: "standard",
      formatId: "best-of-3",
      seed: "ep4-config",
      aiPolicyId: ENGINE_AI_POLICY_ID,
    });
    expect(setupConfigToStartEngineOptions(config)).toEqual(
      expect.objectContaining({
        seed: "ep4-config",
        humanDeckPresetId: "current-nilfgaard",
        aiDeckPresetId: "current-northern-realms",
        humanSeat: "seat_a",
        aiSeat: "seat_b",
      }),
    );
  });

  it("resolves local decks against explicit custom source sets", () => {
    const localDeck = {
      ...currentNorthernRealmsDeckPreset,
      presetId: "local-custom",
      name: "Local Custom",
      mainDeck: [...currentNorthernRealmsDeckPreset.mainDeck, { sourceId: customCard.sourceId, count: 1 }],
    };
    const sourceSets = { cards: [...currentCatalogCards, customCard], leaders: currentCatalogLeaders };
    const option = buildPreGameDeckOptionsWithLocal([localDeck], sourceSets).find((entry) => entry.presetId === "local-custom");

    expect(option).toEqual(expect.objectContaining({ ready: true, source: "local" }));

    const config = buildSetupConfig({
      humanDeckPresetId: localDeck.presetId,
      humanDeckPreset: localDeck,
      opponentDeckPresetId: "current-nilfgaard",
      roundId: "standard",
      formatId: "best-of-3",
      seed: "custom-pregame",
      catalogCards: sourceSets.cards,
      catalogLeaders: sourceSets.leaders,
    });
    expect(setupConfigToStartEngineOptions(config).catalogCards?.map((card) => card.sourceId)).toContain(customCard.sourceId);
  });

  it("converts a local selected deck into start options with an inline preset", () => {
    const localDeck = { ...currentNorthernRealmsDeckPreset, presetId: "local-nr", name: "Local NR" };
    const config = buildSetupConfig({
      humanDeckPresetId: localDeck.presetId,
      humanDeckPreset: localDeck,
      opponentDeckPresetId: "current-nilfgaard",
      roundId: "standard",
      formatId: "best-of-3",
      seed: "ep5-local",
    });

    expect(setupConfigToStartEngineOptions(config)).toEqual(
      expect.objectContaining({
        seed: "ep5-local",
        humanDeckPresetId: "local-nr",
        humanDeckPreset: localDeck,
        aiDeckPresetId: "current-nilfgaard",
      }),
    );
  });
});
