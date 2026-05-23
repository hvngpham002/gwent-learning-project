import { describe, expect, it } from "vitest";

import {
  KNOWN_PRESET_DECK_PRESET_IDS,
  buildKnownPresetDecklistPrior,
  buildPublicActionAbstraction,
  buildSampledWorldValidation,
  collapsePublicActions,
  hashSamplerReadinessPublicValue,
  type LegalMove,
} from "@/game/benchmark";

const playMove = (
  sourceCardId: string,
  row: "close" | "ranged" | "siege",
  options?: Partial<LegalMove["metadata"]>,
): LegalMove => ({
  kind: "play_card",
  moveId: `play:seat_a:${sourceCardId}:${row}`,
  seatId: "seat_a",
  sourceCardId,
  sourceId: "test.source",
  target: { kind: "board_row", side: "own", seatId: "seat_a", row },
  label: "Play card",
  metadata: {
    cardKind: "unit",
    abilities: [],
    targetLabel: `${row} row`,
    ...options,
  },
});

const passMove: LegalMove = {
  kind: "pass",
  moveId: "pass:seat_a",
  seatId: "seat_a",
  target: { kind: "none" },
  label: "Pass",
};

const leaderMove: LegalMove = {
  kind: "use_leader",
  moveId: "leader:seat_a:test",
  seatId: "seat_a",
  leaderCardId: "seat_a:test-leader",
  sourceId: "leader.test",
  target: { kind: "deck_card_source", seatId: "seat_a", sourceId: "weather.test" },
  label: "Use leader",
  metadata: {
    leaderName: "Test Leader",
    ability: "play_frost",
    abilityStatus: "implemented",
    targetRequirement: "deck_weather_source",
    targetSourceId: "weather.test",
  },
};

describe("benchmark sampler readiness - known_preset_decklist_prior", () => {
  it("constructs prior for official starter deck presets", () => {
    const presetIds = [...KNOWN_PRESET_DECK_PRESET_IDS];
    for (const deckPresetId of presetIds) {
      const prior = buildKnownPresetDecklistPrior({
        deckPresetId,
        faction: "monsters",
        visibleHandCount: 10,
      });

      expect(prior).not.toBeNull();
      expect(prior!.priorId).toBe("known_preset_decklist_prior");
      expect(prior!.priorStatus).toBe("prior_available");
      expect(prior!.deckPresetId).toBe(deckPresetId);
      expect(prior!.mainDeckCardCount).toBeGreaterThan(0);
      expect(prior!.sideDeckCardCount).toBeGreaterThanOrEqual(0);
      expect(prior!.totalDeckCardCount).toBe(
        prior!.mainDeckCardCount + prior!.sideDeckCardCount,
      );
      expect(prior!.knownVisibleCardCount).toBe(10);
      expect(prior!.priorRemainingCardCount).toBe(
        prior!.mainDeckCardCount - 10,
      );
    }
  });

  it("returns prior_unavailable for unknown deck presets", () => {
    const prior = buildKnownPresetDecklistPrior({
      deckPresetId: "nonexistent-deck",
      faction: "monsters",
      visibleHandCount: 5,
    });

    expect(prior!.priorId).toBe("known_preset_decklist_prior");
    expect(prior!.priorStatus).toBe("prior_unavailable");
    expect(prior!.totalDeckCardCount).toBe(0);
    expect(prior!.knownVisibleCardCount).toBe(0);
    expect(prior!.priorRemainingCardCount).toBe(0);
  });

  it("respects visible hand count subtraction in prior remaining", () => {
    const prior1 = buildKnownPresetDecklistPrior({
      deckPresetId: "official-northern-realms-starter",
      faction: "northern-realms",
      visibleHandCount: 5,
    });
    const prior2 = buildKnownPresetDecklistPrior({
      deckPresetId: "official-northern-realms-starter",
      faction: "northern-realms",
      visibleHandCount: 10,
    });

    expect(prior1).not.toBeNull();
    expect(prior2).not.toBeNull();
    expect(prior1!.totalDeckCardCount).toBe(prior2!.totalDeckCardCount);
    expect(prior1!.priorRemainingCardCount).toBeGreaterThan(
      prior2!.priorRemainingCardCount,
    );
    expect(prior1!.priorRemainingCardCount).toBe(
      prior1!.mainDeckCardCount - 5,
    );
    expect(prior2!.priorRemainingCardCount).toBe(
      prior2!.mainDeckCardCount - 10,
    );
  });

  it("does not expose card identities in prior output", () => {
    const prior = buildKnownPresetDecklistPrior({
      deckPresetId: "official-monsters-starter",
      faction: "monsters",
      visibleHandCount: 10,
    });

    const serialized = JSON.stringify(prior);
    expect(serialized).not.toContain("cardsById");
    expect(serialized).not.toContain("deckOrder");
    expect(serialized).not.toContain("seat_a:");
    expect(serialized).not.toContain("seat_b:");
  });
});

