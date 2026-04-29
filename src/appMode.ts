export interface EngineUiFlagInput {
  search?: string;
  envFlag?: string;
}

export type EngineUiVariant = "shell" | "authentic";
export type AuthenticUiView = "pregame" | "match" | "harness" | "deck-builder" | "card-studio" | "ui-component-foundation";

const buildSearchParams = (search: string) =>
  new URLSearchParams(search.startsWith("?") ? search : `?${search}`);

export const shouldUseEngineUi = ({ search = "", envFlag }: EngineUiFlagInput = {}) => {
  const params = buildSearchParams(search);
  return params.get("engine") === "1" || envFlag === "1";
};

export const getEngineSeedFromSearch = (search = "") => {
  const params = buildSearchParams(search);
  return params.get("seed") ?? undefined;
};

export const getEngineUiVariantFromSearch = (search = ""): EngineUiVariant => {
  const params = buildSearchParams(search);
  return params.get("ui") === "authentic" ? "authentic" : "shell";
};

export const getAuthenticUiViewFromSearch = (search = ""): AuthenticUiView => {
  const params = buildSearchParams(search);
  const view = params.get("view");
  if (
    view === "match" ||
    view === "harness" ||
    view === "pregame" ||
    view === "deck-builder" ||
    view === "card-studio" ||
    view === "ui-component-foundation"
  ) {
    return view;
  }
  return "pregame";
};
