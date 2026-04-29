import game8ScrapeInput from "../../../../audit/scrapes/2026-04-29-game8-gwent-cards.json";

import { buildOfficialCandidatesFromGame8Scrape } from "./game8Mapping";

const officialBuild = buildOfficialCandidatesFromGame8Scrape(game8ScrapeInput);

export const game8OfficialCardCandidates = officialBuild.cards;
export const game8OfficialLeaderCandidates = officialBuild.leaders;
export const game8OfficialImageCandidates = officialBuild.images;
export const officialPortingSummary = officialBuild.summary;

export { buildOfficialCandidatesFromGame8Scrape, assertGame8ScrapeShape } from "./game8Mapping";
export type {
  OfficialAcquisitionRow,
  OfficialCandidateBuildResult,
  OfficialCardCandidate,
  OfficialImageCandidate,
  OfficialImageCrop,
  OfficialLeaderCandidate,
  OfficialPortingStatus,
  OfficialPortingSummary,
  OfficialScrapeCountSummary,
  OfficialSourceCandidate,
} from "./officialTypes";
