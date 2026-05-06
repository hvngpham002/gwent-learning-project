# cEp13 Visual UI Audit

Date: 2026-05-06

## Scope

Documentation-only visual audit of the current app before the next AI phase. No production code, tests, route behavior, engine behavior, catalog data, or styles were changed.

The audit covered:

- `/` legacy default route
- `/?engine=1` diagnostic engine shell
- `/?engine=1&ui=authentic` authentic pre-game
- `/?engine=1&ui=authentic&view=match` direct match, captured at mulligan and active-board states
- `/?engine=1&ui=authentic&view=deck-builder`
- `/?engine=1&ui=authentic&view=card-studio`
- `/?engine=1&ui=authentic&view=official-porting`
- `/?engine=1&ui=authentic&view=harness`
- `/?engine=1&ui=authentic&view=ui-component-foundation`

## Screenshots

Screenshots and DOM metrics are saved under:

- `audit/screenshots/2026-05-06-ui-visual-audit/`
- `audit/screenshots/2026-05-06-ui-visual-audit/metrics.json`

Contact sheets:

- `audit/screenshots/2026-05-06-ui-visual-audit/desktop-contact-sheet.png`
- `audit/screenshots/2026-05-06-ui-visual-audit/mobile-contact-sheet.png`

Representative captures:

| Surface | Desktop screenshot | Mobile screenshot |
| --- | --- | --- |
| Legacy default | `desktop-legacy-default.png` | `mobile-legacy-default.png` |
| Diagnostic engine shell | `desktop-engine-shell.png` | `mobile-engine-shell.png` |
| Authentic pre-game | `desktop-authentic-pregame.png` | `mobile-authentic-pregame.png` |
| Authentic mulligan | `desktop-authentic-match-mulligan.png` | `mobile-authentic-match-mulligan.png` |
| Authentic match board | `desktop-authentic-match-board.png` | `mobile-authentic-match-board.png` |
| Deck builder | `desktop-authentic-deck-builder.png` | `mobile-authentic-deck-builder.png` |
| Card Studio | `desktop-authentic-card-studio.png` | `mobile-authentic-card-studio.png` |
| Official porting | `desktop-authentic-official-porting.png` | `mobile-authentic-official-porting.png` |
| Card harness | `desktop-authentic-harness.png` | `mobile-authentic-harness.png` |
| Component foundation | `desktop-authentic-component-foundation.png` | `mobile-authentic-component-foundation.png` |

## Inspection Method

- Captured Chromium screenshots at `1440x900` desktop and `390x900` mobile viewports.
- Used direct route loading for static surfaces.
- For the active match-board screenshot, completed the direct-route mulligan/start modal through real product controls before capture.
- Collected DOM metrics for document scroll size, horizontal overflow, visible button count, tiny text, off-viewport visible elements, console warnings, and page errors.
- Inspected screenshots visually after capture.

## Summary

The authentic desktop product now reads as one coherent parchment/card UI across pre-game, match, deck builder, Card Studio, and foundation pages. The newest cEp13 changes fixed the largest obvious polish gaps on the desktop product routes: deck builder and Card Studio now fill the viewport, score-card resources are much clearer, target labels are quieter, and the battle log is more legible.

The remaining obvious risks are concentrated in three places: mobile match usability, mobile authoring usability, and the non-authentic legacy/default route. Authentic routes did not emit runtime console errors in this audit and did not show document-level horizontal overflow. The legacy default route still emits a React DOM nesting warning and has mobile horizontal overflow.

## Findings

### P1 - Mobile Match Board Prioritizes Meta Panels Over Play

Evidence:

- `mobile-authentic-match-board.png`
- DOM metrics: mobile authentic match board has no document-level horizontal overflow, but scroll height is `2400px` for a `900px` viewport.

On mobile, the first viewport is mostly seed/status, AI score card, deck/discard panels, weather panel, human deck/discard panel, and the human score card. The actual board rows and human hand are below the first viewport. This is usable as a scroll page, but it does not feel like a mobile card game screen yet because the primary action surface is not immediately available.

Recommended direction:

- Treat mobile match as a dedicated layout, not just stacked desktop.
- Collapse deck/discard/weather panels into compact drawers or a single public-zones strip.
- Keep a compact sticky turn/action bar visible.
- Prioritize the active board rows and human hand above secondary score-card details.
- Defer this to a real mobile-match phase unless mobile play is a near-term goal; it is too structural for a tiny polish patch.

### P1 - Official Porting Did Not Receive The New Bounded Workspace Treatment

Evidence:

- `desktop-authentic-official-porting.png`
- `mobile-authentic-official-porting.png`
- DOM metrics: desktop official porting scroll height `12621px`; mobile official porting scroll height `14900px`; visible button count `198`.

Official Porting still behaves like a long document with a very large candidate list. That is acceptable for a temporary internal tool, but it now visually lags behind Deck Builder and Card Studio after cEp13 made those authoring workspaces viewport-spanning and internally scrollable.

Recommended direction:

- Apply the same full-viewport authoring shell used by Deck Builder and Card Studio.
- Bound the candidate list, review editor, and preview rail to internal scroll regions.
- Consider list virtualization or at least a denser candidate row layout before adding more review controls.
- This is a good small-to-medium cEp14 candidate if the route remains part of the active content workflow.

### P1 - Legacy Default Route Still Has Mobile Overflow And A React Warning

Evidence:

- `mobile-legacy-default.png`
- Console issue: `validateDOMNesting(...): <ul> cannot appear as a descendant of <p>`.
- DOM metrics: mobile legacy route document width `543px` for a `390px` viewport.

