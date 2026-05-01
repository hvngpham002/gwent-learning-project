import type { CatalogLeaderAbilityId, CatalogRow } from "@/game/catalog";

export type LeaderRowScorchAbility = "scorch_range" | "scorch_siege";

const LEADER_ROW_SCORCH_TO_ROW: Record<LeaderRowScorchAbility, CatalogRow> = {
  scorch_range: "ranged",
  scorch_siege: "siege",
};

export const isLeaderRowScorchAbility = (
  ability: CatalogLeaderAbilityId,
): ability is LeaderRowScorchAbility =>
  ability === "scorch_range" || ability === "scorch_siege";

export const leaderRowScorchRowForAbility = (
  ability: LeaderRowScorchAbility,
): CatalogRow => LEADER_ROW_SCORCH_TO_ROW[ability];
