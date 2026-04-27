import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Alert } from "@/components/gwent/alert";
import Listbox from "@/components/gwent/Listbox";

describe("authentic alert and listbox components", () => {
  it("renders the ledger alert with severity, eyebrow, body, and actions", () => {
    const markup = renderToStaticMarkup(
      <Alert
        severity="error"
        eyebrow="move unavailable"
        title="That row no longer admits this card."
        body={<p>Choose another target.</p>}
        actions={[{ label: "Understood", onClick: () => undefined, kind: "primary" }]}
        testId="test-alert"
      />,
    );

    expect(markup).toContain("authentic-alert--ledger");
    expect(markup).toContain("authentic-alert--error");
    expect(markup).toContain("move unavailable");
    expect(markup).toContain("That row no longer admits this card.");
    expect(markup).toContain("Choose another target.");
    expect(markup).toContain("Understood");
  });

  it("renders the seal alert variant for ceremonial round/game states", () => {
    const markup = renderToStaticMarkup(
      <Alert severity="success" variant="seal" eyebrow="match concluded" title="Victory" />,
    );

    expect(markup).toContain("authentic-alert--seal");
    expect(markup).toContain("authentic-alert__seal-sigil");
    expect(markup).toContain("match concluded");
    expect(markup).toContain("Victory");
  });

  it("renders the custom listbox trigger and disabled option metadata", () => {
    const markup = renderToStaticMarkup(
      <Listbox
        label="opponent"
        value="emhyr"
        onChange={() => undefined}
        options={[
          { value: "eredin", label: "Eredin", meta: "monsters" },
          { value: "emhyr", label: "Emhyr var Emreis", meta: "nilfgaard" },
          { value: "iorveth", label: "Iorveth", meta: "scoia'tael", disabled: true },
        ]}
        testId="test-listbox"
      />,
    );

    expect(markup).toContain("authentic-listbox");
    expect(markup).toContain("aria-haspopup=\"listbox\"");
    expect(markup).toContain("data-testid=\"test-listbox\"");
    expect(markup).toContain("Emhyr var Emreis");
  });
});
