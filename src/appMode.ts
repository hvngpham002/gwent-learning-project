export interface EngineUiFlagInput {
  search?: string;
  envFlag?: string;
}

export type EngineUiVariant = "shell" | "authentic";
export type AuthenticUiView =
  | "pregame"
  | "match"
  | "harness"
  | "deck-builder"
  | "card-studio"
  | "official-porting"
  | "ui-component-foundation";

export type AppRoute =
  | { surface: "authentic"; view: AuthenticUiView }
  | { surface: "engine-diagnostic" }
  | { surface: "legacy" };

export interface AppRouteInput extends EngineUiFlagInput {
  pathname?: string;
}

const buildSearchParams = (search: string) =>
  new URLSearchParams(search.startsWith("?") ? search : `?${search}`);

const normalizePathname = (pathname = "/") => {
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const withoutTrailingSlash = path.length > 1 ? path.replace(/\/+$/, "") : path;
  return withoutTrailingSlash || "/";
};

const canonicalAuthenticViewsByPath: Record<string, AuthenticUiView> = {
  "/": "pregame",
  "/match": "match",
  "/deck-builder": "deck-builder",
  "/card-studio": "card-studio",
  "/official-porting": "official-porting",
  "/components": "ui-component-foundation",
  "/ui-harness": "harness",
};

// Compatibility helper for the old query/env switch. Primary app routing is
// path-aware through resolveAppRoute below.
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
    view === "official-porting" ||
    view === "ui-component-foundation"
  ) {
    return view;
  }
  return "pregame";
};

export const resolveAppRoute = ({
  pathname = "/",
  search = "",
  envFlag,
}: AppRouteInput = {}): AppRoute => {
  const path = normalizePathname(pathname);
  const params = buildSearchParams(search);
  const engineRequested = params.get("engine") === "1";
  const authenticRequested = params.get("ui") === "authentic";
  const authenticEnvAliasRequested = envFlag === "1" && authenticRequested;

  if (path === "/legacy") {
    return { surface: "legacy" };
  }

  if (path === "/engine-diagnostic") {
    return { surface: "engine-diagnostic" };
  }

  if (path === "/" && engineRequested && !authenticRequested) {
    return { surface: "engine-diagnostic" };
  }

  if (path === "/" && (engineRequested || authenticEnvAliasRequested) && authenticRequested) {
    return { surface: "authentic", view: getAuthenticUiViewFromSearch(search) };
  }

  const canonicalView = canonicalAuthenticViewsByPath[path];
  if (canonicalView) {
    return { surface: "authentic", view: canonicalView };
  }

  return { surface: "authentic", view: "pregame" };
};