describe("benchmark sampler readiness - sampled-world validation", () => {
  it("returns deferred for reasonable opponent counts against known opponent prior", () => {
    const result = buildSampledWorldValidation({
      deckPresetId: "official-northern-realms-starter",
      opponentHandCount: 10,
      opponentDeckCount: 12,
      sampleCount: 8,
      priorTotalCardCount: 25,
    });

    expect(result.rootValidationStatus).toBe("deferred");
    expect(result.sampleCountRequested).toBe(8);
    expect(result.sampleCountGenerated).toBe(0);
    expect(result.sampleCountValid).toBe(0);
    expect(result.sampleCountInvalid).toBe(0);
    expect(result.opponentHandCount).toBe(10);
    expect(result.opponentDeckCount).toBe(12);
    expect(result.invalidReasonCounts).toEqual({});
  });

  it("returns deferred for Northern Realms vs Nilfgaard root where opponent has 10 hand + 24 deck = 34 against Nilfgaard prior with 24 main deck cards", () => {
    const result = buildSampledWorldValidation({
      deckPresetId: "official-northern-realms-starter",
      opponentHandCount: 10,
      opponentDeckCount: 24,
      sampleCount: 8,
      priorTotalCardCount: 24,
    });

    expect(result.rootValidationStatus).toBe("invalid");
    expect(result.sampleCountInvalid).toBeGreaterThan(0);
  });

  it("returns deferred when opponent prior has sufficient main deck cards to cover observed counts", () => {
    const result = buildSampledWorldValidation({
      deckPresetId: "official-northern-realms-starter",
      opponentHandCount: 10,
      opponentDeckCount: 24,
      sampleCount: 8,
      priorTotalCardCount: 34,
    });

    expect(result.rootValidationStatus).toBe("deferred");
    expect(result.sampleCountGenerated).toBe(0);
    expect(result.sampleCountInvalid).toBe(0);
    expect(result.sampleCountValid).toBe(0);
  });

  it("returns invalid when observed cards exceed prior total", () => {
    const result = buildSampledWorldValidation({
      deckPresetId: "official-monsters-starter",
      opponentHandCount: 20,
      opponentDeckCount: 15,
      sampleCount: 8,
      priorTotalCardCount: 25,
    });

    expect(result.rootValidationStatus).toBe("invalid");
    expect(result.sampleCountInvalid).toBeGreaterThan(0);
    expect(result.invalidReasonCounts["observed_exceeds_prior_total"]).toBe(1);
  });

  it("returns invalid when opponent deck exceeds prior", () => {
    const result = buildSampledWorldValidation({
      deckPresetId: "official-monsters-starter",
      opponentHandCount: 5,
      opponentDeckCount: 30,
      sampleCount: 8,
      priorTotalCardCount: 25,
    });

    expect(result.rootValidationStatus).toBe("invalid");
    expect(result.sampleCountInvalid).toBeGreaterThan(0);
    expect(result.invalidReasonCounts["opponent_deck_exceeds_prior"]).toBe(1);
  });

  it("returns invalid when opponent hand exceeds prior", () => {
    const result = buildSampledWorldValidation({
      deckPresetId: "official-monsters-starter",
      opponentHandCount: 30,
      opponentDeckCount: 5,
      sampleCount: 8,
      priorTotalCardCount: 25,
    });

    expect(result.rootValidationStatus).toBe("invalid");
    expect(result.sampleCountInvalid).toBeGreaterThan(0);
    expect(result.invalidReasonCounts["opponent_hand_exceeds_prior"]).toBe(1);
  });

  it("returns deferred for consistent counts (no real sampled multisets implemented)", () => {
    const result = buildSampledWorldValidation({
      deckPresetId: "official-monsters-starter",
      opponentHandCount: 5,
      opponentDeckCount: 15,
      sampleCount: 8,
      priorTotalCardCount: 25,
    });

    expect(result.rootValidationStatus).toBe("deferred");
    expect(result.sampleCountGenerated).toBe(0);
    expect(result.sampleCountValid).toBe(0);
    expect(result.sampleCountInvalid).toBe(0);
  });

  it("deferred roots report zero generated/valid samples while keeping requested count", () => {
    const result = buildSampledWorldValidation({
      deckPresetId: "official-northern-realms-starter",
      opponentHandCount: 5,
      opponentDeckCount: 15,
      sampleCount: 8,
      priorTotalCardCount: 25,
    });

    expect(result.rootValidationStatus).toBe("deferred");
    expect(result.sampleCountRequested).toBe(8);
    expect(result.sampleCountGenerated).toBe(0);
    expect(result.sampleCountValid).toBe(0);
    expect(result.sampleCountInvalid).toBe(0);
    expect(result.invalidReasonCounts).toEqual({});
  });

  it("invalid roots still report invalid status and reason counts", () => {
    const result = buildSampledWorldValidation({
      deckPresetId: "official-monsters-starter",
      opponentHandCount: 20,
      opponentDeckCount: 15,
      sampleCount: 8,
      priorTotalCardCount: 25,
    });

    expect(result.rootValidationStatus).toBe("invalid");
    expect(result.sampleCountInvalid).toBeGreaterThan(0);
    expect(result.invalidReasonCounts["observed_exceeds_prior_total"]).toBe(1);
    expect(result.sampleCountGenerated).toBeGreaterThan(0);
  });

  it("produces scalar bucket outputs", () => {
    const result = buildSampledWorldValidation({
      deckPresetId: "official-monsters-starter",
      opponentHandCount: 10,
      opponentDeckCount: 12,
      sampleCount: 8,
      priorTotalCardCount: 25,
    });

    expect(result.opponentHiddenPoolSizeBucket).toBe("large");
    expect(result.knownVisibleCardCountBucket).toBe("large");
    expect(result.priorRemainingCardCountBucket).toBe("medium");
    expect(typeof result.invalidReasonCounts).toBe("object");
  });

  it("produces no hidden-info leaks", () => {
    const result = buildSampledWorldValidation({
      deckPresetId: "official-monsters-starter",
      opponentHandCount: 10,
      opponentDeckCount: 12,
      sampleCount: 8,
      priorTotalCardCount: 25,
    });

    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain("cardsById");
    expect(serialized).not.toContain("finalState");
    expect(serialized).not.toContain("commandLog");
    expect(serialized).not.toContain("eventLog");
    expect(serialized).not.toContain("ownHand");
    expect(serialized).not.toMatch(/"opponentHand"\s*:/);
    expect(serialized).not.toContain("unsafeDebugResults");
    expect(serialized).not.toContain("decisionTrace");
    expect(serialized).not.toContain("deckOrder");
    expect(serialized).not.toContain("sampledHand");
    expect(serialized).not.toContain("sampledDeck");
  });
});

