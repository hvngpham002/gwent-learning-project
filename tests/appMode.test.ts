import { describe, expect, it } from "vitest";

import {
  getAuthenticUiViewFromSearch,
  getEngineSeedFromSearch,
  getEngineUiVariantFromSearch,
  shouldUseEngineUi,
} from "@/appMode";

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

  it("defaults the engine UI variant to the existing diagnostic shell", () => {
    expect(getEngineUiVariantFromSearch("")).toBe("shell");
    expect(getEngineUiVariantFromSearch("?engine=1")).toBe("shell");
    expect(getEngineUiVariantFromSearch("?engine=1&ui=other")).toBe("shell");
  });

  it("selects the authentic variant when ui=authentic is set", () => {
    expect(getEngineUiVariantFromSearch("?engine=1&ui=authentic")).toBe("authentic");
    expect(getEngineUiVariantFromSearch("ui=authentic&engine=1")).toBe("authentic");
  });

  it("routes authentic UI views and falls back to pre-game", () => {
    expect(getAuthenticUiViewFromSearch("?engine=1&ui=authentic")).toBe("pregame");
    expect(getAuthenticUiViewFromSearch("?engine=1&ui=authentic&view=pregame")).toBe("pregame");
    expect(getAuthenticUiViewFromSearch("?engine=1&ui=authentic&view=match")).toBe("match");
    expect(getAuthenticUiViewFromSearch("?engine=1&ui=authentic&view=harness")).toBe("harness");
    expect(getAuthenticUiViewFromSearch("?engine=1&ui=authentic&view=deck-builder")).toBe("deck-builder");
    expect(getAuthenticUiViewFromSearch("?engine=1&ui=authentic&view=card-studio")).toBe("card-studio");
    expect(getAuthenticUiViewFromSearch("?engine=1&ui=authentic&view=official-porting")).toBe(
      "official-porting",
    );
    expect(getAuthenticUiViewFromSearch("?engine=1&ui=authentic&view=ui-component-foundation")).toBe(
      "ui-component-foundation",
    );
    expect(getAuthenticUiViewFromSearch("view=other&ui=authentic")).toBe("pregame");
  });
});
