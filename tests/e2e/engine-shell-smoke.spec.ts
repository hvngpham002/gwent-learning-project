import { expect, test } from "@playwright/test";

const engineUrl = "/?engine=1&seed=dp6-smoke";
const authenticUrl = "/?engine=1&ui=authentic&seed=dp6-smoke";
const authenticHarnessUrl = "/?engine=1&ui=authentic&view=harness";

const visiblePageText = async (page: import("@playwright/test").Page) =>
  (await page.locator("body").innerText()).replace(/\s+/g, " ");

const expectNoHorizontalOverflow = async (page: import("@playwright/test").Page) => {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
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

test("authentic match supports mulligan, card play, AI response, and pass without hidden leaks", async ({ page }) => {
  const pageErrors = collectPageErrors(page);

  await page.goto(authenticUrl);

  await expect(page.getByTestId("authentic-match-screen")).toBeVisible();
  await expect(page.getByTestId("engine-shell")).toHaveCount(0);
  await expect(page.getByTestId("authentic-seat-ai")).toContainText(/hand \d+/i);
  await expect(page.getByTestId("authentic-seat-ai").getByTestId("authentic-hand-card")).toHaveCount(0);

  await page.getByTestId("authentic-confirm-mulligan").click();
  await expect(page.getByTestId("authentic-human-hand")).toBeVisible();

  await page.locator(".authentic-hand__card.is-playable [data-testid='authentic-hand-card']").first().click();
  await expect(page.getByTestId("authentic-target-groups")).toBeVisible();
  await expect(page.getByTestId("authentic-target-action").first()).toBeVisible();
  await page.getByTestId("authentic-target-action").first().click();

  const activity = page.getByTestId("authentic-recent-activity");
  await expect(activity).toContainText(/Human played/);
  await expect(activity).toContainText(/AI completed mulligan|AI played|AI passed|AI used leader|AI resolved prompt/);

  const passButton = page.getByTestId("authentic-pass");
  await expect(passButton).toBeEnabled();
  await passButton.click();
  await expect(activity).toContainText(/Human passed/);

  const pageText = await visiblePageText(page);
  expect(pageText).not.toMatch(/instanceId|sourceId|seat_b:\d{3}:|seat_a:\d{3}:/);
  expect(pageErrors).toEqual([]);
});

test("authentic match avoids horizontal overflow on a mobile viewport", async ({ page }) => {
  const pageErrors = collectPageErrors(page);

  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto(authenticUrl);

  await expect(page.getByTestId("authentic-match-screen")).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await page.getByTestId("authentic-confirm-mulligan").click();
  await expect(page.locator(".authentic-hand__card.is-playable [data-testid='authentic-hand-card']").first()).toBeVisible();
  await expectNoHorizontalOverflow(page);
  expect(pageErrors).toEqual([]);
});
