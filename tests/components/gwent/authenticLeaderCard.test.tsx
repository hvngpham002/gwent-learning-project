import fs from "node:fs";

import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import AuthenticLeaderCard from "@/components/gwent/AuthenticLeaderCard";
import { dimensionsForSize } from "@/components/gwent/cardViewModel";

describe("AuthenticLeaderCard", () => {
  it("renders leader image and accessible label without unit rule badges", () => {
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
    expect(markup).not.toContain("<figcaption");
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

  it("uses the foundation medium dimensions for match score-card leaders", () => {
    const dimensions = dimensionsForSize("md");
    const markup = renderToStaticMarkup(
      <AuthenticLeaderCard
        size="match"
        leader={{
          sourceId: "leader.match",
          name: "Foltest: Lord Commander of The North",
          faction: "northern_realms",
          abilityName: "Clear Weather",
          image: "/images/northern_realms/leaders/Foltest_Lord_Commander_of_the_North.png",
        }}
      />,
    );

    expect(markup).toContain("authentic-leader-card--match");
    expect(markup).toContain(`width:${dimensions.width}px`);
    expect(markup).toContain(`min-height:${dimensions.height}px`);
    expect(markup).toContain(`height:${dimensions.height}px`);
  });

  it("uses the foundation large dimensions for deck-builder leader previews", () => {
    const dimensions = dimensionsForSize("lg");
    const markup = renderToStaticMarkup(
      <AuthenticLeaderCard
        size="large"
        leader={{
          sourceId: "leader.large",
          name: "Foltest: Lord Commander of The North",
          faction: "northern_realms",
          abilityName: "Clear Weather",
          image: "/images/northern_realms/leaders/Foltest_Lord_Commander_of_the_North.png",
        }}
      />,
    );

    expect(markup).toContain("authentic-leader-card--large");
    expect(markup).toContain(`width:${dimensions.width}px`);
    expect(markup).toContain(`min-height:${dimensions.height}px`);
    expect(markup).toContain(`height:${dimensions.height}px`);
  });

  it("does not leak pile count typography into nested card badges", () => {
    const css = fs.readFileSync("src/components/gwent/authentic-match.css", "utf8");

    expect(css).toContain(".authentic-pile > span");
    expect(css).not.toContain(".authentic-pile span {\n  color: var(--accent);");
  });
});
