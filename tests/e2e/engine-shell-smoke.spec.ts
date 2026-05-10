import { expect, test, type Locator, type Page } from "@playwright/test";

const legacyUrl = "/legacy";
const engineUrl = "/engine-diagnostic?seed=dp6-smoke";
const diagnosticRouteSmokeUrl = "/engine-diagnostic?seed=route-smoke";
const authenticPregameUrl = "/?seed=ep4-smoke";
const authenticPregameRestartUrl = "/?seed=ep4-restart&debugAiMulligan=1&debugAiMulliganCount=0";
const authenticDeckBuilderUrl = "/deck-builder?seed=ep5-builder";
const authenticDeckBuilderCompatibilityUrl = "/?engine=1&ui=authentic&view=deck-builder&seed=route-alias";
const authenticCardStudioUrl = "/card-studio?seed=ep7-studio";
const authenticOfficialPortingUrl = "/official-porting?seed=bp3-porting";
const authenticDirectUrl = "/match?seed=ep4-direct";
const authenticDirectRouteSmokeUrl = "/match?seed=route-direct";
const authenticMulliganDebugUrl = "/match?seed=ep4-debug&debugAiMulligan=1&debugAiMulliganCount=2";
const authenticMulliganOneDebugUrl = "/match?seed=ep4-one&debugAiMulligan=1&debugAiMulliganCount=1";
const authenticMulliganKeepDebugUrl = "/match?seed=ep4-keep&debugAiMulligan=1&debugAiMulliganCount=0";
const authenticMatchEndBackfillUrl = "/match?seed=cep111-match-end";
const authenticHarnessUrl = "/ui-harness";
const authenticComponentFoundationUrl = "/components";
const authenticAiLabUrl = "/ai-lab";

type LocalDeckFixture = {
  readonly presetId: string;
  readonly name: string;
  readonly faction: string;
  readonly leaderSourceId: string;
  readonly mainDeck: readonly { readonly sourceId: string; readonly count: number }[];
  readonly sideDeck: readonly { readonly sourceId: string; readonly count: number }[];
};

const weatherBackfillDeck = {
  presetId: "local-cep111-weather",
  name: "cEp11.1 Weather Target Smoke",
  faction: "northern_realms",
  leaderSourceId: "northern-realms.foltest-lord-commander-of-the-north",
  mainDeck: [
    { sourceId: "northern-realms.philippa-eilhart", count: 1 },
    { sourceId: "northern-realms.vernon-roche", count: 1 },
    { sourceId: "northern-realms.john-natalis", count: 1 },
    { sourceId: "northern-realms.esterad-thyssen", count: 1 },
    { sourceId: "northern-realms.catapult", count: 3 },
    { sourceId: "northern-realms.crinfrid-reavers-dragon-hunter", count: 3 },
    { sourceId: "northern-realms.blue-stripes-commando", count: 3 },
    { sourceId: "northern-realms.redanian-foot-soldier", count: 3 },
    { sourceId: "northern-realms.poor-fucking-infantry", count: 3 },
    { sourceId: "northern-realms.kaedweni-siege-expert", count: 3 },
    { sourceId: "neutral.biting-frost", count: 3 },
    { sourceId: "neutral.impenetrable-fog", count: 3 },
    { sourceId: "neutral.torrential-rain", count: 3 },
    { sourceId: "neutral.skellige-storm", count: 1 },
  ],
  sideDeck: [],
} as const satisfies LocalDeckFixture;

const hornBackfillDeck = {
  presetId: "local-cep13-horn",
  name: "cEp13 Horn Slot Smoke",
  faction: "northern_realms",
  leaderSourceId: "northern-realms.foltest-lord-commander-of-the-north",
  mainDeck: [
    { sourceId: "northern-realms.philippa-eilhart", count: 1 },
    { sourceId: "northern-realms.vernon-roche", count: 1 },
    { sourceId: "northern-realms.john-natalis", count: 1 },
    { sourceId: "northern-realms.esterad-thyssen", count: 1 },
    { sourceId: "northern-realms.catapult", count: 3 },
    { sourceId: "northern-realms.crinfrid-reavers-dragon-hunter", count: 3 },
    { sourceId: "northern-realms.blue-stripes-commando", count: 3 },
    { sourceId: "northern-realms.redanian-foot-soldier", count: 3 },
    { sourceId: "northern-realms.poor-fucking-infantry", count: 3 },
    { sourceId: "northern-realms.kaedweni-siege-expert", count: 3 },
    { sourceId: "neutral.commanders-horn", count: 3 },
  ],
  sideDeck: [],
} as const satisfies LocalDeckFixture;

const weatherFixtureSourceNames: Record<string, string> = {
  "neutral.biting-frost": "Biting Frost",
  "neutral.impenetrable-fog": "Impenetrable Fog",
  "neutral.torrential-rain": "Torrential Rain",
  "neutral.skellige-storm": "Skellige Storm",
};

const weatherFixtureSourceIds = Object.keys(weatherFixtureSourceNames);

const weatherOverlayExpectations: Record<string, { effect: string; rowCount: number }> = {
  "neutral.biting-frost": { effect: "frost", rowCount: 2 },
  "neutral.impenetrable-fog": { effect: "fog", rowCount: 2 },
  "neutral.torrential-rain": { effect: "rain", rowCount: 2 },
  "neutral.skellige-storm": { effect: "skellige-storm", rowCount: 4 },
};

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const visiblePageText = async (page: import("@playwright/test").Page) =>
  (await page.locator("body").innerText()).replace(/\s+/g, " ");

const locatorCenter = async (locator: Locator) => {
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  if (!box) {
    throw new Error("locator had no bounding box");
  }
  return {
    x: box.x + box.width / 2,
    y: box.y + box.height / 2,
  };
};

const startMouseDrag = async (page: Page, source: Locator) => {
  const center = await locatorCenter(source);
  await page.mouse.move(center.x, center.y);
  await page.mouse.down();
  await page.waitForTimeout(50);
  await page.mouse.move(center.x + 10, center.y + 2, { steps: 2 });
  await expect(page.getByTestId("authentic-drag-preview")).toBeVisible();
  return center;
};

const boardRowTargets = (page: Page) => page.locator('[data-testid="authentic-board-row"][data-row-target="true"]');

const cardFlightDestination = async (flight: Locator) =>
  flight.evaluate((element) => {
    const style = window.getComputedStyle(element);
    const left = Number.parseFloat((element as HTMLElement).style.left);
    const top = Number.parseFloat((element as HTMLElement).style.top);
    const width = Number.parseFloat((element as HTMLElement).style.width);
    const height = Number.parseFloat((element as HTMLElement).style.height);
    return {
      x: left + width / 2 + Number.parseFloat(style.getPropertyValue("--flight-x")),
      y: top + height / 2 + Number.parseFloat(style.getPropertyValue("--flight-y")),
    };
  });

const expectBoxDifference = (
  actual: number,
  expected: number,
  message: string,
) => {
  expect(Math.abs(actual - expected), message).toBeLessThanOrEqual(0.2);
};

const findFirstRowTargetHandCard = async (page: Page): Promise<Locator | null> => {
  const playableCards = page.locator(".authentic-hand__card.is-playable");
  const playableCount = await playableCards.count();
  for (let index = 0; index < playableCount; index += 1) {
    const candidate = playableCards.nth(index);
    await candidate.getByTestId("authentic-hand-card").click();
    if ((await boardRowTargets(page).count()) > 0) {
      return candidate;
    }
  }
  return null;
};

const seedLocalDecks = async (
  page: Page,
  activePresetId: string,
  decks: readonly LocalDeckFixture[],
) => {
  await page.addInitScript(
    ({ activePresetId: presetId, decks: deckFixtures }) => {
      window.localStorage.setItem(
        "gwent_authentic_decks_v1",
        JSON.stringify({
          schemaVersion: "authentic-decks-v1",
          activePresetId: presetId,
          decks: deckFixtures,
        }),
      );
    },
    { activePresetId, decks },
  );
};

const confirmAuthenticMulliganAndStartMatch = async (page: Page) => {
  await expect(page.getByTestId("authentic-mulligan-screen")).toBeVisible();
  await page.getByTestId("authentic-confirm-mulligan").click({ force: true });
  await expect(page.getByTestId("authentic-start-match-confirmation")).toBeVisible({ timeout: 10000 });
  await page.getByTestId("authentic-start-match-confirm").click({ force: true });
  await expect(page.getByTestId("authentic-match-screen")).toBeVisible();
};

const enterAuthenticMatchFromPreGame = async (
  page: Page,
  {
    seed,
    deckName,
  }: {
    readonly seed: string;
    readonly deckName: string;
  },
) => {
  await page.goto(`/?seed=${seed}`);
  await expect(page.getByTestId("authentic-pregame")).toBeVisible();

  const deckOption = page.getByTestId("authentic-pregame-deck-option").filter({ hasText: deckName });
  await expect(deckOption).toBeVisible();
  await deckOption.click();

  await page.getByTestId("authentic-pregame-begin").click();
  await confirmAuthenticMulliganAndStartMatch(page);
  await expect(page.getByTestId("authentic-pass")).toBeEnabled({ timeout: 15000 });
};

const shortVisibleStatus = async (page: Page) => {
  const text = await visiblePageText(page);
  return text.length > 700 ? `${text.slice(0, 700)}...` : text;
};

const passAndResolveRoundsUntilMatchEnd = async (page: Page, maxRounds = 4) => {
  for (let roundAttempt = 0; roundAttempt < maxRounds; roundAttempt += 1) {
    await expect(
      page.getByTestId("authentic-pass"),
      `human pass did not become enabled before round attempt ${roundAttempt + 1}: ${await shortVisibleStatus(page)}`,
    ).toBeEnabled({ timeout: 20000 });
    await page.getByTestId("authentic-pass").click();

    await expect(
      page.getByTestId("authentic-resolve-round"),
      `resolve round did not become enabled after pass on attempt ${roundAttempt + 1}: ${await shortVisibleStatus(page)}`,
    ).toBeEnabled({ timeout: 20000 });
    await page.getByTestId("authentic-resolve-round").click();

    const overlay = page.getByTestId("authentic-round-overlay");
    await expect(overlay).toBeVisible({ timeout: 10000 });
    const ledgerKind = await overlay.getAttribute("data-ledger-kind");
    if (ledgerKind === "match_end") {
      return;
    }

    await expect(overlay).toHaveAttribute("data-ledger-kind", "round");
    await page.getByTestId("authentic-round-overlay-dismiss").click();
    await expect(overlay).toHaveCount(0);
  }

  throw new Error(`match did not reach game end after ${maxRounds} resolved rounds: ${await shortVisibleStatus(page)}`);
};

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

const collectBrowserErrors = (page: import("@playwright/test").Page): string[] => {
  const errors: string[] = [];
  page.on("pageerror", (error) => {
    errors.push(`pageerror: ${error.message}`);
  });
  page.on("console", (message) => {
    if (message.type() === "error") {
      errors.push(`console error: ${message.text()}`);
    }
  });
  return errors;
};

const boundingBoxFor = async (locator: Locator) => {
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  if (!box) {
    throw new Error("expected locator to have a bounding box");
  }
  return box;
};

const documentMetrics = async (page: Page) =>
  page.evaluate(() => ({
    clientHeight: document.documentElement.clientHeight,
    scrollHeight: document.documentElement.scrollHeight,
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));

const confirmMulliganAndWaitForHumanTurn = async (page: import("@playwright/test").Page) => {
  await page.getByTestId("engine-confirm-mulligan").click();

  await expect(page.getByTestId("engine-status-banner")).toContainText(
    /Your turn: choose a playable card|Prompt: choose one legal|Round end:/,
  );
};

test("default route mounts the authentic pre-game setup (cEp15)", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByTestId("engine-shell")).toHaveCount(0);
  await expect(page.getByTestId("authentic-pregame")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Prepare for Battle" })).toBeVisible();
});

