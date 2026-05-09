import { describe, expect, it } from "vitest";

import {
  getAuthenticUiViewFromSearch,
  getEngineSeedFromSearch,
  getEngineUiVariantFromSearch,
  resolveAppRoute,
  shouldUseEngineUi,
  type AppRoute,
} from "@/appMode";

const expectRoute = (route: AppRoute, expected: AppRoute) => {
  expect(route).toEqual(expected);
};

describe("app route resolver", () => {
  it("resolves canonical app paths", () => {
    expectRoute(resolveAppRoute({ pathname: "/" }), { surface: "authentic", view: "pregame" });
    expectRoute(resolveAppRoute({ pathname: "/legacy" }), { surface: "legacy" });
    expectRoute(resolveAppRoute({ pathname: "/engine-diagnostic" }), { surface: "engine-diagnostic" });
    expectRoute(resolveAppRoute({ pathname: "/match" }), { surface: "authentic", view: "match" });
    expectRoute(resolveAppRoute({ pathname: "/deck-builder" }), { surface: "authentic", view: "deck-builder" });
    expectRoute(resolveAppRoute({ pathname: "/card-studio" }), { surface: "authentic", view: "card-studio" });
    expectRoute(resolveAppRoute({ pathname: "/official-porting" }), {
      surface: "authentic",
      view: "official-porting",
    });
    expectRoute(resolveAppRoute({ pathname: "/components" }), {
      surface: "authentic",
      view: "ui-component-foundation",
    });
    expectRoute(resolveAppRoute({ pathname: "/ui-harness" }), { surface: "authentic", view: "harness" });
  });

  it("normalizes trailing slashes and falls unknown paths back to authentic pre-game", () => {
    expectRoute(resolveAppRoute({ pathname: "/deck-builder/" }), {
      surface: "authentic",
      view: "deck-builder",
    });
    expectRoute(resolveAppRoute({ pathname: "/missing-route" }), { surface: "authentic", view: "pregame" });
  });

  it("keeps old query aliases working at the root path", () => {
    expectRoute(resolveAppRoute({ pathname: "/", search: "?engine=1" }), {
      surface: "engine-diagnostic",
    });
    expectRoute(resolveAppRoute({ pathname: "/", search: "?engine=1&ui=authentic" }), {
      surface: "authentic",
      view: "pregame",
    });
    expectRoute(resolveAppRoute({ pathname: "/", search: "?engine=1&ui=authentic&view=pregame" }), {
      surface: "authentic",
      view: "pregame",
    });
    expectRoute(resolveAppRoute({ pathname: "/", search: "?engine=1&ui=authentic&view=match" }), {
      surface: "authentic",
      view: "match",
    });
    expectRoute(resolveAppRoute({ pathname: "/", search: "?engine=1&ui=authentic&view=deck-builder" }), {
      surface: "authentic",
      view: "deck-builder",
    });
    expectRoute(resolveAppRoute({ pathname: "/", search: "?engine=1&ui=authentic&view=card-studio" }), {
      surface: "authentic",
      view: "card-studio",
    });
    expectRoute(resolveAppRoute({ pathname: "/", search: "?engine=1&ui=authentic&view=official-porting" }), {
      surface: "authentic",
      view: "official-porting",
    });
    expectRoute(resolveAppRoute({ pathname: "/", search: "?engine=1&ui=authentic&view=ui-component-foundation" }), {
      surface: "authentic",
      view: "ui-component-foundation",
    });
    expectRoute(resolveAppRoute({ pathname: "/", search: "?engine=1&ui=authentic&view=harness" }), {
      surface: "authentic",
      view: "harness",
    });
  });

  it("lets canonical paths win over old query switches", () => {
    expectRoute(resolveAppRoute({ pathname: "/legacy", search: "?engine=1&ui=authentic&view=deck-builder" }), {
      surface: "legacy",
    });
    expectRoute(resolveAppRoute({ pathname: "/engine-diagnostic", search: "?engine=1&ui=authentic&view=match" }), {
      surface: "engine-diagnostic",
    });
    expectRoute(resolveAppRoute({ pathname: "/match", search: "?engine=1" }), {
      surface: "authentic",
      view: "match",
    });
  });

  it("does not let VITE_ENGINE_UI=1 override the new root route", () => {
    expectRoute(resolveAppRoute({ pathname: "/", envFlag: "1" }), { surface: "authentic", view: "pregame" });
    expectRoute(resolveAppRoute({ pathname: "/", search: "?ui=authentic&view=harness", envFlag: "1" }), {
      surface: "authentic",
      view: "harness",
    });
  });
});

describe("legacy app mode helpers", () => {
  it("keeps the old query/env switch helper for compatibility callers", () => {
    expect(shouldUseEngineUi({ search: "" })).toBe(false);
    expect(shouldUseEngineUi({ search: "?engine=1" })).toBe(true);
    expect(shouldUseEngineUi({ envFlag: "1" })).toBe(true);
    expect(shouldUseEngineUi({ search: "?engine=0", envFlag: "0" })).toBe(false);
  });

  it("reads an optional deterministic engine seed from any query string", () => {
    expect(getEngineSeedFromSearch("?seed=route-smoke")).toBe("route-smoke");
    expect(getEngineSeedFromSearch("?engine=1&seed=dp2-smoke")).toBe("dp2-smoke");
    expect(getEngineSeedFromSearch("?engine=1")).toBeUndefined();
  });

  it("keeps old query view helpers available for compatibility aliases", () => {
    expect(getEngineUiVariantFromSearch("")).toBe("shell");
    expect(getEngineUiVariantFromSearch("?engine=1")).toBe("shell");
    expect(getEngineUiVariantFromSearch("?engine=1&ui=other")).toBe("shell");
    expect(getEngineUiVariantFromSearch("?engine=1&ui=authentic")).toBe("authentic");

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
