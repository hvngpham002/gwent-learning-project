import { expect, test } from "@playwright/test";

const engineUrl = "/?engine=1&seed=dp6-smoke";
const authenticPregameUrl = "/?engine=1&ui=authentic&seed=ep4-smoke";
const authenticPregameRestartUrl = "/?engine=1&ui=authentic&seed=ep4-restart&debugAiMulligan=1&debugAiMulliganCount=0";
const authenticDeckBuilderUrl = "/?engine=1&ui=authentic&view=deck-builder&seed=ep5-builder";
const authenticDirectUrl = "/?engine=1&ui=authentic&view=match&seed=ep4-direct";
const authenticMulliganDebugUrl = "/?engine=1&ui=authentic&view=match&seed=ep4-debug&debugAiMulligan=1&debugAiMulliganCount=2";
const authenticMulliganKeepDebugUrl = "/?engine=1&ui=authentic&view=match&seed=ep4-keep&debugAiMulligan=1&debugAiMulliganCount=0";
const authenticHarnessUrl = "/?engine=1&ui=authentic&view=harness";
const authenticComponentFoundationUrl = "/?engine=1&ui=authentic&view=ui-component-foundation";

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

test("authentic component foundation page mounts shared UI primitives", async ({ page }) => {
  const pageErrors = collectPageErrors(page);

  await page.goto(authenticComponentFoundationUrl);

  await expect(page.getByTestId("authentic-component-foundation")).toBeVisible();
  await expect(page.getByTestId("authentic-foundation-buttons")).toBeVisible();
  await expect(page.getByTestId("authentic-foundation-fonts")).toBeVisible();
  await expect(page.getByTestId("authentic-foundation-forms")).toBeVisible();
  await expect(page.getByTestId("authentic-foundation-cards")).toBeVisible();
  await expect(page.getByTestId("authentic-foundation-alerts")).toBeVisible();
  await expect(page.getByTestId("authentic-foundation-game-surfaces")).toBeVisible();
  await expect(page.getByTestId("authentic-foundation-listbox")).toBeVisible();
  await expect(page.getByRole("button", { name: "primary flow" })).toHaveCSS("background-color", "rgb(138, 58, 31)");
  await expect(page.getByTestId("authentic-foundation-font-authentic-display")).toContainText("Round resolved");
  await expect(page.getByTestId("authentic-foundation-font-authentic-display")).toHaveCSS(
    "font-family",
    /EB Garamond/,
  );
  await expect(page.getByTestId("authentic-foundation-font-authentic-display")).toHaveCSS("font-style", "normal");
  await expect(page.getByTestId("authentic-foundation-font-authentic-mono")).toHaveCSS("font-family", /JetBrains Mono/);
  await expect(page.getByTestId("authentic-foundation-font-legacy-body")).toHaveCSS("font-family", /Inter/);
  await expect(page.getByTestId("authentic-foundation-fonts")).toContainText("Loaded Weights");
  await expect(page.getByRole("button", { name: "primary flow" })).toHaveCSS("color", "rgb(255, 255, 255)");
  await expect(page.getByRole("button", { name: "primary flow" })).toHaveCSS("font-size", "13px");
  await expect(page.getByRole("button", { name: "primary flow" })).toHaveCSS("font-style", "normal");
  await expect(page.getByRole("button", { name: "primary flow" })).toHaveCSS("min-width", "0px");
  await expect(page.getByRole("button", { name: "next round →" })).toHaveClass(/authentic-button--primary/);
  await expect(page.getByRole("button", { name: "next round →" })).not.toHaveClass(/authentic-button--flow/);
  await expect(page.getByRole("button", { name: "next round →" })).toHaveCSS("min-width", "0px");
  await expect(page.getByRole("button", { name: "next round →" })).toHaveCSS("font-size", "13px");
  await expect(page.getByRole("button", { name: "close" })).toHaveClass(/authentic-button--ghost/);
  await expect(page.getByRole("button", { name: "cancel" })).toHaveClass(/authentic-button--ghost/);
  await expect(page.getByRole("button", { name: "close" })).not.toHaveClass(/authentic-button--compact/);
  await expect(page.getByRole("button", { name: "cancel" })).not.toHaveClass(/authentic-button--compact/);
  await expect(page.getByRole("button", { name: "close" })).toHaveCSS("font-size", "13px");
  await expect(page.getByRole("button", { name: "cancel" })).toHaveCSS("font-size", "13px");
  const actionHeights = await Promise.all(
    ["primary flow", "next round →", "close", "cancel", "delete"].map(async (name) => {
      const box = await page.getByRole("button", { name }).boundingBox();
      return box?.height ?? 0;
    }),
  );
  const [primaryFlowHeight, nextRoundHeight, closeHeight, cancelHeight, deleteHeight] = actionHeights;
  for (const height of [primaryFlowHeight, nextRoundHeight, closeHeight, deleteHeight]) {
    expect(Math.abs(height - cancelHeight)).toBeLessThanOrEqual(2);
  }

  await page.getByTestId("authentic-foundation-toast-button").click();
  await expect(page.getByTestId("authentic-toast")).toBeVisible();
  await expect(page.getByLabel("dismiss notification")).toHaveClass(/authentic-button--icon/);
  await page.getByLabel("dismiss notification").click();
  await expect(page.getByTestId("authentic-toast")).toHaveCount(0);

  await page.getByTestId("authentic-foundation-start-modal").click();
  await expect(page.getByTestId("authentic-start-match-confirmation")).toBeVisible();
  await expect(page.getByTestId("authentic-start-match-confirm")).toHaveClass(/authentic-button--primary/);
  await page.getByTestId("authentic-start-match-review").click();
  await expect(page.getByTestId("authentic-start-match-confirmation")).toHaveCount(0);

  const foundationText = await visiblePageText(page);
  expect(foundationText).not.toMatch(/instanceId|sourceId|seat_b:\d{3}:|seat_a:\d{3}:/);
  await expectNoHorizontalOverflow(page);
  expect(pageErrors).toEqual([]);
});