test("legacy route mounts the quarantined legacy app without authentic pre-game (cEp16)", async ({ page }) => {
  test.setTimeout(60_000);
  const browserErrors = collectBrowserErrors(page);

  await page.setViewportSize({ width: 390, height: 900 });
  await page.addInitScript(() => window.localStorage.removeItem("hasSeenDisclaimer"));
  await page.goto(legacyUrl);

  await expect(page.locator("body")).toContainText(/Educational Project Disclaimer|Gwent/i);
  await expect(page.getByTestId("authentic-pregame")).toHaveCount(0);
  await expectNoHorizontalOverflow(page);
  expect(browserErrors).toEqual([]);
});

test("engine diagnostic canonical route mounts the diagnostic shell (cEp15)", async ({ page }) => {
  await page.goto(diagnosticRouteSmokeUrl);

  await expect(page.getByTestId("engine-shell")).toBeVisible();
  await expect(page.getByTestId("engine-status-banner")).toContainText(/Seed route-smoke/i);
  await expect(page.getByTestId("authentic-game-app")).toHaveCount(0);
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

test("authentic UI harness mounts on the canonical route", async ({ page }) => {
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

test("authentic AI Lab route mounts a read-only benchmark dashboard (cEp17)", async ({ page }) => {
  const pageErrors = collectPageErrors(page);

  await page.goto(authenticAiLabUrl);

  await expect(page.getByTestId("authentic-ai-lab")).toBeVisible();
  await expect(page.getByRole("heading", { name: "AI Lab" })).toBeVisible();
  await expect(page.getByTestId("authentic-ai-lab-suite-id")).toHaveText("benchmark-smoke-v1");
  await expect(page.getByTestId("authentic-ai-lab-policies")).toContainText("legal-heuristic-v0");
  await expect(page.getByTestId("authentic-ai-lab-policies")).toContainText("legal-heuristic-v1");
  await expect(page.getByTestId("authentic-ai-lab-policies")).toContainText("implemented · experimental/playtest");
  await expect(page.getByTestId("authentic-ai-lab-policies")).toContainText("legal-first-v0");
  await expect(page.getByTestId("authentic-ai-lab-policies")).toContainText("benchmark-only comparator");
  await expect(page.getByTestId("authentic-ai-lab-policies").filter({ hasText: "legal-heuristic-v1" })).not.toContainText(
    "not implemented",
  );
  await expect(page.getByTestId("authentic-ai-lab-ladder")).toContainText("deterministic smoke/regression ledger");
  await expect(page.getByTestId("authentic-ai-lab-references")).toContainText(
    "docs/research/literature/ai/benchmark-harness.md",
  );
  await expect(page.getByTestId("engine-shell")).toHaveCount(0);

  const actionButtons = page.getByTestId("authentic-ai-lab-future-actions").locator("button");
  await expect(actionButtons).toHaveCount(5);
  const actionCount = await actionButtons.count();
  for (let index = 0; index < actionCount; index += 1) {
    const action = actionButtons.nth(index);
    await expect(action).toBeDisabled();
    const reasonId = await action.getAttribute("aria-describedby");
    expect(reasonId).toBeTruthy();
    if (reasonId) {
      await expect(page.locator(`#${reasonId}`)).not.toHaveText("");
    }
  }

  const beforeUrl = page.url();
  await page
    .getByTestId("authentic-ai-lab-action-run-benchmark")
    .evaluate((element) => (element as HTMLButtonElement).click());
  expect(page.url()).toBe(beforeUrl);
  await expect(page.getByTestId("authentic-ai-lab")).toBeVisible();

  const aiLabText = await visiblePageText(page);
  expect(aiLabText).not.toMatch(/cardsById|finalState|commandLog|ownHand|opponentHand|instanceId|sourceId|seat_a:|seat_b:/);
  expect(pageErrors).toEqual([]);
});

test("authentic AI Lab avoids horizontal overflow on a mobile viewport (cEp17)", async ({ page }) => {
  const pageErrors = collectPageErrors(page);

  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto(authenticAiLabUrl);

  await expect(page.getByTestId("authentic-ai-lab")).toBeVisible();
  await expectNoHorizontalOverflow(page);
  const aiLabText = await visiblePageText(page);
  expect(aiLabText).not.toMatch(/cardsById|finalState|commandLog|ownHand|opponentHand|instanceId|sourceId|seat_a:|seat_b:/);
  expect(pageErrors).toEqual([]);
});

test("pre-game opens the AI Lab through the setup tool cluster (cEp17)", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByTestId("authentic-pregame")).toBeVisible();
  await page.getByTestId("authentic-pregame-ai-lab").click();
  await expect(page.getByTestId("authentic-ai-lab")).toBeVisible();
  await expect(page.getByTestId("authentic-ai-lab-suite-id")).toHaveText("benchmark-smoke-v1");
  await expect(page.getByTestId("engine-shell")).toHaveCount(0);
});

test("pre-game AI policy selector can start an experimental v1 playtest match (cFp24.1)", async ({ page }) => {
  await page.goto("/?ai=legal-heuristic-v1&seed=cfp241-v1");

  await expect(page.getByTestId("authentic-pregame")).toBeVisible();
  await expect(page.getByTestId("authentic-pregame-ai-policy-option")).toContainText(
    "experimental · legal-heuristic-v1",
  );
  await expect(page.locator(".authentic-pregame__summary")).toContainText("legal-heuristic-v1");

  await page.getByTestId("authentic-pregame-ai-policy-option").click();
  await expect(page.getByRole("option", { name: /stable .* legal-heuristic-v0/i })).toBeVisible();
  await expect(page.getByRole("option", { name: /experimental .* legal-heuristic-v1/i })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await page.keyboard.press("Escape");

  await page.getByTestId("authentic-pregame-begin").click();
  await expect(page.getByTestId("authentic-mulligan-screen")).toBeVisible();
  await expect(page.locator(".authentic-mulligan__seed")).toContainText(/Seed cfp241-v1/i);
  await expect(page.locator(".authentic-mulligan__seed")).toContainText("legal-heuristic-v1");
  await page.getByTestId("authentic-confirm-mulligan").click();
  await expect(page.getByTestId("authentic-mulligan-screen")).toContainText(/legal-heuristic-v1/);
});

test("canonical direct match route opens at mulligan (cEp15)", async ({ page }) => {
  await page.goto(authenticDirectRouteSmokeUrl);

  await expect(page.getByTestId("authentic-mulligan-screen")).toBeVisible();
  await expect(page.locator(".authentic-mulligan__seed")).toContainText(/Seed route-direct/i);
  await expect(page.getByTestId("engine-shell")).toHaveCount(0);
});

test("old authentic query alias still mounts the matching surface (cEp15)", async ({ page }) => {
  await page.goto(authenticDeckBuilderCompatibilityUrl);

  await expect(page.getByTestId("authentic-deck-builder")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Deck Builder" })).toBeVisible();
  await expect(page.getByTestId("engine-shell")).toHaveCount(0);
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
  await page.mouse.move(1, 1);

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
  const secondMulliganCard = page.getByTestId("authentic-mulligan-card").nth(1);
  await firstMulliganCard.click();
  await expect(page.getByTestId("authentic-mulligan-status")).toContainText(/1\/1 select: .+/);
  await expect(page.locator(".authentic-mulligan__card.is-selected")).toHaveCount(1);
  await expect(page.locator(".authentic-mulligan__card").first()).toHaveClass(/is-selected/);
  await secondMulliganCard.click();
  await expect(page.getByTestId("authentic-mulligan-status")).toContainText(/1\/1 select: .+/);
  await expect(page.locator(".authentic-mulligan__card.is-selected")).toHaveCount(1);
  await expect(page.locator(".authentic-mulligan__card").first()).not.toHaveClass(/is-selected/);
  await expect(page.locator(".authentic-mulligan__card").nth(1)).toHaveClass(/is-selected/);
  await expect(page.getByTestId("authentic-confirm-mulligan")).toHaveText("confirm mulligan");
  await secondMulliganCard.click();
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
  await expect(page.getByTestId("authentic-seat-resources-ai")).toHaveAttribute(
    "aria-label",
    /hand \d+, deck \d+/i,
  );
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
  await expect(page.getByTestId("authentic-target-hint")).toBeVisible();

  // cEp11: spatial board-row target is the primary affordance for unit cards;
  // fall back to the right-rail action only for cards whose legal target kind
  // cannot be represented spatially (e.g. global Scorch).
  const rowTarget = boardRowTargets(page).first();
  const fallbackTarget = page.getByTestId("authentic-target-action").first();
  if ((await rowTarget.count()) > 0) {
    await expect(rowTarget).toBeVisible();
    await expect(rowTarget).toHaveAttribute("data-drop-move-id", /^play:/);
    await rowTarget.click();
  } else {
    await expect(fallbackTarget).toBeVisible();
    await fallbackTarget.click();
  }

  const activity = page.getByTestId("authentic-recent-activity");
  await expect(activity).toContainText(/Human played/);
  await expect(activity).toContainText(/AI completed mulligan|AI played|AI passed|AI used leader|AI resolved prompt/);
  const battleLogScroller = page.getByTestId("authentic-battle-log-scroller");
  await expect(battleLogScroller).toHaveAttribute("role", "log");
  await expect(battleLogScroller).toHaveCSS("overflow-y", "auto");
  await expect(battleLogScroller).toHaveCSS("scrollbar-width", "none");
  expect(await activity.locator('[data-log-kind="event"]').count()).toBeGreaterThan(0);
  const firstMoveEntry = activity.locator('[data-log-kind="move"]').first();
  const firstEventEntry = activity.locator('[data-log-kind="event"]').first();
  await expect(firstMoveEntry.locator(".authentic-log__entry-number")).toHaveText("1");
  await expect(firstMoveEntry.locator(".authentic-log__entry-number")).toHaveCSS("font-size", "12px");
  await expect(firstMoveEntry.locator(".authentic-log__entry-kind")).toHaveText("move");
  await expect(firstMoveEntry.locator(".authentic-log__entry-kind")).toHaveCSS("font-size", "12px");
  await expect(firstMoveEntry.locator(".authentic-log__entry-message")).toHaveCSS("font-size", "12px");
  await expect(firstMoveEntry.locator(".authentic-log__entry-message")).toHaveCSS("color", "rgb(138, 58, 31)");
  await expect(firstEventEntry.locator(".authentic-log__entry-number")).toHaveText("");
  await expect(firstEventEntry.locator(".authentic-log__entry-kind")).toHaveText("event");
  const battleLogScrollState = await battleLogScroller.evaluate((element) => ({
    scrollTop: element.scrollTop,
    clientHeight: element.clientHeight,
    scrollHeight: element.scrollHeight,
  }));
  expect(battleLogScrollState.scrollTop + battleLogScrollState.clientHeight).toBeGreaterThanOrEqual(
    battleLogScrollState.scrollHeight - 1,
  );
  await expect(page.getByTestId("authentic-effective-strength").first()).toBeVisible();
  await expect(page.locator(".authentic-board-card__strength")).toHaveCount(0);

  // cEp11: confirm hidden-info-safe hint after a target dispatch (board cards
  // exist now; the right-rail hint should reset to the no-selection text).
  await expect(page.getByTestId("authentic-target-hint")).toBeVisible();

  const passButton = page.getByTestId("authentic-pass");
  await expect(passButton).toBeEnabled();
  await passButton.click();
  await expect(activity).toContainText(/Human passed/);

  const pageText = await visiblePageText(page);
  expect(pageText).not.toMatch(/instanceId|sourceId|seat_b:\d{3}:|seat_a:\d{3}:/);
  expect(pageErrors).toEqual([]);
});

test("authentic pre-game starts the official Skellige starter with linked side deck", async ({ page }) => {
  const pageErrors = collectPageErrors(page);

  await page.goto("/?seed=bp5-skellige");
  await expect(page.getByTestId("authentic-pregame")).toBeVisible();

  const skelligeStarter = page
    .getByTestId("authentic-pregame-deck-option")
    .filter({ hasText: "Official Skellige Starter" });
  await expect(skelligeStarter).toBeVisible();
  await skelligeStarter.click();

  await page.getByTestId("authentic-pregame-begin").click();
  await expect(page.getByTestId("authentic-mulligan-screen")).toBeVisible();
  await expect(page.locator(".authentic-mulligan__seed")).toContainText(/Seed bp5-skellige/i);
  await expect(page.getByTestId("authentic-mulligan-ai")).toContainText(/hand \d+/i);
  await expect(page.getByTestId("authentic-mulligan-ai").getByTestId("authentic-mulligan-card")).toHaveCount(0);

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
  await page.getByTestId("authentic-start-match-review").click();
  await expect(page.getByTestId("authentic-start-match-confirmation")).toHaveCount(0);
  await page.getByTestId("authentic-mulligan-setup").click();
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
  await expect(page.getByTestId("authentic-ai-mulligan-debug")).toContainText("debug AI mulligan: no decision yet");
  await expect(page.getByTestId("authentic-ai-mulligan-debug")).not.toContainText("debug AI mulligan: keep hand");
  expect(pageErrors).toEqual([]);
});

test("authentic deck builder opens, edits, and starts a hidden-safe match", async ({ page }) => {
  const pageErrors = collectPageErrors(page);

  await page.goto(authenticPregameUrl);
  const topbarActions = page.getByTestId("authentic-pregame-topbar-actions");
  await expect(topbarActions.getByRole("button", { name: "open deck builder →" })).toBeVisible();
  await expect(topbarActions.getByTestId("authentic-pregame-card-studio")).toBeVisible();
  await expect(page.locator(".authentic-pregame__body")).toHaveCSS("scrollbar-width", "none");
  const pregameDeckList = page.locator(".authentic-pregame__deck-list");
  await expect(pregameDeckList).toHaveCSS("overflow-y", "auto");
  await expect(pregameDeckList).toHaveCSS("scrollbar-width", "none");
  await expect(pregameDeckList).not.toHaveCSS("mask-image", "none");
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
  const deckBuilderFrame = await page.locator(".authentic-deck-builder").evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return {
      height: Math.round(rect.height),
      width: Math.round(rect.width),
    };
  });
  const deckBuilderViewport = page.viewportSize();
  expect(deckBuilderViewport).not.toBeNull();
  expect(deckBuilderFrame.width).toBeGreaterThanOrEqual((deckBuilderViewport?.width ?? 0) - 1);
  expect(deckBuilderFrame.height).toBeGreaterThanOrEqual((deckBuilderViewport?.height ?? 0) - 1);
  await expect(page.getByTestId("authentic-deck-builder-deck-list")).toBeVisible();
  await expect(page.getByTestId("authentic-deck-builder-card-pool")).toBeVisible();
  await expect(page.getByTestId("authentic-deck-builder-stats")).toBeVisible();
  await expect(page.getByTestId("authentic-deck-builder-leader")).toBeVisible();
  await expect(page.getByTestId("authentic-deck-builder-deck-list")).toHaveCSS("overflow-y", "auto");
  await expect(page.getByTestId("authentic-deck-builder-deck-list")).toHaveCSS("scrollbar-width", "none");
  await expect(page.locator(".authentic-deck-builder__pool-grid")).toHaveCSS("overflow-y", "auto");
  await expect(page.locator(".authentic-deck-builder__pool-grid")).toHaveCSS("scrollbar-width", "none");
  await expect(page.getByTestId("authentic-deck-builder-stats")).toHaveCSS("overflow-y", "auto");
  await expect(page.getByTestId("authentic-deck-builder-stats")).toHaveCSS("scrollbar-width", "none");
  await expect(page.locator(".authentic-deck-builder__deck-cards")).toHaveCSS("overflow-y", "auto");
  await expect(page.locator(".authentic-deck-builder__deck-cards")).toHaveCSS("scrollbar-width", "none");
  await expect(page.locator(".authentic-deck-builder__deck-cards")).not.toHaveCSS("mask-image", "none");
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
  await expect(page.getByTestId("authentic-seat-resources-ai")).toHaveAttribute(
    "aria-label",
    /hand \d+, deck \d+/i,
  );
  await expect(page.getByTestId("authentic-seat-ai").getByTestId("authentic-hand-card")).toHaveCount(0);

  const pageText = await visiblePageText(page);
  expect(pageText).not.toMatch(/instanceId|sourceId|seat_b:\d{3}:|seat_a:\d{3}:/);
  expect(pageErrors).toEqual([]);
});

test("authentic Card Studio imports a playable custom unit for the deck builder", async ({ page }) => {
  const pageErrors = collectPageErrors(page);
  const customRecord = {
    schemaVersion: "custom-catalog-record-v1",
    record: {
      recordId: "smoke-card",
      createdAt: "2026-04-28T00:00:00.000Z",
      updatedAt: "2026-04-28T00:00:00.000Z",
      imageMode: "path",
      draft: false,
      source: {
        sourceId: "custom_smoke_unit",
        name: "Smoke Unit",
        faction: "northern_realms",
        kind: "unit",
        strength: 6,
        rows: ["close"],
        abilities: ["none"],
        tags: [],
        deckLimit: 3,
        image: "/images/custom/smoke-unit.png",
      },
    },
  };

  await page.goto(authenticCardStudioUrl);
  await expect(page.getByTestId("authentic-card-studio")).toBeVisible();
  const cardStudioFrame = await page.locator(".authentic-card-studio").evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return {
      height: Math.round(rect.height),
      width: Math.round(rect.width),
    };
  });
  const cardStudioViewport = page.viewportSize();
  expect(cardStudioViewport).not.toBeNull();
  expect(cardStudioFrame.width).toBeGreaterThanOrEqual((cardStudioViewport?.width ?? 0) - 1);
  expect(cardStudioFrame.height).toBeGreaterThanOrEqual((cardStudioViewport?.height ?? 0) - 1);
  await expect(page.locator(".authentic-card-studio__library")).toHaveCSS("overflow-y", "auto");
  await expect(page.locator(".authentic-card-studio__library")).toHaveCSS("scrollbar-width", "none");
  await expect(page.locator(".authentic-card-studio__editor")).toHaveCSS("overflow-y", "auto");
  await expect(page.locator(".authentic-card-studio__editor")).toHaveCSS("scrollbar-width", "none");
  await expect(page.locator(".authentic-card-studio__preview")).toHaveCSS("overflow-y", "auto");
  await expect(page.locator(".authentic-card-studio__preview")).toHaveCSS("scrollbar-width", "none");
  await expect(page.locator(".authentic-card-studio__editor")).not.toHaveCSS("mask-image", "none");
  await page.getByRole("button", { name: "import" }).click();
  await page.locator(".authentic-card-studio__modal-box textarea").fill(JSON.stringify(customRecord));
  await page.getByRole("button", { name: "import" }).last().click();
  await expect(page.getByRole("button", { name: /Smoke Unit custom_smoke_unit/ })).toBeVisible();
  await expect(page.getByTestId("authentic-card-studio-validation")).toContainText(/playable|No validation issues/i);

  await page.goto(authenticDeckBuilderUrl);
  await expect(page.getByTestId("authentic-deck-builder")).toBeVisible();
  await page.getByLabel("Search cards").fill("Smoke Unit");
  const customPoolItem = page.locator('[data-source-id="custom_smoke_unit"]');
  await expect(customPoolItem).toBeVisible();
  const total = page.getByTestId("authentic-deck-builder-total");
  const before = await total.innerText();
  await customPoolItem.getByTestId("authentic-card").click();
  await expect(total).not.toHaveText(before);

  expect(pageErrors).toEqual([]);
});

