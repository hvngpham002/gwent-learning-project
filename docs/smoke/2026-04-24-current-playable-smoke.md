# Current Playable Smoke Checklist - Northern Realms Mirror

Use this checklist after baseline changes and before larger migration phases. It covers the current human-vs-AI path rendered by `src/components/game/ReduxGameManager.tsx`.

## Setup

- [ ] Run `npm run dev` and open the local Vite URL.
- [ ] Confirm the app loads without a console crash.
- [ ] Confirm both seats are Northern Realms with Foltest leader art/status.
- [ ] Confirm the player hand is shown and the redraw/mulligan selector opens.
- [ ] Confirm the opponent hand remains hidden as card backs.

## Mulligan

- [ ] Select one player hand card in the redraw modal and confirm redraw.
- [ ] Confirm the selected card leaves the visible hand and one replacement appears.
- [ ] Repeat once more or cancel after one redraw.
- [ ] Wait for the AI redraw to complete without blocking the player UI.
- [ ] Confirm the game advances from setup to playable turns.

## Basic Play

- [ ] If it is the player's turn, select a non-Spy Unit card.
- [ ] Click its legal row and confirm it leaves hand and appears on the player's board.
- [ ] Confirm the player's row and total score update.
- [ ] If a Spy is selected, confirm it can be placed on the opponent board and draws two cards.
- [ ] Confirm the turn changes after a normal card play.

## Weather

- [ ] Select Biting Frost, Impenetrable Fog, or Torrential Rain if available.
- [ ] Click the shared weather area or the affected row entry point.
- [ ] Confirm the weather card appears in the shared weather area.
- [ ] Confirm matching rows on both boards are reduced in displayed score, with Hero cards unchanged.
- [ ] If Clear Weather is available, play it and confirm weather cards leave the weather area.

## AI Move

- [ ] Let the turn pass to the opponent.
- [ ] Confirm the AI thinking state does not allow the player to take an overlapping action.
- [ ] Confirm the AI either plays one card to its board/weather area/discard path or passes.
- [ ] Confirm the turn returns to the player after an AI card play.

## Passing And Round End

- [ ] Click Pass for the player.
- [ ] Confirm the player cannot play additional cards after passing.
- [ ] Let the AI continue until it also passes, or wait for an already-passed AI.
- [ ] Confirm the round resolves after both players pass.
- [ ] Confirm all battlefield cards move to discard or are cleared according to current implementation.
- [ ] Confirm one gem is removed from the lower-scoring side, or both gems on a draw.
- [ ] Confirm the next round starts with remaining hand cards.

## Game End And Reset Risk

- [ ] Continue play until a side reaches zero gems.
- [ ] Confirm the game reaches a game-end state and all-time score changes only for a non-draw winner.
- [ ] Watch for the current auto-reset behavior after game end.
- [ ] Specifically regression-check the known `R-008` risk when a one-gem player wins round 2: the match should eventually be fixed to continue, but current behavior is documented as risky and must not be silently changed in Phase 0.
