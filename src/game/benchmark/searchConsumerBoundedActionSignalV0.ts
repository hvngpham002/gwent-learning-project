export const CFP84_SAMPLE_COUNT = 8 as const;
export const CFP84_NON_CLAIMS = [
  "Immediate signal is not expected value, win probability, a reward target, or a rollout or continuation value.",
  "Immediate signal is not calibrated against human play and does not prove action quality or policy strength.",
  "cFp84 does not rank, recommend, select, or execute a product move, or implement PIMC, ISMCTS/MCTS, self-play, training, or product AI behavior.",
] as const;
export type Cfp84TerminalOutcome = "win" | "loss" | "draw" | "incomplete";
export interface Cfp84PublicMetrics { ownScore:number; opponentScore:number; ownHandCount:number; opponentHandCount:number; ownGemCount:number; opponentGemCount:number; phase:string; round:number; terminalOutcome:Cfp84TerminalOutcome; }
export interface Cfp84Signal { scoreSwing:number; handSwing:number; gemSwing:number; terminalComponent:number; immediateSignal:number; phaseTransition:string; roundTransition:string; terminalOutcome:Cfp84TerminalOutcome; }
export const clamp = (value:number, min:number, max:number) => Math.max(min, Math.min(max, value));
export const roundHalfAwayFromZero = (numerator:number, denominator:number) => numerator >= 0 ? Math.floor((numerator * 2 + denominator) / (denominator * 2)) : Math.ceil((numerator * 2 - denominator) / (denominator * 2));
export const meanMilli = (sum:number, count:number) => count ? roundHalfAwayFromZero(sum * 1000, count) : 0;
export const buildSearchConsumerBoundedActionSignalV0 = (before:Cfp84PublicMetrics, after:Cfp84PublicMetrics):Cfp84Signal => {
  const phaseTransition = before.phase === after.phase ? "unchanged" : "changed";
  const roundTransition = before.round === after.round ? "unchanged" : "changed";
  const scoreSwing = phaseTransition === "unchanged" && roundTransition === "unchanged" ? clamp((after.ownScore-after.opponentScore)-(before.ownScore-before.opponentScore),-60,60) : 0;
  const handSwing = clamp(((after.ownHandCount-before.ownHandCount)-(after.opponentHandCount-before.opponentHandCount))*8,-24,24);
  const gemSwing = clamp(((after.ownGemCount-after.opponentGemCount)-(before.ownGemCount-before.opponentGemCount))*25,-50,50);
  const terminalComponent = after.terminalOutcome === "win" ? 100 : after.terminalOutcome === "loss" ? -100 : 0;
  return { scoreSwing, handSwing, gemSwing, terminalComponent, immediateSignal:clamp(scoreSwing+handSwing+gemSwing+terminalComponent,-200,200), phaseTransition, roundTransition, terminalOutcome:after.terminalOutcome };
};