test("authentic official porting route mounts without mobile overflow", async ({ page }) => {
  const pageErrors = collectPageErrors(page);

  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto(authenticOfficialPortingUrl);

  await expect(page.getByTestId("authentic-official-porting")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Official Porting" })).toBeVisible();
  await expect(page.getByTestId("official-porting-counts")).toContainText("181 candidates");
  await expect(page.getByTestId("official-porting-candidate-list")).toBeVisible();
  await expect(page.getByTestId("official-porting-preview")).toBeVisible();
  await expect(page.getByTestId("official-porting-status")).toBeVisible();
  await expectNoHorizontalOverflow(page);
  expect(pageErrors).toEqual([]);
});

test("authentic match keeps desktop board and hand in the first viewport (cEp14)", async ({ page }) => {
  test.setTimeout(60_000);
  const browserErrors = collectBrowserErrors(page);

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(authenticDirectUrl);
  await confirmAuthenticMulliganAndStartMatch(page);

  await expect(page.getByTestId("authentic-match-screen")).toBeVisible();
  await expect(page.getByTestId("authentic-seat-ai")).toBeVisible();
  await expect(page.getByTestId("authentic-seat-human")).toBeVisible();
  await expect(page.getByTestId("authentic-board-row")).toHaveCount(6);

  const visibleRowCount = await page.getByTestId("authentic-board-row").evaluateAll((rows) =>
    rows.filter((row) => {
      const rect = row.getBoundingClientRect();
      return rect.top < window.innerHeight && rect.bottom > 0;
    }).length,
  );
  expect(visibleRowCount).toBe(6);

  const handBox = await boundingBoxFor(page.getByTestId("authentic-human-hand"));
  const firstHandCardBox = await boundingBoxFor(page.getByTestId("authentic-human-hand").getByTestId("authentic-hand-card").first());
  expect(handBox.y).toBeLessThan(900);
  expect(firstHandCardBox.y).toBeLessThan(900);
  await expectNoHorizontalOverflow(page);
  expect(browserErrors).toEqual([]);
});

test("authentic mobile match prioritizes board and hand before secondary panels (cEp14)", async ({ page }) => {
  test.setTimeout(60_000);
  const browserErrors = collectBrowserErrors(page);

  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto(authenticDirectUrl);
  await confirmAuthenticMulliganAndStartMatch(page);

  const board = page.locator(".authentic-match__center");
  const publicPanels = page.locator(".authentic-match__left-rail");
  const boardBox = await boundingBoxFor(board);
  const publicPanelsBox = await boundingBoxFor(publicPanels);
  const firstRowBox = await boundingBoxFor(page.getByTestId("authentic-board-row").first());
  const handBox = await boundingBoxFor(page.getByTestId("authentic-human-hand"));

  expect(firstRowBox.y).toBeLessThan(900);
  expect(handBox.y).toBeLessThan(900);
  expect(boardBox.y).toBeLessThan(publicPanelsBox.y);
  await expectNoHorizontalOverflow(page);
  await expect(page.getByTestId("authentic-seat-ai").getByTestId("authentic-hand-card")).toHaveCount(0);
  const pageText = await visiblePageText(page);
  expect(pageText).not.toMatch(/instanceId|sourceId|seat_b:\d{3}:|seat_a:\d{3}:/);
  expect(browserErrors).toEqual([]);
});

test("authentic Official Porting uses bounded scroll regions on desktop and mobile (cEp14)", async ({ page }) => {
  const browserErrors = collectBrowserErrors(page);

  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 390, height: 900 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto(authenticOfficialPortingUrl);

    await expect(page.getByTestId("authentic-official-porting")).toBeVisible();
    await expect(page.getByTestId("official-porting-counts")).toContainText("181 candidates");
    await expectNoHorizontalOverflow(page);

    const metrics = await documentMetrics(page);
    expect(metrics.scrollHeight).toBeLessThanOrEqual(metrics.clientHeight + 2);

    for (const selector of [
      ".authentic-official-porting__list-panel",
      ".authentic-official-porting__editor",
      ".authentic-official-porting__preview",
    ]) {
      await expect(page.locator(selector)).toHaveCSS("overflow-y", "auto");
      await expect(page.locator(selector)).toHaveCSS("scrollbar-width", "none");
    }

    const listRegion = await page.locator(".authentic-official-porting__list-panel").evaluate((element) => ({
      clientHeight: element.clientHeight,
      scrollHeight: element.scrollHeight,
    }));
    expect(listRegion.scrollHeight).toBeGreaterThan(listRegion.clientHeight);
  }

  expect(browserErrors).toEqual([]);
});

