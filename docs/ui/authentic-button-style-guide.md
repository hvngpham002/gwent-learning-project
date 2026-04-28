# Authentic Button Style Guide

## Scope

This guide covers the authentic product UI under `.gwent-authentic`, including normal and debug routes. It does not cover the legacy route or the diagnostic engine shell.

All standard buttons must use the shared base class:

```tsx
className="authentic-button authentic-button--<variant>"
```

React code should prefer `AuthenticButton` from `src/components/gwent/AuthenticButton.tsx` when rendering standard buttons. Hand-written classes are still allowed for narrow legacy/spatial exceptions, but alerts, toasts, modals, and component-foundation previews must use `AuthenticButton`.

Screen-local classes may be added after the shared classes for layout only. They should not redefine core button background, foreground, border, font family, hover state, disabled state, or text transform.

Standard button labels render lowercase through the shared base class. New product-flow labels should also be written lowercase in JSX where practical so visible text and accessible names match. Use the real right-arrow glyph `→` for forward flow actions; do not use `->` or `-->`.

## Variants

| Variant | Use | Default | Hover |
|---|---|---|---|
| `authentic-button--primary` | Main commitment or flow advance: begin match, play/start/import confirmation, mulligan confirm/start, next round | orange background, white text, dark accent border | black border, transparent background, orange text |
| `authentic-button--secondary` | Neutral utility or legal action: save, copy, target action, prompt option, pass, leader | transparent background, ink text, rule border | black border, light accent tint, orange text |
| `authentic-button--ghost` | Navigation, cancel, review, close, low-emphasis actions | transparent background, secondary ink text | black border, orange text |
| `authentic-button--destructive` | Data loss or destructive confirmation: delete, return to setup, reset | dark red background, parchment text | black border, transparent background, dark red text |
| `authentic-button--tile` | Large selectable tiles with internal layout: deck options, mode cards, deck-list rows, Medic choices | pale ink tint | black border/orange text; selected state uses accent border/tint |
| `authentic-button--choice` | Compact segmented choices and filters | transparent | black border/orange text; selected state uses accent border/tint |
| `authentic-button--field` | Custom select/listbox trigger | paper background, ink text | follows field/listbox state |
| `authentic-button--icon` | Small icon-only or symbol buttons | compact square hit target | ghost/secondary/destructive variant hover |

Size modifiers:

- `authentic-button--flow`: semantic marker for primary flow actions. It does not enlarge or widen the button.
- `authentic-button--compact`: use in tight panels, alerts, filters, and utility rows.

## Audited Surfaces

- Pre-game:
  - `begin match →` is `primary flow`.
  - menu/back and deck-builder navigation are `ghost`.
  - seed `copy` is `secondary compact`.
  - deck and mode selections are `tile`.
  - round/format options are `choice compact`.
- Mulligan:
  - `keep hand`, `confirm mulligan`, and post-review `start match` are `primary flow`.
  - setup navigation is `ghost`.
  - Debug AI reveal text is not a button and has no variant.
- Match:
  - top-bar `rematch` and `setup` are `ghost`.
  - leader, pass, legal target, and prompt options are `secondary`.
  - round-end `resolve` is `primary`.
  - round overlay `next round →` is `primary` and uses the same alert action proportions as seal actions.
  - discard close is `ghost compact`.
- Deck builder:
  - Play/import-confirm are `primary`.
  - new/duplicate/reset/import/export/copy/save are `secondary`.
  - deck list rows are `tile`.
  - filters are `choice compact`.
  - delete and destructive confirmations are `destructive`.
  - card remove buttons are `icon ghost`.
- Alerts/modals/toasts:
  - `Alert` maps action kind and size to `AuthenticButton` variants.
  - ledger and seal alerts use the same default button proportions; use `compact` only for explicitly tight alert layouts.
  - `StartMatchModal` and `ReturnToSetupModal` use `ModalButton`, which wraps `AuthenticButton`.
  - toast dismiss uses `AuthenticButton` as `icon ghost`.
- Listbox:
  - custom triggers use `field`.
- Component foundation:
  - `/?engine=1&ui=authentic&view=ui-component-foundation` renders all shared button variants and states for review.

## Exceptions

Some elements are technically `<button>` for accessibility but are not standard buttons:

- playable cards and hand cards;
- board-row legal target surfaces;
- board-card legal target surfaces;
- deck/discard pile spatial surfaces.

These keep their board/card/pile visual treatment because their shape communicates spatial game state. Do not apply `authentic-button` to these unless the visual model changes.

## Rules

- Do not add new screen-local button color systems.
- Do not set button letter spacing above `0`; the shared class owns typography.
- Do not override the shared lowercase transform for standard buttons unless the component is an explicit spatial exception.
- Use `primary flow` sparingly. A screen should normally have one visible flow-advancing primary action.
- Hidden-info/debug routes must use the same button variants as product routes. Debug-only text can be visibly marked, but debug-only buttons should not invent styling.
