import fs from "node:fs";

import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import AuthenticLeaderCard from "@/components/gwent/AuthenticLeaderCard";

describe("AuthenticLeaderCard", () => {
  it("renders leader name, image, and faction without unit rule badges", () => {
    const markup = renderToStaticMarkup(
      <AuthenticLeaderCard
        size="pregame"
        leader={{
          sourceId: "leader.test",
          name: "Foltest: Lord Commander of The North",
          faction: "northern_realms",
          abilityName: "Clear Weather",
          image: "/images/northern_realms/leaders/Foltest_Lord_Commander_of_the_North.png",
        }}
      />,
    );

    expect(markup).toContain("authentic-leader-card");
    expect(markup).toContain("authentic-leader-card__image");
    expect(markup).toContain("Foltest: Lord Commander of The North");
    expect(markup).toContain("Clear Weather");
    expect(markup).not.toContain("authentic-card__strength");
    expect(markup).not.toContain("authentic-card__row");
  });

  it("renders deterministic fallback when no leader image is present", () => {
    const markup = renderToStaticMarkup(
      <AuthenticLeaderCard
        leader={{
          sourceId: "leader.missing",
          name: "Emhyr var Emreis: The Relentless",
          faction: "nilfgaard",
          abilityName: "Draw Opponent Discard",
          image: "",
        }}
      />,
    );

    expect(markup).toContain("authentic-leader-card__fallback");
    expect(markup).toContain("NG");
    expect(markup).toContain("Emhyr var Emreis");
  });

  it("keeps source leader images contained instead of cropped", () => {
    const css = fs.readFileSync("src/components/gwent/authentic-leader-card.css", "utf8");

    expect(css).toContain(".authentic-leader-card__image");
    expect(css).toContain("object-fit: contain");
  });
});