test("authentic mobile deck builder surfaces the card pool before secondary rails (cEp14)", async ({ page }) => {
  const browserErrors = collectBrowserErrors(page);

  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto(authenticDeckBuilderUrl);

  await expect(page.getByTestId("authentic-deck-builder")).toBeVisible();
  await expectNoHorizontalOverflow(page);

  const poolBox = await boundingBoxFor(page.getByTestId("authentic-deck-builder-card-pool"));
  const deckListBox = await boundingBoxFor(page.getByTestId("authentic-deck-builder-deck-list"));
  const firstPoolCardBox = await boundingBoxFor(page.locator(".authentic-deck-builder__pool-item").first());
  expect(poolBox.y).toBeLessThan(deckListBox.y);
  expect(poolBox.y).toBeLessThan(160);
  expect(firstPoolCardBox.y).toBeLessThan(900);
  await expect(page.locator(".authentic-deck-builder__actions")).toHaveCSS("overflow-x", "auto");
  expect(browserErrors).toEqual([]);
});

test("authentic mobile Card Studio opens on the editor before library and preview rails (cEp14)", async ({ page }) => {
  const browserErrors = collectBrowserErrors(page);

  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto(authenticCardStudioUrl);

  await expect(page.getByTestId("authentic-card-studio")).toBeVisible();
  await expectNoHorizontalOverflow(page);

  const editorBox = await boundingBoxFor(page.locator(".authentic-card-studio__editor"));
  const libraryBox = await boundingBoxFor(page.locator(".authentic-card-studio__library"));
  const previewBox = await boundingBoxFor(page.locator(".authentic-card-studio__preview"));
  const firstEditorInputBox = await boundingBoxFor(page.locator(".authentic-card-studio__editor input").first());
  expect(editorBox.y).toBeLessThan(libraryBox.y);
  expect(editorBox.y).toBeLessThan(previewBox.y);
  expect(firstEditorInputBox.y).toBeLessThan(320);
  await expect(page.locator(".authentic-card-studio__actions")).toHaveCSS("overflow-x", "auto");
  expect(browserErrors).toEqual([]);
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

test("authentic mulligan debug routes reveal AI decision and forced redraw animations", async ({ page }) => {
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

  await page.goto(authenticMulliganOneDebugUrl);
  await expect(page.getByTestId("authentic-mulligan-screen")).toBeVisible();
  await page.getByTestId("authentic-confirm-mulligan").click();
  await expect(page.getByTestId("authentic-mulligan-status")).toContainText("AI redraws 1 card");
  await expect(page.locator('[data-ai-mulligan-state="redrawn"]')).toHaveCount(1);
  await expect(page.locator(".authentic-mulligan__hidden-hand")).toHaveCSS("overflow-y", "hidden");
  await expect(page.getByTestId("authentic-start-match-confirmation")).toBeVisible({ timeout: 8000 });
  await expect(page.getByTestId("authentic-match-screen")).toHaveCount(0);

  await page.goto(authenticMulliganKeepDebugUrl);
  await expect(page.getByTestId("authentic-mulligan-screen")).toBeVisible();
  await page.getByTestId("authentic-confirm-mulligan").click();
  await expect(page.getByTestId("authentic-mulligan-status")).toContainText("AI keeps hand");
  await expect(page.locator('[data-ai-mulligan-state="redrawn"]')).toHaveCount(0);
  await expect(page.locator(".authentic-mulligan__hidden-hand")).toHaveClass(/is-ai-keep-animating/);
  await expect(page.locator(".authentic-mulligan__hidden-back--held").first()).toHaveCSS("animation-name", "authentic-ai-keep-wave");
  await expect(page.getByTestId("authentic-start-match-confirmation")).toBeVisible({ timeout: 8000 });
});

test("authentic deck builder shows generated cards plus context-menu inspect (cEp5.2)", async ({ page }) => {
  const pageErrors = collectPageErrors(page);

  await page.addInitScript(() => {
    window.localStorage.setItem(
      "gwent_authentic_decks_v1",
      JSON.stringify({
        schemaVersion: "authentic-decks-v1",
        activePresetId: "local-skellige-cep52",
        decks: [
          {
            presetId: "local-skellige-cep52",
            name: "Skellige Generated Smoke",
            faction: "skellige",
            leaderSourceId: "skellige.king-bran",
            mainDeck: [
              { sourceId: "skellige.cerys", count: 1 },
              { sourceId: "skellige.hjalmar", count: 1 },
              { sourceId: "skellige.olaf", count: 1 },
              { sourceId: "skellige.kambi", count: 1 },
              { sourceId: "skellige.berserker", count: 1 },
              { sourceId: "skellige.young-berserker", count: 3 },
              { sourceId: "skellige.clan-an-craite-warrior", count: 3 },
              { sourceId: "skellige.clan-drummond-shield-maiden", count: 3 },
              { sourceId: "skellige.clan-brokvar-archer", count: 3 },
              { sourceId: "skellige.light-longship", count: 3 },
              { sourceId: "skellige.war-longship", count: 3 },
            ],
            sideDeck: [
              { sourceId: "skellige.hemdall", count: 1 },
              { sourceId: "skellige.vildkaarl", count: 1 },
              { sourceId: "skellige.young-vildkaarl", count: 3 },
            ],
          },
        ],
      }),
    );
  });

  await page.goto(authenticDeckBuilderUrl);
  await expect(page.getByTestId("authentic-deck-builder")).toBeVisible();

  const generated = page.getByTestId("authentic-deck-builder-generated");
  await expect(generated).toBeVisible();
  await expect(generated).toContainText("generated cards");
  await expect(generated).not.toContainText(/side deck/i);
  await expect(generated).toContainText("Hemdall");
  await expect(generated).toContainText("Vildkaarl");
  await expect(generated).toContainText("generated by Kambi");
  await expect(generated).toContainText("generated by Berserker");

  const hemdallEntry = generated.locator('[data-source-id="skellige.hemdall"]');
  await expect(hemdallEntry).toBeVisible();

  const poolItem = page.locator('[data-source-id="skellige.berserker"]').first();
  await expect(poolItem).toBeVisible();
  await poolItem.click({ button: "right" });
  const menu = page.getByTestId("authentic-deck-builder-context-menu");
  await expect(menu).toBeVisible();
  await expect(menu).toContainText("Berserker");
  await expect(page.getByTestId("authentic-deck-builder-context-add")).toBeVisible();
  await expect(page.getByTestId("authentic-deck-builder-context-remove")).toBeVisible();
  await expect(page.getByTestId("authentic-deck-builder-context-inspect")).toBeVisible();

  await page.getByTestId("authentic-deck-builder-context-inspect").click();
  await expect(menu).toHaveCount(0);
  const inspect = page.getByTestId("authentic-deck-builder-inspect");
  await expect(inspect).toBeVisible();
  await expect(page.getByTestId("authentic-deck-builder-inspect-source-id")).toHaveText("skellige.berserker");
  await expect(inspect).toContainText("Skellige");
  await expect(inspect).toContainText("Close Combat");
  await expect(inspect).toContainText("Berserker");
  await expect(inspect).toContainText("Generates: Vildkaarl");
  await page.getByTestId("authentic-deck-builder-inspect-close").click();
  await expect(inspect).toHaveCount(0);

  await hemdallEntry.click({ button: "right" });
  await expect(menu).toBeVisible();
  await expect(menu).toContainText("Hemdall");
  await expect(page.getByTestId("authentic-deck-builder-context-add")).toBeDisabled();
  await expect(page.getByTestId("authentic-deck-builder-context-remove")).toBeDisabled();
  await page.getByTestId("authentic-deck-builder-context-inspect").click();
  await expect(page.getByTestId("authentic-deck-builder-inspect")).toBeVisible();
  await expect(page.getByTestId("authentic-deck-builder-inspect-source-id")).toHaveText("skellige.hemdall");
  await expect(page.getByTestId("authentic-deck-builder-inspect-add")).toBeDisabled();
  await expect(page.getByTestId("authentic-deck-builder-inspect-remove")).toBeDisabled();
  await expect(page.getByTestId("authentic-deck-builder-inspect")).toContainText("Generated by: Kambi");
  await page.keyboard.press("Escape");
  await expect(page.getByTestId("authentic-deck-builder-inspect")).toHaveCount(0);

  expect(pageErrors).toEqual([]);
});

test("authentic pre-game, deck builder, and direct match avoid horizontal overflow on a mobile viewport", async ({ page }) => {
  const pageErrors = collectPageErrors(page);

  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto(authenticPregameUrl);

  await expect(page.getByTestId("authentic-pregame")).toBeVisible();
  await expect(page.getByTestId("authentic-leader-card").first()).toBeVisible();
  const modePanelContainment = await page
    .locator(".authentic-pregame__panel")
    .filter({ hasText: "Step 2 - game mode" })
    .evaluate((panel) => {
      const panelRect = panel.getBoundingClientRect();
      const childBottom = Math.max(...Array.from(panel.children).map((child) => child.getBoundingClientRect().bottom));
      return {
        childBottom,
        panelBottom: panelRect.bottom,
        panelHeight: panelRect.height,
        scrollHeight: panel.scrollHeight,
      };
    });
  expect(modePanelContainment.childBottom).toBeLessThanOrEqual(modePanelContainment.panelBottom + 1);
  expect(modePanelContainment.scrollHeight).toBeLessThanOrEqual(modePanelContainment.panelHeight + 2);
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

test("authentic match supports in-match card inspection without breaking gameplay (cEp5.3)", async ({ page }) => {
  const pageErrors = collectPageErrors(page);

  await page.goto(authenticDirectUrl);
  await expect(page.getByTestId("authentic-mulligan-screen")).toBeVisible();
  await page.getByTestId("authentic-confirm-mulligan").click();
  await expect(page.getByTestId("authentic-start-match-confirmation")).toBeVisible();
  await page.getByTestId("authentic-start-match-confirm").click();
  await expect(page.getByTestId("authentic-match-screen")).toBeVisible();

  // Right-click a human hand card.
  const handCard = page.locator(".authentic-hand__card").first();
  await expect(handCard).toBeVisible();
  await handCard.click({ button: "right" });
  const cardMenu = page.getByTestId("authentic-match-card-context-menu");
  await expect(cardMenu).toBeVisible();
  await expect(page.getByTestId("authentic-match-context-inspect")).toBeVisible();

  // Open the inspect modal.
  await page.getByTestId("authentic-match-context-inspect").click();
  await expect(cardMenu).toHaveCount(0);
  const inspectModal = page.getByTestId("authentic-match-card-inspect");
  await expect(inspectModal).toBeVisible();
  await expect(page.getByTestId("authentic-match-inspect-source-id")).toBeVisible();
  await expect(page.getByTestId("authentic-match-inspect-instance-id")).toBeVisible();
  await expect(inspectModal).toContainText(/Hand|Faction|Kind/);

  // Close with Escape.
  await page.keyboard.press("Escape");
  await expect(inspectModal).toHaveCount(0);

  // Hand card left-click still selects card.
  await handCard.click();
  await expect(page.getByTestId("authentic-target-groups")).toBeVisible();

  // Right-click the leader card and inspect.
  const humanLeader = page.getByTestId("authentic-seat-human").locator(".authentic-score-card__leader");
  await humanLeader.click({ button: "right" });
  const leaderMenu = page.getByTestId("authentic-match-leader-context-menu");
  await expect(leaderMenu).toBeVisible();
  await page.getByTestId("authentic-match-leader-context-inspect").click();
  const leaderInspect = page.getByTestId("authentic-match-leader-inspect");
  await expect(leaderInspect).toBeVisible();
  await expect(page.getByTestId("authentic-match-leader-inspect-source-id")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(leaderInspect).toHaveCount(0);

  // Now play a card so that there's a board card to inspect.
  // cEp11: prefer the spatial row target; fall back to the right-rail only
  // when the selected card has a global/no-target play.
  const cep53RowTarget = boardRowTargets(page).first();
  const cep53FallbackTarget = page.getByTestId("authentic-target-action").first();
  if ((await cep53RowTarget.count()) > 0) {
    await expect(cep53RowTarget).toHaveAttribute("data-drop-move-id", /^play:/);
    await cep53RowTarget.click();
  } else {
    await cep53FallbackTarget.click();
  }

  // Board card right-click should open inspect with effective strength.
  const boardCard = page.locator('[data-testid="authentic-effective-strength"]').first();
  await expect(boardCard).toBeVisible();
  await boardCard.click({ button: "right" });
  await expect(cardMenu).toBeVisible();
  await page.getByTestId("authentic-match-context-inspect").click();
  await expect(inspectModal).toBeVisible();
  await expect(page.getByTestId("authentic-match-inspect-effective-strength")).toBeVisible();
  await expect(inspectModal).toContainText(/Board row/);
  await page.getByTestId("authentic-match-inspect-close").click();
  await expect(inspectModal).toHaveCount(0);

  // Verify hidden-info: no AI hand source IDs/names appear in product text.
  const aiHandSection = page.getByTestId("authentic-seat-ai");
  await expect(aiHandSection.getByTestId("authentic-hand-card")).toHaveCount(0);
  const matchPageText = await visiblePageText(page);
  expect(matchPageText).not.toMatch(/instanceId|sourceId|seat_b:\d{3}:|seat_a:\d{3}:/);

  expect(pageErrors).toEqual([]);
});

test("authentic match exposes a weather choice menu for play_any_weather (cEp8)", async ({ page }) => {
  const pageErrors = collectPageErrors(page);

  // Seed a custom Monsters deck with all four weather cards so Eredin's
  // play_any_weather can offer at least two distinct legal options after a
  // keep-hand mulligan. The deck is intentionally bulked with units so the
  // four weather cards are unlikely to all land in the initial 10-card draw.
  await page.addInitScript(() => {
    window.localStorage.setItem(
      "gwent_authentic_decks_v1",
      JSON.stringify({
        schemaVersion: "authentic-decks-v1",
        activePresetId: "local-eredin-cep8",
        decks: [
          {
            presetId: "local-eredin-cep8",
            name: "Eredin Weather Choice Smoke",
            faction: "monsters",
            leaderSourceId: "monsters.eredin-king-of-the-wild-hunt",
            mainDeck: [
              { sourceId: "monsters.draug", count: 1 },
              { sourceId: "monsters.imlerith", count: 1 },
              { sourceId: "monsters.leshen", count: 1 },
              { sourceId: "monsters.kayran", count: 1 },
              { sourceId: "monsters.crone-brewess", count: 1 },
              { sourceId: "monsters.crone-weavess", count: 1 },
              { sourceId: "monsters.crone-whispess", count: 1 },
              { sourceId: "monsters.fiend", count: 1 },
              { sourceId: "monsters.forktail", count: 1 },
              { sourceId: "monsters.frightener", count: 1 },
              { sourceId: "monsters.griffin", count: 1 },
              { sourceId: "monsters.werewolf", count: 1 },
              { sourceId: "monsters.foglet", count: 1 },
              { sourceId: "monsters.harpy", count: 1 },
              { sourceId: "monsters.arachas", count: 3 },
              { sourceId: "monsters.nekker", count: 3 },
              { sourceId: "monsters.ghoul", count: 3 },
              { sourceId: "neutral.biting-frost", count: 1 },
              { sourceId: "neutral.impenetrable-fog", count: 1 },
              { sourceId: "neutral.torrential-rain", count: 1 },
              { sourceId: "neutral.skellige-storm", count: 1 },
            ],
            sideDeck: [],
          },
        ],
      }),
    );
  });

  // Iterate over a small fixed seed list to find one that leaves at least two
  // distinct eligible weather source IDs in deck after the initial draw. The
  // search is bounded and deterministic; production engine seed semantics are
  // unchanged.
  const candidateSeeds = ["cep8-eredin-1", "cep8-eredin-2", "cep8-eredin-3", "cep8-eredin-4", "cep8-eredin-5"];
  let chosenSeed: string | null = null;
  let optionCount = 0;
  let optionLabels: string[] = [];

  for (const seed of candidateSeeds) {
    await page.goto(`/?seed=${seed}`);
    await expect(page.getByTestId("authentic-pregame")).toBeVisible();

    const eredinDeck = page
      .getByTestId("authentic-pregame-deck-option")
      .filter({ hasText: "Eredin Weather Choice Smoke" });
    await expect(eredinDeck).toBeVisible();
    await eredinDeck.click();

    await page.getByTestId("authentic-pregame-begin").click();
    await expect(page.getByTestId("authentic-mulligan-screen")).toBeVisible();
    await page.getByTestId("authentic-confirm-mulligan").click();
    await expect(page.getByTestId("authentic-start-match-confirmation")).toBeVisible();
    await page.getByTestId("authentic-start-match-confirm").click();
    await expect(page.getByTestId("authentic-match-screen")).toBeVisible();

    const trigger = page.getByTestId("authentic-leader-action");
    await expect(trigger).toBeVisible();

    if (await trigger.isDisabled()) {
      continue;
    }
    await expect(page.getByTestId("authentic-leader-status-human")).toContainText(/ready/i);
    await expect(page.getByTestId("authentic-leader-status-human")).toContainText(/active/i);
    await expect(page.getByTestId("authentic-leader-status-human")).toContainText(/ready\s*·\s*active/i);
    await expect(page.getByTestId("authentic-leader-status-human")).not.toContainText(
      /active\s*·\s*waiting for turn\s*·\s*active/i,
    );
    await expect(page.getByTestId("authentic-leader-status-human")).not.toContainText(/discard/i);
    await expect(page.getByTestId("authentic-seat-resources-human")).toHaveAttribute(
      "aria-label",
      /hand \d+, deck \d+/i,
    );
    await expect(page.getByTestId("authentic-seat-resources-human").locator(".authentic-score-card__resource")).toHaveCount(2);
    await expect(page.getByTestId("authentic-seat-resources-human")).toHaveCSS("justify-content", "space-around");
    await expect(
      page.getByTestId("authentic-seat-resources-human").locator(".authentic-score-card__resource-icon").first(),
    ).toHaveCSS("width", "19px");
    await expect(
      page.getByTestId("authentic-seat-resources-human").locator(".authentic-score-card__resource-count").first(),
    ).toHaveCSS("font-size", "16px");
    await expect(
      page.getByTestId("authentic-seat-resources-human").locator(".authentic-score-card__resource-count").first(),
    ).toHaveCSS("font-weight", "700");
    await expect(page.getByTestId("authentic-seat-resources-human")).not.toContainText(/discard/i);
    await expect(page.getByTestId("authentic-seat-human").locator(".authentic-score-card__meta")).toHaveCount(0);
    await expect(page.getByTestId("authentic-life-gems-human")).toHaveAttribute(
      "aria-label",
      "2 of 2 gems remaining",
    );
    await expect(page.getByTestId("authentic-life-gems-human").locator("img")).toHaveCount(2);
    await expect(page.getByTestId("authentic-life-gems-human").locator('[data-gem-state="intact"]')).toHaveCount(2);
    await expect(page.getByTestId("authentic-seat-human")).not.toContainText(/gems 2/i);
    const leaderStatusChip = page.getByTestId("authentic-leader-status-human").locator(".authentic-score-card__leader-chip");
    await expect(leaderStatusChip).toHaveCSS("border-top-style", "none");
    await expect(leaderStatusChip).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");

    await trigger.click();
    const menu = page.getByTestId("authentic-leader-choice-menu");
    if ((await menu.count()) === 0) {
      continue;
    }

    const options = page.getByTestId("authentic-leader-choice-option");
    const count = await options.count();
    if (count >= 2) {
      chosenSeed = seed;
      optionCount = count;
      optionLabels = await options.allTextContents();
      break;
    }
  }

  expect(chosenSeed, "no candidate seed produced >=2 play_any_weather options").not.toBeNull();
  expect(optionCount).toBeGreaterThanOrEqual(2);
  // Labels must be human-readable weather names — never raw deck instance IDs.
  for (const label of optionLabels) {
    expect(label).not.toMatch(/seat_[ab]:\d{3}:/);
    expect(label.length).toBeGreaterThan(0);
  }
  expect(optionLabels.some((label) => /biting frost|impenetrable fog|torrential rain|skellige storm/i.test(label))).toBe(true);
  // The compact row hint should be visible alongside each weather name so the
  // player knows which row each weather affects (e.g. "biting frost · close
  // combat", "skellige storm · ranged + siege"). Assert at least one option
  // shows a row suffix.
  expect(optionLabels.some((label) => /·\s+(close combat|ranged|siege)/i.test(label))).toBe(true);

  // Trigger has the expected ARIA wiring while the menu is open.
  const trigger = page.getByTestId("authentic-leader-action");
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await expect(trigger).toHaveAttribute("aria-controls", "authentic-leader-choice-menu");
  await expect(trigger).toHaveAttribute("aria-haspopup", "menu");

  // Pick a non-first option when possible so we can prove the chosen option
  // (not just the first legal one) was dispatched. Resolve the source ID from
  // the option element's data attribute rather than parsing the visible label,
  // since labels now include row-hint suffixes ("biting frost · close combat").
  const options = page.getByTestId("authentic-leader-choice-option");
  const optionSourceIds = await options.evaluateAll((elements) =>
    elements.map((element) => element.getAttribute("data-source-id") ?? ""),
  );
  let chosenIndex = 0;
  for (let index = 1; index < optionCount; index += 1) {
    const sourceId = optionSourceIds[index] ?? "";
    if (sourceId !== "neutral.biting-frost" && sourceId.startsWith("neutral.")) {
      chosenIndex = index;
      break;
    }
  }
  if (chosenIndex === 0 && optionCount > 1) {
    chosenIndex = 1;
  }
  const expectedSourceId = optionSourceIds[chosenIndex];
  expect(expectedSourceId).toMatch(/^neutral\.(biting-frost|impenetrable-fog|torrential-rain|skellige-storm)$/);

  await options.nth(chosenIndex).click();

  // Menu closes after dispatch.
  await expect(page.getByTestId("authentic-leader-choice-menu")).toHaveCount(0);

  // Leader action becomes used/disabled afterward.
  await expect(page.getByTestId("authentic-leader-action")).toBeDisabled();
  await expect(page.getByTestId("authentic-leader-status-human")).toContainText(/used/i);

  // Recent activity confirms the human used the leader.
  const activity = page.getByTestId("authentic-recent-activity");
  await expect(activity).toContainText(/Human used leader/);

  // Weather zone reflects the chosen option, not just the first legal one.
  const weatherCard = page.locator(`.authentic-weather__card[data-source-id="${expectedSourceId}"]`);
  await expect(weatherCard.first()).toBeVisible();

  // Hidden-info guard: no raw deck instance IDs or opponent hidden card data
  // leak into visible page text.
  const matchPageText = await visiblePageText(page);
  expect(matchPageText).not.toMatch(/instanceId|sourceId|seat_b:\d{3}:|seat_a:\d{3}:/);

  expect(pageErrors).toEqual([]);
});

test("authentic match targets the Weather panel for a selected hand weather card (cEp11.1)", async ({ page }) => {
  const pageErrors = collectPageErrors(page);

  await seedLocalDecks(page, weatherBackfillDeck.presetId, [weatherBackfillDeck]);

  // The fixture has 22 battlefield cards plus the maximum 10 legal weather
  // specials. This short deterministic list keeps production shuffle semantics
  // untouched while making a hand-weather card very likely within a bounded
  // search.
  const candidateSeeds = ["cep111-weather-1", "cep111-weather-2", "cep111-weather-3", "cep111-weather-4"];
  let coveredWeatherTarget = false;

  for (const seed of candidateSeeds) {
    await enterAuthenticMatchFromPreGame(page, {
      seed,
      deckName: weatherBackfillDeck.name,
    });

    const fixtureWeatherCard = page
      .locator(
        weatherFixtureSourceIds
          .map(
            (sourceId) =>
              `[data-testid="authentic-human-hand"] .authentic-hand__card.is-playable[data-source-id="${sourceId}"]`,
          )
          .join(", "),
      )
      .first();

    if ((await fixtureWeatherCard.count()) === 0) {
      continue;
    }

    const selectedSourceId = await fixtureWeatherCard.getAttribute("data-source-id");
    if (!selectedSourceId) {
      throw new Error("fixture weather card was missing its public data-source-id");
    }
    const selectedWeatherName = weatherFixtureSourceNames[selectedSourceId];
    if (!selectedWeatherName) {
      throw new Error(`unexpected fixture weather source id: ${selectedSourceId}`);
    }

    const weatherZoneCard = page.locator(`.authentic-weather__card[data-source-id="${selectedSourceId}"]`);
    const weatherZoneCountBefore = await weatherZoneCard.count();

    await fixtureWeatherCard.getByTestId("authentic-hand-card").click();

    await expect(page.getByTestId("authentic-target-groups")).toHaveAttribute("data-target-state", "has-targets");
    await expect(page.getByTestId("authentic-target-hint")).toContainText("target the weather panel");
    await expect(page.getByTestId("authentic-target-action")).toHaveCount(0);

    const weatherTarget = page.getByTestId("authentic-weather-target");
    await expect(weatherTarget).toBeVisible();
    expect(await weatherTarget.evaluate((element) => element.tagName)).toBe("SECTION");
    await expect(page.locator('button[data-testid="authentic-weather-target"]')).toHaveCount(0);
    await expect(weatherTarget).toHaveAttribute(
      "aria-label",
      new RegExp(`^Play ${escapeRegExp(selectedWeatherName)} on the weather panel$`),
    );

    await weatherTarget.click();

    await expect(weatherZoneCard).toHaveCount(weatherZoneCountBefore + 1);
    await expect(page.getByTestId("authentic-recent-activity")).toContainText(/Human played/);
    await expect(page.getByTestId("authentic-weather-target")).toHaveCount(0);
    await expect(page.getByTestId("authentic-target-groups")).toHaveAttribute("data-target-state", "no-selection");
    await expect(page.getByTestId("authentic-target-hint")).toContainText("no card selected");

    const matchPageText = await visiblePageText(page);
    expect(matchPageText).not.toMatch(/instanceId|sourceId|seat_a:\d{3}:|seat_b:\d{3}:/);

    coveredWeatherTarget = true;
    break;
  }

  expect(coveredWeatherTarget, "no candidate seed produced a visible hand weather card").toBe(true);
  expect(pageErrors).toEqual([]);
});

test("authentic match highlights spatial board-row targets and dispatches the exact PlayCard move (cEp11)", async ({ page }) => {
  const pageErrors = collectPageErrors(page);

  await page.goto(authenticDirectUrl);
  await expect(page.getByTestId("authentic-mulligan-screen")).toBeVisible();
  await page.getByTestId("authentic-confirm-mulligan").click();
  await expect(page.getByTestId("authentic-start-match-confirmation")).toBeVisible();
  await page.getByTestId("authentic-start-match-confirm").click();
  await expect(page.getByTestId("authentic-match-screen")).toBeVisible();

  // No card selected: hint copy reads the no-selection state and the right rail
  // does not show any spatial badges yet.
  await expect(page.getByTestId("authentic-target-hint")).toContainText("no card selected");
  await expect(page.getByTestId("authentic-target-groups")).toHaveAttribute("data-target-state", "no-selection");
  await expect(page.getByTestId("authentic-board-row-target")).toHaveCount(0);
  await expect(boardRowTargets(page)).toHaveCount(0);
  await expect(page.getByTestId("authentic-weather-target")).toHaveCount(0);

  // Select the first playable hand card. Most playable hand cards are units,
  // so a board_row target is the typical highlighted destination.
  await page.locator(".authentic-hand__card.is-playable [data-testid='authentic-hand-card']").first().click();

  await expect(page.getByTestId("authentic-target-groups")).toHaveAttribute("data-target-state", "has-targets");

  // Either the spatial row target or a fallback action exists for the selected
  // card. cEp11 prefers the spatial row target; if the seed selected a global
  // target card first the fallback action stays available without inventing a
  // fake spatial location.
  const cep11RowTarget = boardRowTargets(page).first();
  const cep11FallbackTarget = page.getByTestId("authentic-target-action").first();
  const usedSpatialRowTarget = (await cep11RowTarget.count()) > 0;
  if (usedSpatialRowTarget) {
    await expect(cep11RowTarget).toBeVisible();
    await expect(cep11RowTarget).toHaveAttribute("aria-label", /Play .+ on (your|opponent) (close combat|ranged|siege) row/);
    await expect(cep11RowTarget).toHaveAttribute("data-drop-move-id", /^play:/);
    await expect(page.getByTestId("authentic-board-row-target")).toHaveCount(0);
    await expect(page.locator(".authentic-board-card__target-badge")).toHaveCount(0);
    await cep11RowTarget.click();
  } else {
    await expect(cep11FallbackTarget).toBeVisible();
    await cep11FallbackTarget.click();
  }

  const activity = page.getByTestId("authentic-recent-activity");
  await expect(activity).toContainText(/Human played/);
  await expect(page.getByTestId("authentic-effective-strength").first()).toBeVisible();

  // After dispatch, the engine clears the human selection (no longer playable
  // for that card), so the right-rail hint resets to the no-selection state.
  await expect(page.getByTestId("authentic-target-hint")).toBeVisible();

  // Hidden-info safety: target affordance text and the page as a whole must
  // not contain raw runtime instance IDs or hidden opponent source IDs.
  const matchPageText = await visiblePageText(page);
  expect(matchPageText).not.toMatch(/instanceId|sourceId|seat_b:\d{3}:|seat_a:\d{3}:/);

  // Right-click inspection on a placed board card must still work and must
  // not dispatch the target move.
  const boardCard = page.locator('[data-testid="authentic-effective-strength"]').first();
  await expect(boardCard).toBeVisible();
  await boardCard.click({ button: "right" });
  const cardMenu = page.getByTestId("authentic-match-card-context-menu");
  await expect(cardMenu).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(cardMenu).toHaveCount(0);

  expect(pageErrors).toEqual([]);
});

test("authentic match uses reserved icon-only row horn slots for Commander's Horn targets (cEp13)", async ({ page }) => {
  const pageErrors = collectPageErrors(page);

  await seedLocalDecks(page, hornBackfillDeck.presetId, [hornBackfillDeck]);

  let coveredHornSlot = false;
  for (const seed of ["cep13-horn-1", "cep13-horn-2", "cep13-horn-3", "cep13-horn-4"]) {
    await enterAuthenticMatchFromPreGame(page, {
      seed,
      deckName: hornBackfillDeck.name,
    });

    const hornCard = page.locator(
      '[data-testid="authentic-human-hand"] .authentic-hand__card.is-playable[data-source-id="neutral.commanders-horn"]',
    ).first();

    if ((await hornCard.count()) === 0) {
      continue;
    }

    await hornCard.getByTestId("authentic-hand-card").click();
    await expect(page.getByTestId("authentic-target-hint")).toContainText(/highlighted horn slot/i);

    const hornSlot = page.getByTestId("authentic-board-row-horn-target").first();
    await expect(hornSlot).toBeVisible();
    expect(await hornSlot.evaluate((element) => element.tagName)).toBe("DIV");
    await expect(hornSlot.locator(".authentic-board-row__horn-slot-icon")).toBeVisible();
    await expect(hornSlot).not.toContainText(/horn slot|choose|play here/i);
    await expect(page.locator('button[data-testid="authentic-board-row-horn-target"]')).toHaveCount(0);

    const hornCardCountBefore = await page.locator(".authentic-board-row__horn[data-source-id='neutral.commanders-horn']").count();
    await startMouseDrag(page, hornCard);
    await expect(page.getByTestId("authentic-target-hint")).toContainText(/drag to a highlighted horn slot/i);
    const hornSlotCenter = await locatorCenter(hornSlot);
    const hornSlotBox = await hornSlot.boundingBox();
    expect(hornSlotBox, "horn slot should stay visible for flight target").not.toBeNull();
    await page.mouse.move(hornSlotCenter.x, hornSlotCenter.y, { steps: 8 });
    await expect(hornSlot).toHaveAttribute("data-drop-state", "active");
    await page.mouse.up();

    await expect(page.locator(".authentic-board-row__horn[data-source-id='neutral.commanders-horn']")).toHaveCount(hornCardCountBefore + 1);
    const placedHornSlot = page.locator(
      ".authentic-board-row__horn-slot.has-card:has(.authentic-board-row__horn[data-source-id='neutral.commanders-horn'])",
    ).first();
    await expect(placedHornSlot).toBeVisible();
    const placedHornCard = placedHornSlot.getByTestId("authentic-card").first();
    const placedHornSlotBox = await placedHornSlot.boundingBox();
    const placedHornCardBox = await placedHornCard.boundingBox();
    expect(placedHornSlotBox, "placed horn slot should have a bounding box").not.toBeNull();
    expect(placedHornCardBox, "placed horn card should have a bounding box").not.toBeNull();
    if (placedHornSlotBox && placedHornCardBox) {
      expectBoxDifference(placedHornSlotBox.width - placedHornCardBox.width, 8, "horn slot should be 8px wider than placed card");
      expectBoxDifference(placedHornSlotBox.height - placedHornCardBox.height, 8, "horn slot should be 8px taller than placed card");
    }
    const hornFlight = page.getByTestId("authentic-card-flight").first();
    await expect(hornFlight).toBeVisible();
    const hornFlightDestination = await cardFlightDestination(hornFlight);
    if (hornSlotBox) {
      expect(hornFlightDestination.x).toBeGreaterThanOrEqual(hornSlotBox.x);
      expect(hornFlightDestination.x).toBeLessThanOrEqual(hornSlotBox.x + hornSlotBox.width);
      expect(hornFlightDestination.y).toBeGreaterThanOrEqual(hornSlotBox.y);
      expect(hornFlightDestination.y).toBeLessThanOrEqual(hornSlotBox.y + hornSlotBox.height);
    }

    coveredHornSlot = true;
    break;
  }

  expect(coveredHornSlot, "no candidate seed produced a visible Commander's Horn card").toBe(true);
  expect(pageErrors).toEqual([]);
});

test("authentic match drags a hand card to a legal board row with invalid-drop no-op (cEp12)", async ({ page }) => {
  const pageErrors = collectPageErrors(page);

  let rowPlayableCard: Locator | null = null;
  await seedLocalDecks(page, weatherBackfillDeck.presetId, [weatherBackfillDeck]);
  for (const seed of ["cep12-row-1", "cep12-row-2", "cep12-row-3", "cep12-row-4"]) {
    await enterAuthenticMatchFromPreGame(page, {
      seed,
      deckName: weatherBackfillDeck.name,
    });
    rowPlayableCard = await findFirstRowTargetHandCard(page);
    if (rowPlayableCard) {
      break;
    }
  }

  expect(rowPlayableCard, "no playable hand card exposed a board-row target").not.toBeNull();
  if (!rowPlayableCard) {
    throw new Error("no row-target playable card found");
  }

  const handCardCountBefore = await page.getByTestId("authentic-hand-card").count();
  await rowPlayableCard.click({ button: "right" });
  await expect(page.getByTestId("authentic-match-card-context-menu")).toBeVisible();
  await expect(page.getByTestId("authentic-drag-preview")).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(page.getByTestId("authentic-match-card-context-menu")).toHaveCount(0);

  await startMouseDrag(page, rowPlayableCard);
  await expect(rowPlayableCard).toHaveAttribute("data-drag-state", "dragging");
  await page.mouse.move(8, 8, { steps: 5 });
  await page.mouse.up();
  await expect(page.getByTestId("authentic-drag-preview")).toHaveCount(0);
  await expect(page.getByTestId("authentic-recent-activity")).not.toContainText(/Human played/);
  await expect(page.getByTestId("authentic-hand-card")).toHaveCount(handCardCountBefore);

  const rowTarget = boardRowTargets(page).first();
  await expect(rowTarget).toBeVisible();
  await startMouseDrag(page, rowPlayableCard);
  await expect(page.getByTestId("authentic-target-hint")).toContainText(/drag to a highlighted row/i);
  const rowTargetCenter = await locatorCenter(rowTarget);
  const rowCardStripBox = await rowTarget.locator(".authentic-board-row__cards").boundingBox();
  expect(rowCardStripBox, "row card strip should be visible for flight target").not.toBeNull();
  await page.mouse.move(rowTargetCenter.x, rowTargetCenter.y, { steps: 8 });
  await expect(rowTarget).toHaveAttribute("data-drop-state", "active");
  await expect(page.getByTestId("authentic-board-row-target")).toHaveCount(0);
  await page.mouse.up();

  await expect(page.getByTestId("authentic-drag-preview")).toHaveCount(0);
  const rowFlight = page.getByTestId("authentic-card-flight").first();
  await expect(rowFlight).toBeVisible();
  await expect(rowFlight).toHaveAttribute("data-move-id", /^play:/);
  const rowFlightDestination = await cardFlightDestination(rowFlight);
  if (rowCardStripBox) {
    expect(rowFlightDestination.x).toBeGreaterThanOrEqual(rowCardStripBox.x);
    expect(rowFlightDestination.x).toBeLessThanOrEqual(rowCardStripBox.x + rowCardStripBox.width);
    expect(rowFlightDestination.y).toBeGreaterThanOrEqual(rowCardStripBox.y);
    expect(rowFlightDestination.y).toBeLessThanOrEqual(rowCardStripBox.y + rowCardStripBox.height);
  }
  await expect(page.getByTestId("authentic-recent-activity")).toContainText(/Human played/);

  const matchPageText = await visiblePageText(page);
  expect(matchPageText).not.toMatch(/instanceId|sourceId|seat_a:\d{3}:|seat_b:\d{3}:/);
  expect(pageErrors).toEqual([]);
});

test("authentic match drags a selected weather card to the Weather panel target (cEp12)", async ({ page }) => {
  const pageErrors = collectPageErrors(page);

  await seedLocalDecks(page, weatherBackfillDeck.presetId, [weatherBackfillDeck]);

  const candidateSeeds = ["cep12-weather-1", "cep12-weather-2", "cep12-weather-3", "cep12-weather-4"];
  let coveredWeatherDrag = false;

  for (const seed of candidateSeeds) {
    await enterAuthenticMatchFromPreGame(page, {
      seed,
      deckName: weatherBackfillDeck.name,
    });

    const fixtureWeatherCard = page
      .locator(
        weatherFixtureSourceIds
          .map(
            (sourceId) =>
              `[data-testid="authentic-human-hand"] .authentic-hand__card.is-playable[data-source-id="${sourceId}"]`,
          )
          .join(", "),
      )
      .first();

    if ((await fixtureWeatherCard.count()) === 0) {
      continue;
    }

    const selectedSourceId = await fixtureWeatherCard.getAttribute("data-source-id");
    if (!selectedSourceId) {
      throw new Error("fixture weather card was missing its public data-source-id");
    }
    const selectedWeatherName = weatherFixtureSourceNames[selectedSourceId];
    if (!selectedWeatherName) {
      throw new Error(`unexpected fixture weather source id: ${selectedSourceId}`);
    }
    const weatherZoneCard = page.locator(`.authentic-weather__card[data-source-id="${selectedSourceId}"]`);
    const weatherZoneCountBefore = await weatherZoneCard.count();

    await fixtureWeatherCard.getByTestId("authentic-hand-card").click();
    await expect(page.getByTestId("authentic-target-hint")).toContainText("target the weather panel");
    await startMouseDrag(page, fixtureWeatherCard);
    await expect(fixtureWeatherCard).toHaveAttribute("data-drag-state", "dragging");
    await expect(page.getByTestId("authentic-target-groups")).toHaveAttribute("data-target-state", "has-targets");
    await expect(page.getByTestId("authentic-target-hint")).toContainText("drag to the weather panel");

    const weatherTarget = page.getByTestId("authentic-weather-target");
    await expect(weatherTarget).toBeVisible();
    expect(await weatherTarget.evaluate((element) => element.tagName)).toBe("SECTION");
    await expect(page.locator('button[data-testid="authentic-weather-target"]')).toHaveCount(0);
    await expect(weatherTarget).toHaveAttribute(
      "aria-label",
      new RegExp(`^Play ${escapeRegExp(selectedWeatherName)} on the weather panel$`),
    );

    const weatherTargetCenter = await locatorCenter(weatherTarget);
    await page.mouse.move(weatherTargetCenter.x, weatherTargetCenter.y, { steps: 8 });
    await expect(weatherTarget).toHaveAttribute("data-drop-state", "active");
    await page.mouse.up();

    await expect(weatherZoneCard).toHaveCount(weatherZoneCountBefore + 1);
    const weatherFlight = page.getByTestId("authentic-card-flight").first();
    await expect(weatherFlight).toBeVisible();
    const weatherFlightDestination = await cardFlightDestination(weatherFlight);
    const weatherCardStrip = page.locator(".authentic-weather__cards");
    const weatherCardStripBox = await weatherCardStrip.boundingBox();
    expect(weatherCardStripBox, "weather card strip should be visible for flight target").not.toBeNull();
    if (weatherCardStripBox) {
      expect(weatherFlightDestination.x).toBeGreaterThanOrEqual(weatherCardStripBox.x);
      expect(weatherFlightDestination.x).toBeLessThanOrEqual(weatherCardStripBox.x + weatherCardStripBox.width);
      expect(weatherFlightDestination.y).toBeGreaterThanOrEqual(weatherCardStripBox.y);
      expect(weatherFlightDestination.y).toBeLessThanOrEqual(weatherCardStripBox.y + weatherCardStripBox.height);
    }
    await expect(page.getByTestId("authentic-recent-activity")).toContainText(/Human played/);
    await expect(page.getByTestId("authentic-drag-preview")).toHaveCount(0);

    const matchPageText = await visiblePageText(page);
    expect(matchPageText).not.toMatch(/instanceId|sourceId|seat_a:\d{3}:|seat_b:\d{3}:/);
    coveredWeatherDrag = true;
    break;
  }

  expect(coveredWeatherDrag, "no candidate seed produced a visible hand weather card").toBe(true);
  expect(pageErrors).toEqual([]);
});

test("authentic match renders generated row weather overlays after weather play (cEp13)", async ({ page }) => {
  const pageErrors = collectPageErrors(page);

  await seedLocalDecks(page, weatherBackfillDeck.presetId, [weatherBackfillDeck]);

  const candidateSeeds = ["cep13-weather-1", "cep13-weather-2", "cep13-weather-3", "cep13-weather-4"];
  let coveredWeatherOverlay = false;

  for (const seed of candidateSeeds) {
    await enterAuthenticMatchFromPreGame(page, {
      seed,
      deckName: weatherBackfillDeck.name,
    });

    const fixtureWeatherCard = page
      .locator(
        weatherFixtureSourceIds
          .map(
            (sourceId) =>
              `[data-testid="authentic-human-hand"] .authentic-hand__card.is-playable[data-source-id="${sourceId}"]`,
          )
          .join(", "),
      )
      .first();

    if ((await fixtureWeatherCard.count()) === 0) {
      continue;
    }

    const selectedSourceId = await fixtureWeatherCard.getAttribute("data-source-id");
    if (!selectedSourceId) {
      throw new Error("fixture weather card was missing its public data-source-id");
    }
    const expectation = weatherOverlayExpectations[selectedSourceId];
    if (!expectation) {
      throw new Error(`unexpected fixture weather source id: ${selectedSourceId}`);
    }

    await fixtureWeatherCard.getByTestId("authentic-hand-card").click();
    const weatherTarget = page.getByTestId("authentic-weather-target");
    await expect(weatherTarget).toBeVisible();
    expect(await weatherTarget.evaluate((element) => element.tagName)).toBe("SECTION");
    await expect(page.locator('button[data-testid="authentic-weather-target"]')).toHaveCount(0);
    await weatherTarget.click();

    const overlay = page.locator(
      `[data-testid="authentic-row-weather-overlay"][data-weather-effect="${expectation.effect}"]`,
    );
    await expect(overlay.first()).toBeVisible();
    await expect(overlay).toHaveCount(expectation.rowCount);
    const affectedRows = page.locator(`[data-testid="authentic-board-row"][data-weather-overlay~="${expectation.effect}"]`);
    await expect(affectedRows.first()).toBeVisible();
    await expect(affectedRows.first().locator(".authentic-board-row__label span")).toHaveCSS("color", "rgb(232, 223, 196)");
    await expect(affectedRows.first().locator(".authentic-board-row__label strong")).toHaveCSS("color", "rgb(232, 223, 196)");
    await expect(affectedRows.locator(".authentic-board-row__empty").first()).toHaveCSS("color", "rgb(232, 223, 196)");
    await expect(affectedRows.first().locator(".authentic-board-row__horn-slot")).toHaveCSS(
      "box-shadow",
      /rgba\(232, 223, 196, 0\.(78|92)\)/,
    );
    await expect(affectedRows.first().locator(".authentic-board-row__horn-slot-icon")).toHaveCSS("filter", /invert\(1\)/);
    const weatheredStrength = affectedRows.locator(
      '[data-testid="authentic-effective-strength"][data-weather-affected="true"] .authentic-card__strength',
    );
    if ((await weatheredStrength.count()) > 0) {
      await expect(weatheredStrength.first()).toHaveCSS("color", "rgb(255, 75, 62)");
    }

    if (selectedSourceId === "neutral.skellige-storm") {
      await expect(page.locator('[data-testid="authentic-board-row"][data-weather-overlay~="skellige-storm"]')).toHaveCount(4);
    }

    const matchPageText = await visiblePageText(page);
    expect(matchPageText).not.toMatch(/instanceId|sourceId|seat_a:\d{3}:|seat_b:\d{3}:/);
    coveredWeatherOverlay = true;
    break;
  }

  expect(coveredWeatherOverlay, "no candidate seed produced a visible hand weather card").toBe(true);
  expect(pageErrors).toEqual([]);
});

test("authentic match-end ledger is reachable through product controls (cEp11.1)", async ({ page }) => {
  const pageErrors = collectPageErrors(page);

  await page.goto(authenticMatchEndBackfillUrl);
  await confirmAuthenticMulliganAndStartMatch(page);

  // A pass-only product path is enough to finish two real rounds with the
  // existing AI policy: after the human passes, legal-heuristic-v0 plays or
  // passes from legal moves until both seats have passed.
  await passAndResolveRoundsUntilMatchEnd(page);

  const overlay = page.getByTestId("authentic-round-overlay");
  await expect(overlay).toBeVisible();
  await expect(overlay).toHaveAttribute("data-ledger-kind", "match_end");
  await expect(overlay).toHaveAttribute("role", "dialog");
  await expect(overlay).toHaveAttribute("aria-modal", "true");

  const alert = page.getByTestId("authentic-round-overlay-alert");
  await expect(alert).toBeVisible();
  await expect(alert.getByRole("heading", { level: 2 })).toHaveText(/^(Victory over .+\.|Defeat against .+\.|Draw\.)$/);
  await expect(alert).toContainText(/match concluded/i);

  await expect(page.getByTestId("authentic-round-ledger-history")).toBeVisible();
  expect(await page.getByTestId("authentic-round-ledger-history-row").count()).toBeGreaterThanOrEqual(2);
  await expect(page.getByTestId("authentic-round-ledger-standing-result")).toBeVisible();
  await expect(page.getByTestId("authentic-round-ledger-standing-rounds")).toBeVisible();
  await expect(page.getByTestId("authentic-round-ledger-standing-gems")).toBeVisible();

  const ledgerText = await overlay.innerText();
  expect(ledgerText).not.toMatch(/\b(mmr|rank|streak|xp|reward|elo)\b/i);

  await page.keyboard.press("Escape");
  await expect(overlay).toBeVisible();

  const matchEndText = await visiblePageText(page);
  expect(matchEndText).not.toMatch(/instanceId|sourceId|seat_a:\d{3}:|seat_b:\d{3}:/);

  const rematch = page.getByTestId("authentic-game-end-rematch");
  await expect(rematch).toBeVisible();
  await rematch.click();

  await expect(page.getByTestId("authentic-mulligan-screen")).toBeVisible();
  await expect(page.getByTestId("authentic-round-overlay")).toHaveCount(0);
  await page.getByTestId("authentic-confirm-mulligan").click();
  await expect(page.getByTestId("authentic-start-match-confirmation")).toBeVisible({ timeout: 10000 });
  await page.getByTestId("authentic-start-match-confirm").click();
  await expect(page.getByTestId("authentic-match-screen")).toBeVisible();
  await expect(page.getByTestId("authentic-round-overlay")).toHaveCount(0);

  const rematchText = await visiblePageText(page);
  expect(rematchText).not.toMatch(/instanceId|sourceId|seat_a:\d{3}:|seat_b:\d{3}:/);
  expect(pageErrors).toEqual([]);
});

test("authentic match avoids nested interactive elements on board rows (cEp11)", async ({ page }) => {
  const pageErrors = collectPageErrors(page);

  await page.goto(authenticDirectUrl);
  await expect(page.getByTestId("authentic-mulligan-screen")).toBeVisible();
  await page.getByTestId("authentic-confirm-mulligan").click();
  await expect(page.getByTestId("authentic-start-match-confirmation")).toBeVisible();
  await page.getByTestId("authentic-start-match-confirm").click();
  await expect(page.getByTestId("authentic-match-screen")).toBeVisible();

  // Each board row container must be a non-interactive element. Row-level
  // target affordances are dedicated child buttons, never the row container
  // itself, so board cards (which are themselves <button> for card_instance
  // targets) cannot be wrapped inside another <button>.
  const rowTagNames = await page
    .getByTestId("authentic-board-row")
    .evaluateAll((elements) => elements.map((element) => element.tagName.toLocaleLowerCase()));
  expect(rowTagNames.length).toBeGreaterThan(0);
  for (const tagName of rowTagNames) {
    expect(tagName).toBe("div");
  }

  // The spatial board cards (`authentic-effective-strength`) and any board-card
  // targets must never have a button ancestor that is the row container.
  const handCard = page.locator(".authentic-hand__card.is-playable [data-testid='authentic-hand-card']").first();
  if ((await handCard.count()) > 0) {
    await handCard.click();
    const rowTarget = boardRowTargets(page).first();
    if ((await rowTarget.count()) > 0) {
      await expect(page.getByTestId("authentic-board-row-target")).toHaveCount(0);
      const rowTargetTag = await rowTarget.evaluate((element) => element.tagName);
      expect(rowTargetTag).toBe("DIV");
    }
  }

  expect(pageErrors).toEqual([]);
});

test("authentic match opens a one-time look_three_cards reveal modal (cCp28)", async ({ page }) => {
  const pageErrors = collectPageErrors(page);

  // Seed a custom Nilfgaard deck with Emhyr: Emperor of Nilfgaard so the human
  // leader can fire `look_three_cards` after mulligan. The deck is intentionally
  // bulked with units so the AI opponent retains hidden hand cards (the leader
  // requires opponent hand length >= 1 to be legal). The modal opens for the
  // human seat with the chosen opponent hand cards visible only to the prompt
  // owner.
  await page.addInitScript(() => {
    window.localStorage.setItem(
      "gwent_authentic_decks_v1",
      JSON.stringify({
        schemaVersion: "authentic-decks-v1",
        activePresetId: "local-emperor-ccp28",
        decks: [
          {
            presetId: "local-emperor-ccp28",
            name: "Emperor Look Three Smoke",
            faction: "nilfgaard",
            leaderSourceId: "nilfgaard.emhyr-var-emreis-emperor-of-nilfgaard",
            mainDeck: [
              { sourceId: "nilfgaard.menno-coehoorn", count: 1 },
              { sourceId: "nilfgaard.morvran-voorhis", count: 1 },
              { sourceId: "nilfgaard.tibor-eggebracht", count: 1 },
              { sourceId: "nilfgaard.albrich", count: 1 },
              { sourceId: "nilfgaard.assire-var-anahid", count: 1 },
              { sourceId: "nilfgaard.cynthia", count: 1 },
              { sourceId: "nilfgaard.fringilla-vigo", count: 1 },
              { sourceId: "nilfgaard.rainfarn", count: 1 },
              { sourceId: "nilfgaard.renuald-aep-matsen", count: 1 },
              { sourceId: "nilfgaard.shilard-fitz-oesterlen", count: 1 },
              { sourceId: "nilfgaard.sweers", count: 1 },
              { sourceId: "nilfgaard.vanhemar", count: 1 },
              { sourceId: "nilfgaard.vattier-de-rideaux", count: 1 },
              { sourceId: "nilfgaard.black-infantry-archer", count: 2 },
              { sourceId: "nilfgaard.etolian-auxiliary-archers", count: 2 },
              { sourceId: "nilfgaard.heavy-zerrikanian-fire-scorpion", count: 1 },
              { sourceId: "nilfgaard.nausicaa-cavalry-rider", count: 3 },
              { sourceId: "nilfgaard.siege-technician", count: 1 },
              { sourceId: "nilfgaard.young-emissary", count: 2 },
            ],
            sideDeck: [],
          },
        ],
      }),
    );
  });

  await page.goto("/?seed=ccp28-emperor-1");
  await expect(page.getByTestId("authentic-pregame")).toBeVisible();

  const emperorDeck = page
    .getByTestId("authentic-pregame-deck-option")
    .filter({ hasText: "Emperor Look Three Smoke" });
  await expect(emperorDeck).toBeVisible();
  await emperorDeck.click();

  await page.getByTestId("authentic-pregame-begin").click();
  await expect(page.getByTestId("authentic-mulligan-screen")).toBeVisible();
  await page.getByTestId("authentic-confirm-mulligan").click();
  await expect(page.getByTestId("authentic-start-match-confirmation")).toBeVisible();
  await page.getByTestId("authentic-start-match-confirm").click();
  await expect(page.getByTestId("authentic-match-screen")).toBeVisible();

  const trigger = page.getByTestId("authentic-leader-action");
  await expect(trigger).toBeVisible();
  await expect(trigger).toContainText("look at hand");
  await expect(page.getByTestId("authentic-leader-status-human")).toContainText(/ready/i);
  // The look_three_cards leader emits exactly one no-target legal `use_leader`
  // move; the trigger should be enabled because the AI opponent has cards in
  // hand after mulligan.
  await expect(trigger).toBeEnabled();

  await trigger.click();

  // The one-time reveal modal opens.
  const dialog = page.getByTestId("authentic-look-three-cards-dialog");
  await expect(dialog).toBeVisible();
  await expect(page.getByTestId("authentic-prompt")).toContainText(/Look at hand/i);
  await expect(page.getByTestId("authentic-prompt")).toContainText(/shown once/i);

  // The dialog shows 1-3 revealed card faces.
  const revealedCards = page.getByTestId("authentic-look-three-cards-card");
  const revealedCount = await revealedCards.count();
  expect(revealedCount).toBeGreaterThanOrEqual(1);
  expect(revealedCount).toBeLessThanOrEqual(3);

  // No raw deck instance IDs leak into the dialog text.
  const dialogText = (await dialog.textContent()) ?? "";
  expect(dialogText).not.toMatch(/seat_[ab]:\d{3}:/);

  // Acknowledgement closes the dialog.
  await page.getByTestId("authentic-look-three-cards-ack").click();
  await expect(dialog).toHaveCount(0);

  // The dialog cannot be reopened: the leader is now used.
  await expect(page.getByTestId("authentic-leader-action")).toBeDisabled();
  await expect(page.getByTestId("authentic-leader-status-human")).toContainText(/used/i);

  // Recent activity confirms the human used the leader. The activity entry
  // does not leak revealed card names or source IDs (count-only summary).
  const activity = page.getByTestId("authentic-recent-activity");
  await expect(activity).toContainText(/Human used leader/);
  const activityText = (await activity.textContent()) ?? "";
  expect(activityText).not.toMatch(/seat_[ab]:\d{3}:/);

  // The opponent hand strip stays backs/count-only.
  const matchPageText = await visiblePageText(page);
  expect(matchPageText).not.toMatch(/instanceId|sourceId|seat_b:\d{3}:|seat_a:\d{3}:/);

  expect(pageErrors).toEqual([]);
});
