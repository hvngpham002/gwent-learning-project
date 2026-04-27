import { expect, test } from "@playwright/test";

const engineUrl = "/?engine=1&seed=dp6-smoke";
const authenticPregameUrl = "/?engine=1&ui=authentic&seed=ep4-smoke";
const authenticDeckBuilderUrl = "/?engine=1&ui=authentic&view=deck-builder&seed=ep5-builder";
const authenticDirectUrl = "/?engine=1&ui=authentic&view=match&seed=ep4-direct";
const authenticHarnessUrl = "/?engine=1&ui=authentic&view=harness";

const visiblePageText = async (page: import("@playwright/test").Page) =>
  (await page.locator("body").innerText()).replace(/\s+/g, " ");

const expectNoHorizontalOverflow = async (page: import("@playwright/test").Page) => {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
};

const expectNoElementTextOverflow = async (page: import("@playwright/test").Page, selector: string) => {
  const overflow = await page.locator(selector).evaluateAll((elements) =>
    elements.map((element) => ({
      text: element.textContent?.replace(/\s+/g, " ").trim(),
      overflowX: element.scrollWidth - element.clientWidth,
      overflowY: element.scrollHeight - element.clientHeight,
    })),
  );

  for (const entry of overflow) {
    expect(entry, entry.text).toEqual(
      expect.objectContaining({
        overflowX: expect.any(Number),
        overflowY: expect.any(Number),
      }),
    );
    expect(entry.overflowX, entry.text).toBeLessThanOrEqual(1);
    expect(entry.overflowY, entry.text).toBeLessThanOrEqual(1);
  }
};

const expectSameVisualRow = async (page: import("@playwright/test").Page, selector: string) => {
  const boxes = await page.locator(selector).evaluateAll((elements) =>
    elements.map((element) => {
      const rect = element.getBoundingClientRect();
      return { top: rect.top, bottom: rect.bottom };
    }),
  );
  expect(boxes.length).toBeGreaterThan(1);
  const first = boxes[0];
  for (const box of boxes.slice(1)) {
    expect(Math.abs(box.top - first.top)).toBeLessThanOrEqual(1);
    expect(Math.abs(box.bottom - first.bottom)).toBeLessThanOrEqual(1);
  }
};

const collectPageErrors = (page: import("@playwright/test").Page): string[] => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
  });
  return pageErrors;
};

const confirmMulliganAndWaitForHumanTurn = async (page: import("@playwright/test").Page) => {
  await page.getByTestId("engine-confirm-mulligan").click();

  await expect(page.getByTestId("engine-status-banner")).toContainText(
    /Your turn: choose a playable card|Prompt: choose one legal|Round end:/,
  );
};

test("default route keeps the legacy app as the default", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByTestId("engine-shell")).toHaveCount(0);
  await expect(page.locator("body")).toContainText(/Gwent/i);
});

test("engine shell supports the dp6-smoke mulligan and first card play flow", async ({ page }) => {
  await page.goto(engineUrl);

  await expect(page.getByTestId("engine-shell")).toBeVisible();
  await expect(page.getByTestId("engine-status-banner")).toContainText(/Seed dp6-smoke/i);
  await expect(page.getByTestId("engine-status-banner")).toContainText(/AI legal-heuristic-v0/i);
  await expect(page.getByTestId("engine-status-banner")).toContainText(/Mulligan: select up to 2 cards/i);

  const aiSeat = page.getByTestId("engine-seat-ai");
  await expect(aiSeat).toContainText(/AI/i);
  await expect(aiSeat).toContainText(/hand \d+/i);
  await expect(aiSeat.getByTestId("engine-hand-card")).toHaveCount(0);

  await confirmMulliganAndWaitForHumanTurn(page);

  const activity = page.getByTestId("engine-recent-activity");
  await expect(activity).toContainText(/Human completed mulligan \(0 cards\)/);
  await expect(activity).toContainText(/AI completed mulligan \(0 cards\)/);
  await expect(activity).toContainText(/AI completed mulligan|AI played|AI passed|AI used leader|AI resolved prompt/);

  const activityTextAfterMulligan = await activity.innerText();
  expect(activityTextAfterMulligan).not.toMatch(/instanceId|sourceId|seat_b:\d{3}:/);

  await page.locator('[data-testid="engine-hand-card"]:not([disabled])').first().click();
  await expect(page.getByTestId("engine-target-groups")).toBeVisible();
  await expect(page.getByTestId("engine-target-action").first()).toBeVisible();

  await page.getByTestId("engine-target-action").first().click();
  await expect(activity).toContainText(/Human played/);
  await expect(page.getByTestId("engine-status-banner")).not.toContainText(/Adapter error/i);

  const pageText = await visiblePageText(page);
  expect(pageText).not.toMatch(/instanceId|sourceId|seat_b:\d{3}:/);
});