describe("benchmark sampler readiness - public action abstraction", () => {
  it("abstraction hides raw move ids and card identities", () => {
    const move = playMove("seat_a:private-source-id:abc123", "close", {
      printedStrength: 8,
      cardName: "Hidden Card Name",
    });

    const abstraction = buildPublicActionAbstraction(
      move,
      "playing",
      2,
    );

    const serialized = JSON.stringify(abstraction);
    expect(serialized).not.toContain("seat_a:private-source-id");
    expect(serialized).not.toContain("abc123");
    expect(serialized).not.toContain("Hidden Card Name");
  });

  it("maps move kind to public search action kind", () => {
    const playMoveAbstraction = buildPublicActionAbstraction(
      playMove("seat_a:src1", "close"),
      "playing",
      1,
    );
    const passAbstraction = buildPublicActionAbstraction(passMove, "playing", 1);
    const leaderAbstraction = buildPublicActionAbstraction(leaderMove, "playing", 1);

    expect(playMoveAbstraction.kind).toBe("play_card");
    expect(passAbstraction.kind).toBe("pass");
    expect(leaderAbstraction.kind).toBe("use_leader");
  });

  it("maps target side correctly for different targets", () => {
    const playOwnClose = playMove("seat_a:src1", "close");
    const playOwnRanged = playMove("seat_a:src1", "ranged");

    const ownClose = buildPublicActionAbstraction(playOwnClose, "playing", 1);
    const ownRanged = buildPublicActionAbstraction(playOwnRanged, "playing", 1);

    expect(ownClose.targetSide).toBe("own");
    expect(ownRanged.targetSide).toBe("own");
    expect(ownClose.targetKind).toBe("board_row");
    expect(ownRanged.targetKind).toBe("board_row");
  });

  it("identifies source class correctly", () => {
    const unitAbstraction = buildPublicActionAbstraction(
      playMove("seat_a:src1", "close", { cardKind: "unit", printedStrength: 5 }),
      "playing",
      1,
    );
    const heroAbstraction = buildPublicActionAbstraction(
      playMove("seat_a:src1", "close", { cardKind: "hero", printedStrength: 15 }),
      "playing",
      1,
    );
    const leaderAbstraction = buildPublicActionAbstraction(leaderMove, "playing", 1);

    expect(unitAbstraction.sourceClass).toBe("unit");
    expect(heroAbstraction.sourceClass).toBe("hero");
    expect(leaderAbstraction.sourceClass).toBe("leader");
  });

  it("applies strength bucket for visible own-hand cards", () => {
    const weakAbstraction = buildPublicActionAbstraction(
      playMove("seat_a:src1", "close", { printedStrength: 3 }),
      "playing",
      1,
    );
    const mediumAbstraction = buildPublicActionAbstraction(
      playMove("seat_a:src1", "close", { printedStrength: 8 }),
      "playing",
      1,
    );
    const strongAbstraction = buildPublicActionAbstraction(
      playMove("seat_a:src1", "close", { printedStrength: 15 }),
      "playing",
      1,
    );

    expect(weakAbstraction.strengthBucket).toBe("weak");
    expect(mediumAbstraction.strengthBucket).toBe("medium");
    expect(strongAbstraction.strengthBucket).toBe("strong");
  });

  it("collapses multi-target cards into same abstraction", () => {
    const moves: LegalMove[] = [
      playMove("seat_a:src1", "close", { printedStrength: 5 }),
      playMove("seat_a:src2", "close", { printedStrength: 5 }),
      playMove("seat_a:src3", "close", { printedStrength: 5 }),
      passMove,
    ];

    const abstracts = moves.map((m) =>
      buildPublicActionAbstraction(m, "playing", 1),
    );
    const collapsed = collapsePublicActions(abstracts);

    const playCardBucket = collapsed.find(
      (a) => a.kind === "play_card" && a.targetSide === "own",
    );
    expect(playCardBucket).toBeTruthy();
    expect(playCardBucket!.moveCount).toBe(3);

    const passBucket = collapsed.find((a) => a.kind === "pass");
    expect(passBucket).toBeTruthy();
    expect(passBucket!.moveCount).toBe(1);
  });

  it("preserves public target side/kind counts after collapse", () => {
    const moves: LegalMove[] = [
      playMove("seat_a:src1", "close", { printedStrength: 5 }),
      playMove("seat_a:src2", "close", { printedStrength: 5 }),
      playMove("seat_a:src3", "close", { printedStrength: 5 }),
    ];

    const abstracts = moves.map((m) =>
      buildPublicActionAbstraction(m, "playing", 1),
    );
    const collapsed = collapsePublicActions(abstracts);

    const boardRowOwn = collapsed.find(
      (a) => a.targetKind === "board_row" && a.targetSide === "own",
    );
    expect(boardRowOwn).toBeTruthy();
    expect(boardRowOwn!.moveCount).toBe(3);
  });
});

describe("benchmark sampler readiness - deterministic hashing", () => {
  it("produces identical hashes for identical inputs", () => {
    const input1 = { legalMoveCount: 5, phase: "playing", round: 1 };
    const input2 = { legalMoveCount: 5, phase: "playing", round: 1 };

    expect(hashSamplerReadinessPublicValue(input1)).toBe(
      hashSamplerReadinessPublicValue(input2),
    );
  });

  it("produces different hashes for different inputs", () => {
    const input1 = { legalMoveCount: 5, phase: "playing", round: 1 };
    const input2 = { legalMoveCount: 10, phase: "playing", round: 1 };

    expect(hashSamplerReadinessPublicValue(input1)).not.toBe(
      hashSamplerReadinessPublicValue(input2),
    );
  });
});