test("authentic component foundation page avoids horizontal overflow on mobile", async ({ page }) => {
  const pageErrors = collectPageErrors(page);

  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto(authenticComponentFoundationUrl);

  await expect(page.getByTestId("authentic-component-foundation")).toBeVisible();
  await expect(page.getByTestId("authentic-foundation-buttons")).toBeVisible();
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
  await expect(page.getByTestId("authentic-pregame-begin")).toContainText("begin match →");
  await expect(page.getByTestId("authentic-pregame-begin")).toHaveCSS("background-color", "rgb(138, 58, 31)");
  await expect(page.getByTestId("authentic-pregame-begin")).toHaveCSS("color", "rgb(255, 255, 255)");
  await expect(page.getByTestId("authentic-pregame-begin")).toHaveCSS("font-size", "13px");
  await expect(page.getByTestId("authentic-pregame-begin")).toHaveCSS("min-width", "0px");
  await expect(page.getByTestId("authentic-pregame-begin")).toHaveCSS("font-weight", "700");
  await expect(page.getByTestId("authentic-pregame-begin")).toBeEnabled();
  await expect(page.getByTestId("authentic-pregame-seed")).toHaveValue("ep4-smoke");
  await expect(page.getByTestId("authentic-pregame-copy-seed")).toHaveText("copy");
  expect(await page.getByTestId("authentic-pregame-deck-option").count()).toBeGreaterThanOrEqual(2);
  await expect(page.getByTestId("authentic-pregame-deck-option").first()).not.toContainText(/Lord Commander|Clear Weather/i);
  await expect(page.locator(".authentic-pregame__deck-copy strong").first()).toHaveCSS("font-style", "normal");
  await expect(page.locator(".authentic-pregame__deck-copy strong").first()).toHaveCSS("text-transform", "none");
  await expect(page.getByTestId("authentic-pregame-create-deck")).toBeEnabled();
  await expect(page.getByTestId("authentic-pregame-edit-decks")).toBeEnabled();
  await expect(page.getByTestId("authentic-pregame-create-deck").locator(".authentic-pregame__builder-entry-text")).toHaveCSS("font-style", "normal");
  await expect(page.getByTestId("authentic-pregame-create-deck").locator(".authentic-pregame__builder-entry-text")).toHaveCSS("font-size", "13px");
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
  await expect(page.getByTestId("authentic-pregame-round-option").filter({ hasText: "Standard" })).toHaveCSS("font-size", "11px");
  await expect(page.getByTestId("authentic-pregame-format-option").filter({ hasText: "Bo3" })).toHaveCSS("font-size", "11px");
  await expectNoElementTextOverflow(page, ".authentic-pregame__segment-option");
  await expectSameVisualRow(page, "[data-testid='authentic-pregame-round-option']");
  await expectSameVisualRow(page, "[data-testid='authentic-pregame-format-option']");

  const leaderImage = page.getByTestId("authentic-leader-card-image").first();
  await expect(leaderImage).toBeVisible();
  await expect(leaderImage).toHaveCSS("object-fit", "contain");

  const pregameText = await visiblePageText(page);
  expect(pregameText).toContain("legal-heuristic-v0");
  expect(pregameText).not.toMatch(/instanceId|sourceId|seat_b:\d{3}:|seat_a:\d{3}:/);

  await page.getByTestId("authentic-pregame-begin").hover();
  await expect(page.getByTestId("authentic-pregame-begin")).toHaveCSS("border-top-color", "rgb(0, 0, 0)");
  await expect(page.getByTestId("authentic-pregame-begin")).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  await expect(page.getByTestId("authentic-pregame-begin")).toHaveCSS("color", "rgb(138, 58, 31)");

  await page.getByTestId("authentic-pregame-begin").click();

  await expect(page.getByTestId("authentic-mulligan-screen")).toBeVisible();
  await expect(page.getByTestId("authentic-match-screen")).toHaveCount(0);
  await expect(page.locator(".authentic-mulligan__seed")).toContainText(/Seed ep4-smoke/i);
  await expect(page.locator(".authentic-mulligan__seed")).toContainText(/legal-heuristic-v0/i);
  await expect(page.getByTestId("authentic-mulligan-ai")).toContainText(/hand \d+/i);
  await expect(page.getByTestId("authentic-mulligan-ai").getByTestId("authentic-mulligan-card")).toHaveCount(0);
  await expect(page.getByTestId("authentic-mulligan-ai").getByTestId("authentic-card-back")).toHaveCount(10);
  await expect(page.getByTestId("authentic-ai-mulligan-debug")).toHaveCount(0);
  await expect(page.getByTestId("authentic-ai-debug-card")).toHaveCount(0);
  await expect(page.getByTestId("authentic-confirm-mulligan")).toHaveText("keep hand");
  await expect(page.getByTestId("authentic-confirm-mulligan")).toBeEnabled();
  await expect(page.getByTestId("authentic-confirm-mulligan")).toHaveCSS("background-color", "rgb(138, 58, 31)");
  await expect(page.getByTestId("authentic-confirm-mulligan")).toHaveCSS("color", "rgb(255, 255, 255)");
  await page.getByTestId("authentic-confirm-mulligan").hover();
  await expect(page.getByTestId("authentic-confirm-mulligan")).toHaveCSS("border-top-color", "rgb(0, 0, 0)");
  await expect(page.getByTestId("authentic-confirm-mulligan")).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  await expect(page.getByTestId("authentic-confirm-mulligan")).toHaveCSS("color", "rgb(138, 58, 31)");
  const firstMulliganCard = page.getByTestId("authentic-mulligan-card").first();
  await firstMulliganCard.click();
  await expect(page.getByTestId("authentic-mulligan-status")).toContainText(/1\/1 select: .+/);
  await expect(page.getByTestId("authentic-confirm-mulligan")).toHaveText("confirm mulligan");
  await firstMulliganCard.click();
  await expect(page.getByTestId("authentic-mulligan-status")).toContainText("0/1 selected");
  await expect(page.getByTestId("authentic-confirm-mulligan")).toHaveText("keep hand");
  await page.getByTestId("authentic-mulligan-setup").click();
  await expect(page.getByTestId("authentic-abandon-confirmation")).toBeVisible();
  await page.getByRole("button", { name: "stay" }).click();
  await expect(page.getByTestId("authentic-mulligan-screen")).toBeVisible();

  const mulliganText = await visiblePageText(page);
  expect(mulliganText).not.toMatch(/instanceId|sourceId|seat_b:\d{3}:|seat_a:\d{3}:/);

  await firstMulliganCard.click();
  await page.getByTestId("authentic-confirm-mulligan").click();

  await expect(page.getByTestId("authentic-mulligan-status")).toContainText("Redrawing 1 card");
  await expect(page.locator('[data-human-mulligan-state="redrawn"]')).toHaveCount(1);
  await expect(page.locator(".authentic-mulligan__cards")).toHaveCSS("overflow-y", "hidden");
  await expect(page.locator(".authentic-mulligan__cards")).toHaveCSS("scrollbar-width", "none");
  await expect(page.locator(".authentic-mulligan__hand-panel .authentic-card.is-dimmed")).toHaveCount(0);
  await expect(page.getByTestId("authentic-confirm-mulligan")).toHaveText("keep hand");

  await page.getByTestId("authentic-mulligan-card").first().click();
  await expect(page.getByTestId("authentic-mulligan-status")).toContainText(/1\/1 select: .+/);
  await page.getByTestId("authentic-confirm-mulligan").click();
  await expect(page.getByTestId("authentic-mulligan-status")).toContainText("Redrawing 1 card");
  await expect(page.locator('[data-human-mulligan-state="redrawn"]')).toHaveCount(1);
  await expect(page.locator(".authentic-mulligan__cards")).toHaveCSS("overflow-y", "hidden");
  await expect(page.locator(".authentic-mulligan__cards")).toHaveCSS("scrollbar-width", "none");
  await expect(page.locator(".authentic-mulligan__hand-panel .authentic-card.is-dimmed")).toHaveCount(0);
  await expect(page.getByTestId("authentic-ai-mulligan-thinking")).toBeVisible();
  await expect(page.getByTestId("authentic-mulligan-status")).toContainText("AI is choosing mulligans");
  await expect(page.getByTestId("authentic-confirm-mulligan")).toHaveText("ai choosing");

  await expect(page.getByTestId("authentic-mulligan-screen")).toBeVisible();
  await expect(page.getByTestId("authentic-mulligan-status")).toContainText(/AI keeps hand|AI redraws \d+ cards?/);
  await expect(page.getByTestId("authentic-start-match-confirmation")).toBeVisible();
  await expect(page.locator(".authentic-modal-shell")).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  await expect(page.getByTestId("authentic-start-match-review")).toHaveText("review hand");
  await expect(page.getByTestId("authentic-start-match-confirm")).toContainText("start match →");
  await expect(page.getByTestId("authentic-confirm-mulligan")).toHaveText("start match");
  await expect(page.getByTestId("authentic-mulligan-status")).toContainText("AI mulligan complete");
  await expect(page.getByTestId("authentic-confirm-mulligan")).toHaveCSS("opacity", "1");
  await expect(page.getByTestId("authentic-ai-mulligan-back")).toHaveCount(10);
  await expect(page.getByTestId("authentic-ai-mulligan-debug")).toHaveCount(0);
  await expect(page.getByTestId("authentic-ai-debug-card")).toHaveCount(0);
  const aiMulliganText = await visiblePageText(page);
  expect(aiMulliganText).not.toMatch(/instanceId|sourceId|seat_b:\d{3}:|seat_a:\d{3}:/);

  await expect(page.getByTestId("authentic-match-screen")).toHaveCount(0);
  await page.getByTestId("authentic-start-match-review").click();
  await expect(page.getByTestId("authentic-start-match-confirmation")).toHaveCount(0);
  await page.getByTestId("authentic-confirm-mulligan").click();
  await expect(page.getByTestId("authentic-start-match-confirmation")).toBeVisible();
  await expect(page.getByTestId("authentic-match-screen")).toHaveCount(0);
  await page.getByTestId("authentic-start-match-confirm").click();
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
  await page.getByRole("button", { name: "setup" }).click();
  await expect(page.getByTestId("authentic-abandon-confirmation")).toBeVisible();
  await expect(page.locator(".authentic-modal-shell")).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  await page.getByRole("button", { name: "stay" }).click();

  await page.getByTestId("authentic-discard-trigger-ai").click();
  await expect(page.getByTestId("authentic-discard-browser")).toBeVisible();
  await expect(page.getByTestId("authentic-discard-empty")).toBeVisible();
  await page.getByTestId("authentic-discard-close").click();

  await page.getByTestId("authentic-discard-trigger-human").click();
  await expect(page.getByTestId("authentic-discard-browser")).toBeVisible();
  await page.getByTestId("authentic-discard-close").click();

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

test("authentic return to setup discards the previous match before the next start", async ({ page }) => {
  const pageErrors = collectPageErrors(page);

  await page.goto(authenticPregameRestartUrl);
  await page.getByTestId("authentic-pregame-begin").click();
  await expect(page.getByTestId("authentic-mulligan-screen")).toBeVisible();
  await expect(page.getByTestId("authentic-confirm-mulligan")).toHaveText("keep hand");
  await page.getByTestId("authentic-confirm-mulligan").click();
  await expect(page.getByTestId("authentic-start-match-confirmation")).toBeVisible();
  await page.getByTestId("authentic-start-match-confirm").click();
  await expect(page.getByTestId("authentic-match-screen")).toBeVisible();

  await page.getByRole("button", { name: "setup" }).click();
  await expect(page.getByTestId("authentic-abandon-confirmation")).toBeVisible();
  await page.getByTestId("authentic-confirm-abandon").click();
  await expect(page.getByTestId("authentic-pregame")).toBeVisible();
  await expect(page.getByTestId("authentic-start-match-confirmation")).toHaveCount(0);

  await page.getByTestId("authentic-pregame-begin").click();
  await expect(page.getByTestId("authentic-mulligan-screen")).toBeVisible();
  await expect(page.getByTestId("authentic-start-match-confirmation")).toHaveCount(0);
  await expect(page.getByTestId("authentic-confirm-mulligan")).toHaveText("keep hand");
  await expect(page.getByTestId("authentic-ai-mulligan-thinking")).toHaveCount(0);
  await expect(page.getByTestId("authentic-mulligan-status")).toContainText("0/1 selected");
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
  await expect(page.getByRole("button", { name: "+ new" })).toBeVisible();
  await expect(page.getByRole("button", { name: "import" })).toBeVisible();
  await expect(page.getByRole("button", { name: "export" })).toBeVisible();
  await expect(page.getByRole("button", { name: "copy" })).toBeVisible();
  await expect(page.getByRole("button", { name: "save" })).toBeVisible();
  await expect(page.getByRole("button", { name: "play →" })).toBeEnabled();
  await expect(page.getByRole("button", { name: "duplicate" })).toBeVisible();
  await expect(page.getByRole("button", { name: "reset" })).toBeEnabled();
  await expect(page.getByRole("button", { name: "← back" })).toHaveCSS("font-size", "13px");
  await expect(page.getByRole("button", { name: "+ new" })).toHaveCSS("font-size", "13px");
  await expect(page.getByRole("button", { name: "delete current" })).toHaveCSS("font-size", "13px");
  await expect(page.getByRole("button", { name: "all", exact: true })).toHaveCSS("font-size", "11px");

  const total = page.getByTestId("authentic-deck-builder-total");
  const before = await total.innerText();
  await page.locator(".authentic-deck-builder__deck-card button").first().click();
  await expect(total).not.toHaveText(before);
  await page.getByRole("button", { name: "reset" }).click();
  await expect(page.getByTestId("authentic-deck-builder-confirmation")).toBeVisible();
  await page.getByTestId("authentic-deck-builder-confirm-action").click();
  await expect(total).toHaveText(before);
  await page.getByRole("button", { name: "duplicate" }).click();
  await expect(page.getByLabel("Deck name")).toHaveValue(/Current Northern Realms 2/);
  await page.locator(".authentic-deck-builder__deck-card button").first().click();
  await page.getByRole("button", { name: /Geralt of Rivia/i }).last().click();
  await expect(total).toHaveText(before);

  await page.getByRole("button", { name: "play →" }).click();
  await expect(page.getByTestId("authentic-mulligan-screen")).toBeVisible();
  await expect(page.locator(".authentic-mulligan__seed")).toContainText(/Seed ep5-builder/i);
  await expect(page.locator(".authentic-mulligan__seed")).toContainText(/legal-heuristic-v0/i);
  await expect(page.getByTestId("authentic-mulligan-ai")).toContainText(/hand \d+/i);
  await expect(page.getByTestId("authentic-mulligan-ai").getByTestId("authentic-mulligan-card")).toHaveCount(0);
  await page.getByTestId("authentic-confirm-mulligan").click();
  await expect(page.getByTestId("authentic-start-match-confirmation")).toBeVisible();
  await page.getByTestId("authentic-start-match-confirm").click();
  await expect(page.getByTestId("authentic-match-screen")).toBeVisible();
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

test("authentic mulligan debug route reveals AI decision and forced redraw animation", async ({ page }) => {
  await page.goto(authenticMulliganDebugUrl);

  await expect(page.getByTestId("authentic-mulligan-screen")).toBeVisible();
  await expect(page.getByTestId("authentic-ai-mulligan-debug")).toContainText("debug AI mulligan: no decision yet");
  await expect(page.getByTestId("authentic-ai-debug-card")).toHaveCount(10);

  await page.getByTestId("authentic-confirm-mulligan").click();

  await expect(page.getByTestId("authentic-mulligan-screen")).toBeVisible();
  await expect(page.getByTestId("authentic-ai-mulligan-thinking")).toBeVisible();
  await expect(page.getByTestId("authentic-mulligan-status")).toContainText("AI is choosing mulligans");
  await expect(page.getByTestId("authentic-mulligan-status")).toContainText("AI redraws 2 cards");
  await expect(page.getByTestId("authentic-ai-mulligan-debug")).toContainText(/debug AI mulligan: redraw .+/);
  await expect(page.locator('[data-ai-mulligan-state="redrawn"]')).toHaveCount(2);
  await expect(
    page.locator('[data-ai-mulligan-state="redrawn"]').nth(1).locator(".authentic-mulligan__hidden-back--out"),
  ).toHaveCSS("animation-delay", "1.7s");
  await expect(page.locator(".authentic-mulligan__hidden-hand")).toHaveCSS("overflow-y", "hidden");
  await expect(page.locator(".authentic-mulligan__hidden-hand")).toHaveCSS("scrollbar-width", "none");
  expect(await page.getByTestId("authentic-ai-debug-card").count()).toBeGreaterThanOrEqual(10);

  await expect(page.getByTestId("authentic-start-match-confirmation")).toBeVisible({ timeout: 8000 });
  await expect(page.getByTestId("authentic-start-match-confirm")).toContainText("start match →");
  await expect(page.getByTestId("authentic-mulligan-status")).toContainText("AI mulligan complete");
  await expect(page.getByTestId("authentic-match-screen")).toHaveCount(0);
  await page.getByTestId("authentic-start-match-confirm").click();
  await expect(page.getByTestId("authentic-match-screen")).toBeVisible();

  await page.goto(authenticMulliganKeepDebugUrl);
  await expect(page.getByTestId("authentic-mulligan-screen")).toBeVisible();
  await page.getByTestId("authentic-confirm-mulligan").click();
  await expect(page.getByTestId("authentic-mulligan-status")).toContainText("AI keeps hand");
  await expect(page.locator('[data-ai-mulligan-state="redrawn"]')).toHaveCount(0);
  await expect(page.locator(".authentic-mulligan__hidden-hand")).toHaveClass(/is-ai-keep-animating/);
  await expect(page.locator(".authentic-mulligan__hidden-back--held").first()).toHaveCSS("animation-name", "authentic-ai-keep-wave");
  await expect(page.getByTestId("authentic-start-match-confirmation")).toBeVisible({ timeout: 8000 });
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

  await expect(page.getByTestId("authentic-mulligan-screen")).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await page.getByTestId("authentic-confirm-mulligan").click();
  await expect(page.getByTestId("authentic-start-match-confirmation")).toBeVisible();
  await page.getByTestId("authentic-start-match-confirm").click();
  await expect(page.locator(".authentic-hand__card.is-playable [data-testid='authentic-hand-card']").first()).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await page.getByTestId("authentic-discard-trigger-human").click();
  await expect(page.getByTestId("authentic-discard-browser")).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await page.goto(authenticDirectUrl);
  await expect(page.getByTestId("authentic-mulligan-screen")).toBeVisible();
  await expect(page.locator(".authentic-mulligan__seed")).toContainText(/Seed ep4-direct/i);
  await expectNoHorizontalOverflow(page);
  await page.getByTestId("authentic-confirm-mulligan").click();
  await expect(page.getByTestId("authentic-start-match-confirmation")).toBeVisible();
  await page.getByTestId("authentic-start-match-confirm").click();
  await expect(page.getByTestId("authentic-match-screen")).toBeVisible();
  await expectNoHorizontalOverflow(page);
  expect(pageErrors).toEqual([]);
});
