export interface EngineUiFlagInput {
  search?: string;
  envFlag?: string;
}

export const shouldUseEngineUi = ({ search = "", envFlag }: EngineUiFlagInput = {}) => {
  const params = new URLSearchParams(search.startsWith("?") ? search : `?${search}`);
  return params.get("engine") === "1" || envFlag === "1";
};

export const getEngineSeedFromSearch = (search = "") => {
  const params = new URLSearchParams(search.startsWith("?") ? search : `?${search}`);
  return params.get("seed") ?? undefined;
};
