import { describe, expect, it } from "vitest";

import {
  getAbilityDisplay,
  getCardKindDisplay,
  getFactionDisplay,
  getLeaderAbilityDisplay,
  getRowDisplay,
  listFactionDisplays,
  listRowDisplays,
} from "@/components/gwent/displayMetadata";

describe("authentic UI display metadata", () => {
  it("exposes a stable display entry for each known faction id", () => {
    const factions = listFactionDisplays();
    expect(factions.map((entry) => entry.id)).toEqual([
      "northern_realms",
      "nilfgaard",
      "monsters",
      "scoiatael",
      "skellige",
      "neutral",
    ]);
    expect(getFactionDisplay("northern_realms").short).toBe("NR");
    expect(getFactionDisplay("nilfgaard").short).toBe("NG");
  });

  it("falls back to a neutral display for unknown factions", () => {
    const fallback = getFactionDisplay("not_a_real_faction");
    expect(fallback.id).toBe("neutral");
    expect(fallback.name).toMatch(/unknown/i);
  });

  it("lists all three current rows with deterministic glyphs", () => {
    const rows = listRowDisplays();
    expect(rows.map((entry) => entry.id)).toEqual(["close", "ranged", "siege"]);
    for (const row of rows) {
      expect(row.glyph.length).toBeGreaterThan(0);
      expect(row.pathD).toMatch(/^M/);
    }
  });

  it("falls back deterministically for unknown rows", () => {
    const fallback = getRowDisplay("flank");
    expect(fallback.glyph).toBe("·");
    expect(fallback.name).toMatch(/unknown/i);
  });

  it("returns implemented metadata for catalog ability ids", () => {
    const medic = getAbilityDisplay("medic");
    expect(medic.id).toBe("medic");
    expect(medic.name).toBe("Medic");
    expect(medic.glyph).toBe("✚");
    expect(medic.status).toBe("implemented");
  });

  it("returns title-cased placeholder metadata for unknown ability ids", () => {
    const placeholder = getAbilityDisplay("future_ability_id");
    expect(placeholder.id).toBe("future_ability_id");
    expect(placeholder.name).toBe("Future Ability Id");
    expect(placeholder.glyph).toBe("·");
    expect(placeholder.status).toBe("placeholder");
  });

  it("treats null/empty/none ability ids as 'no ability'", () => {
    expect(getAbilityDisplay(null).id).toBe("none");
    expect(getAbilityDisplay("").id).toBe("none");
    expect(getAbilityDisplay("none").id).toBe("none");
  });

  it("returns implemented metadata for catalog leader ability ids", () => {
    const clear = getLeaderAbilityDisplay("clear_weather");
    expect(clear.id).toBe("clear_weather");
    expect(clear.name).toBe("Clear Weather");
    expect(clear.status).toBe("implemented");
  });

  it("falls back for unknown leader ability ids", () => {
    const placeholder = getLeaderAbilityDisplay("totally_new_leader_ability");
    expect(placeholder.id).toBe("totally_new_leader_ability");
    expect(placeholder.name).toBe("Totally New Leader Ability");
    expect(placeholder.status).toBe("placeholder");
  });

  it("returns kind labels with a deterministic fallback", () => {
    expect(getCardKindDisplay("unit").badge).toBe("UNIT");
    expect(getCardKindDisplay("hero").badge).toBe("HERO");
    expect(getCardKindDisplay("special").badge).toBe("SPECIAL");
    expect(getCardKindDisplay("future_kind").name).toMatch(/unknown/i);
  });
});
