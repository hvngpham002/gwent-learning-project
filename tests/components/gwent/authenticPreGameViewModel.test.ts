import { describe, expect, it } from "vitest";

import { ENGINE_AI_POLICY_ID } from "@/components/game/engine/engineShellViewModels";
import {
  buildPreGameDeckOptions,
  buildPreGameFormatOptions,
  buildPreGameModeOptions,
  buildSetupConfig,
  getDefaultPreGameSelection,
  getSuggestedOpponentPresetId,
  normalizePreGameSeed,
  seedFromSearch,
  setupConfigToStartEngineOptions,
} from "@/components/gwent/preGameViewModel";

describe("authentic pre-game view model", () => {
  it("maps current catalog presets to ready deck options", () => {
    const options = buildPreGameDeckOptions();

    expect(options.map((option) => option.presetId)).toEqual(["current-northern-realms", "current-nilfgaard"]);
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
      formatId: "standard",
      aiPolicyId: ENGINE_AI_POLICY_ID,
    });
  });

  it("marks only implemented mode and format options as available", () => {
    expect(buildPreGameModeOptions().filter((mode) => mode.available).map((mode) => mode.id)).toEqual(["human-vs-ai"]);
    expect(buildPreGameModeOptions().filter((mode) => !mode.available).every((mode) => mode.note === "coming later")).toBe(true);
    expect(buildPreGameFormatOptions().filter((format) => format.available).map((format) => format.id)).toEqual(["standard"]);
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

  it("builds serializable setup config and engine start options", () => {
    const config = buildSetupConfig({
      humanDeckPresetId: "current-nilfgaard",
      opponentDeckPresetId: "current-northern-realms",
      seed: "ep4-config",
    });

    expect(config).toEqual({
      humanDeckPresetId: "current-nilfgaard",
      opponentDeckPresetId: "current-northern-realms",
      modeId: "human-vs-ai",
      formatId: "standard",
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
});
