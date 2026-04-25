import { describe, expect, it } from "vitest";

import { getEngineSeedFromSearch, shouldUseEngineUi } from "@/appMode";

describe("app mode helpers", () => {
  it("keeps the legacy UI by default", () => {
    expect(shouldUseEngineUi({ search: "" })).toBe(false);
  });

  it("enables the engine UI through query parameter or env flag", () => {
    expect(shouldUseEngineUi({ search: "?engine=1" })).toBe(true);
    expect(shouldUseEngineUi({ envFlag: "1" })).toBe(true);
    expect(shouldUseEngineUi({ search: "?engine=0", envFlag: "0" })).toBe(false);
  });

  it("reads an optional deterministic engine seed from the query string", () => {
    expect(getEngineSeedFromSearch("?engine=1&seed=dp2-smoke")).toBe("dp2-smoke");
    expect(getEngineSeedFromSearch("?engine=1")).toBeUndefined();
  });
});