The legacy route is still the default `/`, so this remains user-facing unless route promotion happens soon. Visually, the disclaimer modal dominates the route, but the underlying card selector overflows mobile width and React emits a DOM nesting warning.

Recommended direction:

- If legacy remains default for more than one or two phases, fix the DOM nesting warning and mobile overflow.
- If authentic route promotion is imminent, document this as acceptable legacy debt and avoid spending design time there.

### P2 - Desktop Match Board Slightly Exceeds A 900px-Tall Viewport

Evidence:

- `desktop-authentic-match-board.png`
- DOM metrics: desktop active match board scroll height `1000px` for a `900px` viewport.

The desktop match screen looks coherent, but the hand is partly pushed below the first viewport at `1440x900`. The top status panel and six row bands leave little vertical room for the human hand.

Recommended direction:

- Reduce top status panel vertical padding.
- Make board rows slightly more compact on common laptop heights.
- Consider a viewport-fitted match shell where the hand remains visible without body scrolling.

### P2 - Mobile Deck Builder Needs A Dedicated Interaction Model

Evidence:

- `mobile-authentic-deck-builder.png`

The mobile deck builder no longer breaks horizontally, which is good. The issue is hierarchy: header actions wrap into a large grid, the deck list consumes the first content area, the card pool starts low, and the leader/preview rail competes with the deck editing flow.

Recommended direction:

- Convert mobile deck builder into tabbed or segmented sections: `decks`, `pool`, `deck`, `details`.
- Move secondary actions such as duplicate/reset/import/export/copy behind an actions menu.
- Keep `save` and `play` as the only persistent primary actions.
- Keep desktop mostly as-is.

### P2 - Mobile Card Studio Has The Same Authoring Density Problem

Evidence:

- `mobile-authentic-card-studio.png`

The route is responsive and does not horizontally overflow, but the authoring workflow stacks too many controls before the user reaches the actual field being edited. Preview/validation also compete with the form on the first screen.

Recommended direction:

- Use the same mobile authoring pattern as Deck Builder: `library`, `edit`, `preview/validation`.
- Put import/export/copy actions behind a secondary actions menu.
- Keep `save draft` / `save playable` prominent only inside the edit step.

### P2 - Mobile Mulligan Is Visually Strong But Still Vertically Tight

Evidence:

- `mobile-authentic-match-mulligan.png`

Mulligan works and reads well, but the opponent panel, hidden hand, player card, and opening hand all fight for vertical space. This is less severe than the match board because the flow is short and single-purpose.

Recommended direction:

- Keep for now.
- When mobile match layout is redesigned, fold mulligan into the same compact score/header strategy.

### P3 - Pre-Game Is In Good Shape, With Minor Mobile Density Tradeoffs

Evidence:

- `desktop-authentic-pregame.png`
- `mobile-authentic-pregame.png`

Pre-game is one of the stronger surfaces. It has clear steps, strong action hierarchy, and no obvious overflow. On mobile, the mode list continues below the fold, but that is acceptable because the bottom action bar remains reachable and the flow is not combat-critical.

Recommended direction:

- No urgent changes.
- Later, consider shrinking disabled future-mode cards on mobile if the list grows.

### P3 - Diagnostic / Foundation Routes Are Acceptable As Developer Surfaces

Evidence:

- `desktop-engine-shell.png`, `mobile-engine-shell.png`
- `desktop-authentic-harness.png`, `mobile-authentic-harness.png`
- `desktop-authentic-component-foundation.png`, `mobile-authentic-component-foundation.png`

The diagnostic shell, harness, and component foundation are long documents but do not need product-grade navigation. They remain useful for development and visual review.

Recommended direction:

- No urgent changes.
- Keep them out of route-promotion criteria except as visual regression surfaces.

## Positive Checks

- All authentic routes loaded without page errors.
- Authentic routes emitted no console warnings/errors during the audit.
- Authentic routes did not show document-level horizontal overflow at `390x900`.
- Deck Builder and Card Studio desktop viewport-spanning pass looks substantially better than the previous centered-frame screenshots.
- The authentic card, leader, gem, deck-count, and parchment visual language is now consistent across the main product routes.
- The latest score-card resources are readable and visually aligned on desktop and mobile.

## Suggested Improvement Order

1. **Before AI phase, small polish only:** fix desktop match first-viewport fit if it annoys during manual play.
2. **If authoring routes stay active:** apply cEp13 viewport/bounded-scroll treatment to Official Porting.
3. **Dedicated mobile phase:** redesign mobile match, Deck Builder, and Card Studio around task-specific tab/drawer layouts.
4. **Default-route decision:** either promote authentic UI soon or fix the legacy route's mobile overflow and DOM nesting warning.

## Checks Run

- `git status --short` before audit edits: clean.
- Playwright Chromium screenshot pass across 10 route states x 2 viewports: 20 screenshots, 0 failures.
- DOM metrics collection saved to `audit/screenshots/2026-05-06-ui-visual-audit/metrics.json`.

No code checks were required because this was documentation and screenshot capture only.

## Project State Update

`docs/PROJECT_STATE.md` was updated to point at this visual audit as the latest documentation-only UI audit. No implementation phase state was changed.

## Recommended Next Step

Discuss whether to address the visual audit's P1/P2 findings before the next AI phase. My recommendation is to avoid a broad redesign right now: either do one small cEp13 follow-up for desktop match viewport fit and Official Porting bounded workspace, or proceed to the next AI phase and schedule a dedicated mobile/product-layout phase later.
