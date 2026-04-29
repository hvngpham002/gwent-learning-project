import { readFileSync } from "fs";
import { describe, expect, it } from "vitest";

import {
  assertGame8ScrapeShape,
  buildOfficialCandidatesFromGame8Scrape,
  game8OfficialCardCandidates,
  game8OfficialImageCandidates,
  game8OfficialLeaderCandidates,
  officialPortingSummary,
} from "@/data/catalog/official";
import { game8PublicImagePaths } from "@/data/catalog/official/game8PublicImagePaths";

const scrapeUrl = new URL("../../audit/scrapes/2026-04-29-game8-gwent-cards.json", import.meta.url);
const scrape = JSON.parse(readFileSync(scrapeUrl, "utf8"));

const allCandidateIds = () => [
  ...game8OfficialCardCandidates.map((candidate) => candidate.source.sourceId),
  ...game8OfficialLeaderCandidates.map((candidate) => candidate.sourceId),
];

describe("official Game8 catalog staging import", () => {
  it("loads the expected scrape shape and count contract", () => {
    expect(() => assertGame8ScrapeShape(scrape)).not.toThrow();
    expect(scrape.schemaVersion).toBe("game8-gwent-card-port-v1");
    expect(scrape.counts.totalInstances).toBe(254);
    expect(scrape.counts.uniqueCards).toBe(181);
    expect(scrape.instances).toHaveLength(254);
    expect(scrape.uniqueCards).toHaveLength(181);
  });

  it("builds deterministic official card, leader, image, and summary candidates", () => {
    const rebuilt = buildOfficialCandidatesFromGame8Scrape(scrape);

    expect(game8OfficialCardCandidates).toHaveLength(159);
    expect(game8OfficialLeaderCandidates).toHaveLength(22);
    expect(game8OfficialImageCandidates).toHaveLength(181);
    expect(officialPortingSummary.totalCandidateCount).toBe(181);
    expect(officialPortingSummary.totalPhysicalCopies).toBe(254);
    expect(rebuilt.cards.map((candidate) => candidate.source.sourceId)).toEqual(
      game8OfficialCardCandidates.map((candidate) => candidate.source.sourceId),
    );
    expect(rebuilt.leaders.map((candidate) => candidate.sourceId)).toEqual(
      game8OfficialLeaderCandidates.map((candidate) => candidate.sourceId),
    );
  });

  it("uses official source IDs and preserves existing current catalog IDs for clear matches", () => {
    const ids = allCandidateIds();

    expect(ids.some((sourceId) => sourceId.startsWith("custom_"))).toBe(false);
    expect(ids).toEqual(Array.from(new Set(ids)));
    expect(ids).toEqual(
      expect.arrayContaining([
        "neutral.decoy",
        "neutral.commanders-horn",
        "neutral.gaunter-odimm-darkness",
        "northern-realms.blue-stripes-commando",
        "northern-realms.poor-fucking-infantry",
        "nilfgaard.impera-brigade-guard",
        "northern-realms.foltest-lord-commander-of-the-north",
        "nilfgaard.emhyr-var-emreis-his-imperial-majesty",
      ]),
    );
    expect(officialPortingSummary.preservedCurrentSourceIds).toEqual(
      expect.arrayContaining([
        "neutral.decoy",
        "northern-realms.blue-stripes-commando",
        "nilfgaard.impera-brigade-guard",
        "northern-realms.foltest-lord-commander-of-the-north",
      ]),
    );
  });

  it("collapses duplicate physical copies into source candidates with copy metadata", () => {
    const decoy = game8OfficialCardCandidates.find((candidate) => candidate.source.sourceId === "neutral.decoy");
    const impera = game8OfficialCardCandidates.find((candidate) => candidate.source.sourceId === "nilfgaard.impera-brigade-guard");

    expect(decoy?.copyCount).toBe(3);
    expect(decoy?.game8CopyIds).toHaveLength(3);
    expect(impera?.copyCount).toBe(4);
    expect(impera?.game8CopyIds).toHaveLength(4);
  });

  it("adds one image manifest entry per candidate and checks public image existence", () => {
    const imageIds = new Set(game8OfficialImageCandidates.map((image) => image.sourceId));
    const publicImagePathSet = new Set<string>(game8PublicImagePaths);
    expect(imageIds.size).toBe(181);
    expect(imageIds).toEqual(new Set(allCandidateIds()));

    game8OfficialImageCandidates.forEach((image) => {
      expect(image.preferredImagePath).toMatch(/^\/images\//);
      const exists = publicImagePathSet.has(image.preferredImagePath);
      expect(image.existsInPublicImages).toBe(exists);
    });
    expect(officialPortingSummary.missingImageCount).toBe(
      game8OfficialImageCandidates.filter((image) => !image.existsInPublicImages).length,
    );
  });

  it("keeps non-ready rules visible with explicit issue codes", () => {
    const mardroeme = game8OfficialCardCandidates.find((candidate) => candidate.source.sourceId === "skellige.mardroeme");
    const storm = game8OfficialCardCandidates.find((candidate) => candidate.source.sourceId === "neutral.skellige-storm");
    const berserker = game8OfficialCardCandidates.find((candidate) =>
      candidate.source.abilities.includes("berserker"),
    );
    const clearWeatherLeader = game8OfficialLeaderCandidates.find(
      (candidate) => candidate.sourceId === "northern-realms.foltest-lord-commander-of-the-north",
    );
    const fogLeader = game8OfficialLeaderCandidates.find(
      (candidate) => candidate.sourceId === "northern-realms.foltest-king-of-temeria",
    );

    expect(mardroeme?.portingStatus).not.toBe("needs_rule");
    expect(mardroeme?.portingIssues.join(" ")).not.toContain("rule_gap:mardroeme");
    expect(storm?.portingStatus).not.toBe("needs_rule");
    expect(storm?.portingIssues.join(" ")).not.toContain("metadata_mismatch");
    expect(berserker?.portingIssues.join(" ")).toMatch(/transform_link_required|catalog_split_required/);
    const cowBovine = game8OfficialCardCandidates.find(
      (candidate) => candidate.source.sourceId === "neutral.cow-bovine-defense-force",
    );
    expect(cowBovine?.portingStatus).not.toBe("ready_for_catalog");
    expect(cowBovine?.portingIssues.join(" ")).toMatch(/catalog_split_required:avenger/);
    expect(cowBovine?.portingIssues.join(" ")).toMatch(/rule_gap:avenger/);
    expect(clearWeatherLeader?.mappedAbilityId).toBe("clear_weather");
    expect(clearWeatherLeader?.portingIssues.join(" ")).not.toContain("leader_engine_gap");
    expect(fogLeader?.portingStatus).toBe("needs_leader_rule");
    expect(fogLeader?.portingIssues.join(" ")).toContain("leader_engine_gap");
    expect(officialPortingSummary.unsupportedAbilityCounts.mardroeme).toBeUndefined();
    expect(officialPortingSummary.unsupportedAbilityCounts.berserker).toBeUndefined();
    expect(officialPortingSummary.unsupportedAbilityCounts.skellige_storm).toBeUndefined();
    expect(officialPortingSummary.unsupportedLeaderAbilityCounts.play_fog).toBeGreaterThan(0);
  });

  it("assigns every official candidate a porting status", () => {
    const statuses = new Set([
      "ready_for_catalog",
      "needs_image",
      "needs_rule",
      "needs_leader_rule",
      "needs_review",
    ]);

    game8OfficialCardCandidates.forEach((candidate) => {
      expect(statuses.has(candidate.portingStatus)).toBe(true);
    });
    game8OfficialLeaderCandidates.forEach((candidate) => {
      expect(statuses.has(candidate.portingStatus)).toBe(true);
    });
  });
});