test("engine shell avoids horizontal overflow on a mobile viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto(engineUrl);

  await expect(page.getByTestId("engine-shell")).toBeVisible();
  await expect(page.getByTestId("engine-status-banner")).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await confirmMulliganAndWaitForHumanTurn(page);
  await expectNoHorizontalOverflow(page);

  await page.locator('[data-testid="engine-hand-card"]:not([disabled])').first().click();
  await expect(page.getByTestId("engine-target-action").first()).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test("authentic UI harness mounts on the opt-in authentic route", async ({ page }) => {
  const pageErrors = collectPageErrors(page);

  await page.goto(authenticHarnessUrl);

  await expect(page.getByTestId("authentic-ui-harness")).toBeVisible();
  await expect(page.getByTestId("engine-shell")).toHaveCount(0);

  const cards = page.getByTestId("authentic-card");
  await expect(cards.first()).toBeVisible();
  expect(await cards.count()).toBeGreaterThan(0);

  const back = page.getByTestId("authentic-card-back");
  await expect(back.first()).toBeVisible();

  const swatches = page.getByTestId("authentic-metadata-swatch");
  expect(await swatches.count()).toBeGreaterThan(0);

  const harnessText = await visiblePageText(page);
  expect(harnessText).not.toMatch(/instanceId|sourceId|seat_b:\d{3}:|seat_a:\d{3}:/);
  expect(pageErrors).toEqual([]);
});

test("authentic UI harness avoids horizontal overflow on a mobile viewport", async ({ page }) => {
  const pageErrors = collectPageErrors(page);

  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto(authenticHarnessUrl);

  await expect(page.getByTestId("authentic-ui-harness")).toBeVisible();
  await expect(page.getByTestId("authentic-card").first()).toBeVisible();
  await expectNoHorizontalOverflow(page);
  expect(pageErrors).toEqual([]);
});

test("authentic pre-game starts a configured match without hidden leaks", async ({ page }) => {
  const pageErrors = collectPageErrors(page);

  await page.goto(authenticPregameUrl);

  await expect(page.getByTestId("authentic-pregame")).toBeVisible();
  await expect(page.getByTestId("authentic-match-screen")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Prepare for Battle" })).toBeVisible();
  await expect(page.getByText(/Step 1 - choose deck/i)).toBeVisible();
  await expect(page.getByText(/Step 2 - game mode/i)).toBeVisible();
  await expect(page.getByTestId("authentic-pregame-begin")).toBeVisible();
  await expect(page.getByTestId("authentic-pregame-begin")).toContainText("Begin Match →");
  await expect(page.getByTestId("authentic-pregame-begin")).toHaveCSS("color", "rgb(255, 255, 255)");
  await expect(page.getByTestId("authentic-pregame-begin")).toHaveCSS("font-weight", "700");
  await expect(page.getByTestId("authentic-pregame-begin")).toBeEnabled();
  await expect(page.getByTestId("authentic-pregame-seed")).toHaveValue("ep4-smoke");
  await expect(page.getByTestId("authentic-pregame-copy-seed")).toHaveText("copy");
  expect(await page.getByTestId("authentic-pregame-deck-option").count()).toBeGreaterThanOrEqual(2);
  await expect(page.getByTestId("authentic-pregame-deck-option").first()).not.toContainText(/Lord Commander|Clear Weather/i);
  await expect(page.locator(".authentic-pregame__deck-copy strong").first()).toHaveCSS("font-style", "italic");
  await expect(page.locator(".authentic-pregame__deck-copy strong").first()).toHaveCSS("text-transform", "none");
  await expect(page.getByTestId("authentic-pregame-create-deck")).toBeEnabled();
  await expect(page.getByTestId("authentic-pregame-edit-decks")).toBeEnabled();
  await expect(page.getByTestId("authentic-pregame-create-deck").locator(".authentic-pregame__builder-entry-text")).toHaveCSS("font-style", "italic");
  await expect(page.getByTestId("authentic-pregame-create-deck").locator(".authentic-pregame__builder-entry-text")).toHaveCSS("font-size", "12px");
  await expect(page.getByTestId("authentic-pregame-create-deck").locator(".authentic-pregame__builder-entry-text")).toHaveCSS("text-transform", "none");
  await expect(page.getByTestId("authentic-leader-card").first()).toBeVisible();
  await expect(page.getByTestId("authentic-pregame-mode-option").filter({ hasText: "Casual" })).toBeVisible();
  await expect(page.getByTestId("authentic-pregame-mode-option").filter({ hasText: "Ranked" })).toBeDisabled();
  await expect(page.getByTestId("authentic-pregame-round-option").filter({ hasText: "Standard" })).toBeVisible();
  await expect(page.getByTestId("authentic-pregame-round-option").filter({ hasText: "Standard" })).toHaveClass(/is-selected/);
  await expect(page.getByTestId("authentic-pregame-round-option").filter({ hasText: "Instant Death" })).toBeDisabled();
  await expect(page.getByTestId("authentic-pregame-format-option").filter({ hasText: "Bo3" })).toBeVisible();
  await expect(page.getByTestId("authentic-pregame-format-option").filter({ hasText: "Bo3" })).toHaveClass(/is-selected/);
  await expect(page.getByTestId("authentic-pregame-format-option").filter({ hasText: "Bo1" })).toBeDisabled();
  await expect(page.getByTestId("authentic-pregame-format-option").filter({ hasText: "Training" })).toBeDisabled();
  await expect(page.locator(".authentic-pregame__control-grid")).not.toContainText(/two gems|one gem|two-gem|coming later/i);
  await expect(page.getByTestId("authentic-pregame-round-option").filter({ hasText: "Standard" })).toHaveCSS("font-size", "10px");
  await expect(page.getByTestId("authentic-pregame-format-option").filter({ hasText: "Bo3" })).toHaveCSS("font-size", "10px");
  await expectNoElementTextOverflow(page, ".authentic-pregame__segment-option");
  await expectSameVisualRow(page, "[data-testid='authentic-pregame-round-option']");
  await expectSameVisualRow(page, "[data-testid='authentic-pregame-format-option']");

  const leaderImage = page.getByTestId("authentic-leader-card-image").first();
  await expect(leaderImage).toBeVisible();
  await expect(leaderImage).toHaveCSS("object-fit", "contain");

  const pregameText = await visiblePageText(page);
  expect(pregameText).toContain("legal-heuristic-v0");
  expect(pregameText).not.toMatch(/instanceId|sourceId|seat_b:\d{3}:|seat_a:\d{3}:/);

  await page.getByTestId("authentic-pregame-begin").click();

  await expect(page.getByTestId("authentic-match-screen")).toBeVisible();
  await expect(page.getByTestId("engine-shell")).toHaveCount(0);
  await expect(page.locator(".authentic-match__seed")).toContainText(/Seed ep4-smoke/i);
  await expect(page.locator(".authentic-match__seed")).toContainText(/legal-heuristic-v0/i);
  await expect(page.getByTestId("authentic-leader-card").first()).toBeVisible();
  const matchLeaderBox = await page.getByTestId("authentic-leader-card").first().boundingBox();
  expect(matchLeaderBox?.width ?? 0).toBeGreaterThanOrEqual(84);
  expect(matchLeaderBox?.width ?? 0).toBeLessThan(100);
  expect(matchLeaderBox?.height ?? 0).toBeGreaterThanOrEqual(140);
  expect(matchLeaderBox?.height ?? 0).toBeLessThan(160);
  await expect(page.getByTestId("authentic-leader-card-image").first()).toHaveCSS("object-fit", "contain");
  await expect(page.getByTestId("authentic-seat-ai")).toContainText(/hand \d+/i);
  await expect(page.getByTestId("authentic-seat-ai").getByTestId("authentic-hand-card")).toHaveCount(0);

  await page.getByTestId("authentic-discard-trigger-ai").click();
  await expect(page.getByTestId("authentic-discard-browser")).toBeVisible();
  await expect(page.getByTestId("authentic-discard-empty")).toBeVisible();
  await page.getByTestId("authentic-discard-close").click();

  await page.getByTestId("authentic-discard-trigger-human").click();
  await expect(page.getByTestId("authentic-discard-browser")).toBeVisible();
  await page.getByTestId("authentic-discard-close").click();

  await page.getByTestId("authentic-confirm-mulligan").click();
  await expect(page.getByTestId("authentic-human-hand")).toBeVisible();

  await page.locator(".authentic-hand__card.is-playable [data-testid='authentic-hand-card']").first().click();
  await expect(page.getByTestId("authentic-target-groups")).toBeVisible();
  await expect(page.getByTestId("authentic-target-action").first()).toBeVisible();
  await page.getByTestId("authentic-target-action").first().click();

  const activity = page.getByTestId("authentic-recent-activity");
  await expect(activity).toContainText(/Human played/);
  await expect(activity).toContainText(/AI completed mulligan|AI played|AI passed|AI used leader|AI resolved prompt/);
  await expect(page.getByTestId("authentic-effective-strength").first()).toBeVisible();
  await expect(page.locator(".authentic-board-card__strength")).toHaveCount(0);

  const passButton = page.getByTestId("authentic-pass");
  await expect(passButton).toBeEnabled();
  await passButton.click();
  await expect(activity).toContainText(/Human passed/);

  const pageText = await visiblePageText(page);
  expect(pageText).not.toMatch(/instanceId|sourceId|seat_b:\d{3}:|seat_a:\d{3}:/);
  expect(pageErrors).toEqual([]);
});

test("authentic deck builder opens, edits, and starts a hidden-safe match", async ({ page }) => {
  const pageErrors = collectPageErrors(page);

  await page.goto(authenticPregameUrl);
  await page.getByTestId("authentic-pregame-create-deck").click();
  await expect(page.getByTestId("authentic-deck-builder")).toBeVisible();
  await expect(page.getByTestId("authentic-deck-builder-faction")).toBeVisible();
  await expect(page.getByText(/Choose a faction, then add cards/i)).toBeVisible();
  await page.getByRole("button", { name: "← back" }).click();
  await expect(page.getByTestId("authentic-pregame")).toBeVisible();
  await page.evaluate(() => window.localStorage.removeItem("gwent_authentic_decks_v1"));

  await page.getByTestId("authentic-pregame-edit-decks").click();
  await expect(page.getByTestId("authentic-deck-builder")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Deck Builder" })).toBeVisible();

  await page.goto(authenticDeckBuilderUrl);
  await expect(page.getByTestId("authentic-deck-builder")).toBeVisible();
  await expect(page.getByTestId("authentic-deck-builder-deck-list")).toBeVisible();
  await expect(page.getByTestId("authentic-deck-builder-card-pool")).toBeVisible();
  await expect(page.getByTestId("authentic-deck-builder-stats")).toBeVisible();
  await expect(page.getByTestId("authentic-deck-builder-leader")).toBeVisible();
  await expect(page.getByRole("button", { name: "+ New" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Import" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Export .json" })).toBeVisible();
  await expect(page.getByRole("button", { name: "copy" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Save" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Play →" })).toBeEnabled();
  await expect(page.getByRole("button", { name: "Duplicate" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Reset to catalog" })).toBeEnabled();

  const total = page.getByTestId("authentic-deck-builder-total");
  const before = await total.innerText();
  await page.locator(".authentic-deck-builder__deck-card button").first().click();
  await expect(total).not.toHaveText(before);
  await page.getByRole("button", { name: "Reset to catalog" }).click();
  await expect(page.getByTestId("authentic-deck-builder-confirmation")).toBeVisible();
  await page.getByTestId("authentic-deck-builder-confirm-action").click();
  await expect(total).toHaveText(before);
  await page.getByRole("button", { name: "Duplicate" }).click();
  await expect(page.getByLabel("Deck name")).toHaveValue(/Current Northern Realms 2/);
  await page.locator(".authentic-deck-builder__deck-card button").first().click();
  await page.getByRole("button", { name: /Geralt of Rivia/i }).last().click();
  await expect(total).toHaveText(before);

  await page.getByRole("button", { name: "Play →" }).click();
  await expect(page.getByTestId("authentic-match-screen")).toBeVisible();
  await expect(page.locator(".authentic-match__seed")).toContainText(/Seed ep5-builder/i);
  await expect(page.locator(".authentic-match__seed")).toContainText(/legal-heuristic-v0/i);
  await expect(page.getByTestId("authentic-seat-ai")).toContainText(/hand \d+/i);
  await expect(page.getByTestId("authentic-seat-ai").getByTestId("authentic-hand-card")).toHaveCount(0);

  const pageText = await visiblePageText(page);
  expect(pageText).not.toMatch(/instanceId|sourceId|seat_b:\d{3}:|seat_a:\d{3}:/);
  expect(pageErrors).toEqual([]);
});

test("authentic deck builder disables special adds at the composition cap", async ({ page }) => {
  const pageErrors = collectPageErrors(page);

  await page.addInitScript(() => {
    window.localStorage.setItem(
      "gwent_authentic_decks_v1",
      JSON.stringify({
        schemaVersion: "authentic-decks-v1",
        activePresetId: "local-special-cap",
        decks: [
          {
            presetId: "local-special-cap",
            name: "Special Cap Check",
            faction: "northern_realms",
            leaderSourceId: "northern-realms.foltest-lord-commander-of-the-north",
            mainDeck: [
              { sourceId: "neutral.decoy", count: 3 },
              { sourceId: "neutral.commanders-horn", count: 3 },
              { sourceId: "neutral.scorch", count: 3 },
              { sourceId: "neutral.biting-frost", count: 1 },
            ],
            sideDeck: [],
          },
        ],
      }),
    );
  });

  await page.goto(authenticDeckBuilderUrl);
  await expect(page.getByTestId("authentic-deck-builder")).toBeVisible();
  await page.getByRole("button", { name: "specials" }).click();
  await expect(page.getByTestId("authentic-deck-builder-specials")).toContainText("10 / 10 max");
  const fogPoolItem = page.locator('[data-source-id="neutral.impenetrable-fog"]');
  await expect(fogPoolItem).toHaveAttribute("title", /special cap reached/);
  await expect(fogPoolItem.getByTestId("authentic-card")).toHaveAttribute("role", "img");
  await fogPoolItem.locator("[data-testid='authentic-card']").click({ force: true });
  await expect(page.getByTestId("authentic-deck-builder-specials")).toContainText("10 / 10 max");

  expect(pageErrors).toEqual([]);
});

test("authentic pre-game, deck builder, and direct match avoid horizontal overflow on a mobile viewport", async ({ page }) => {
  const pageErrors = collectPageErrors(page);

  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto(authenticPregameUrl);

  await expect(page.getByTestId("authentic-pregame")).toBeVisible();
  await expect(page.getByTestId("authentic-leader-card").first()).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await page.getByTestId("authentic-pregame-edit-decks").click();
  await expect(page.getByTestId("authentic-deck-builder")).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await page.getByRole("button", { name: "← back" }).click();
  await expect(page.getByTestId("authentic-pregame")).toBeVisible();
  await page.getByTestId("authentic-pregame-round-option").filter({ hasText: "Standard" }).click();
  await page.getByTestId("authentic-pregame-format-option").filter({ hasText: "Bo3" }).click();
  await page.getByTestId("authentic-pregame-begin").click();

  await expect(page.getByTestId("authentic-match-screen")).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await page.getByTestId("authentic-confirm-mulligan").click();
  await expect(page.locator(".authentic-hand__card.is-playable [data-testid='authentic-hand-card']").first()).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await page.getByTestId("authentic-discard-trigger-human").click();
  await expect(page.getByTestId("authentic-discard-browser")).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await page.goto(authenticDirectUrl);
  await expect(page.getByTestId("authentic-match-screen")).toBeVisible();
  await expect(page.locator(".authentic-match__seed")).toContainText(/Seed ep4-direct/i);
  await expectNoHorizontalOverflow(page);
  expect(pageErrors).toEqual([]);
});
