import { describe, it } from "vitest";

describe("audit regression placeholders pending engine overhaul", () => {
  it.todo("R-001 deterministic RNG / starter: seeded coin flip and winner-starts-next-round");
  it.todo("R-004 Spy discard ownership: Spy leaves battlefield to controller discard");
  it.todo("R-005 Medic human/AI divergence: one shared Medic resolver for both seats");
  it.todo("R-006 AI seat hardcoding: bot policy can play either seat");
  it.todo("R-008 pre-decrement game-end reset: one-life round winner continues to round 3");
  it.todo("R-009 Horn source tracking: row Horn effect is tied to its source card and lifetime");
  it.todo("R-010 side deck: Summon, Berserker, and Skellige side-deck zones exist");
  it.todo("R-011 mulligan duplicate/lost card: mulligan preserves card identity membership");
  it.todo("R-012 Decoy double tracking: Decoy has one board representation and one discard result");
  it.todo("F-3.15 Agile AI row choice: AI evaluates every legal Agile placement row");
  it.todo("F-5.11 modifier order score example: Weather, Tight Bond, Morale Boost, Horn");
  it.todo("F-10.4 Skellige Storm: Ranged and Siege rows are weathered in play and scoring");
});
