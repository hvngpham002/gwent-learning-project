import type { CatalogLeaderSource } from "@/game/catalog";

export const DRAW_EXTRA_CARD_LEADER_SOURCE_ID =
  "scoiatael.francesca-findabair-daisy-of-the-valley";

export const BASE_INITIAL_HAND_SIZE = 10;

export interface GetInitialHandDrawCountInput {
  readonly leaderSourceId: string;
  readonly catalogLeaders: readonly CatalogLeaderSource[];
  readonly baseDrawCount?: number;
}

export const getInitialHandDrawCountForLeader = ({
  leaderSourceId,
  catalogLeaders,
  baseDrawCount = BASE_INITIAL_HAND_SIZE,
}: GetInitialHandDrawCountInput): number => {
  const leader = catalogLeaders.find((entry) => entry.sourceId === leaderSourceId);
  if (!leader) {
    return baseDrawCount;
  }
  if (leader.ability !== "draw_extra_card") {
    return baseDrawCount;
  }
  return baseDrawCount + 1;
};
