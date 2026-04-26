import React, { useMemo } from "react";

import {
  currentCatalogCards,
  currentCatalogLeaders,
  neutralCatalogCards,
  nilfgaardCatalogCards,
  northernRealmsCatalogCards,
} from "@/data/catalog";

import AuthenticCard from "./AuthenticCard";
import AuthenticCardBack from "./AuthenticCardBack";
import {
  getAbilityDisplay,
  listFactionDisplays,
  listRowDisplays,
} from "./displayMetadata";
import { fromCatalogCard } from "./cardViewModel";
import "./authentic-ui.css";

interface SampleCardEntry {
  readonly key: string;
  readonly card: ReturnType<typeof fromCatalogCard>;
}

const pickFirstSourceId = (
  list: readonly { sourceId: string }[],
  fallback: string,
): string => list[0]?.sourceId ?? fallback;

const findCardById = (sourceId: string) =>
  currentCatalogCards.find((card) => card.sourceId === sourceId);

const buildSampleCards = (): readonly SampleCardEntry[] => {
  const samples: SampleCardEntry[] = [];

  const nrFirst = findCardById(pickFirstSourceId(northernRealmsCatalogCards, ""));
  if (nrFirst) {
    samples.push({ key: `nr-${nrFirst.sourceId}`, card: fromCatalogCard(nrFirst) });
  }

  const ngFirst = findCardById(pickFirstSourceId(nilfgaardCatalogCards, ""));
  if (ngFirst) {
    samples.push({ key: `ng-${ngFirst.sourceId}`, card: fromCatalogCard(ngFirst) });
  }

  const neutralUnit = neutralCatalogCards.find(
    (card) => card.kind === "unit" || card.kind === "hero",
  );
  if (neutralUnit) {
    samples.push({ key: `neutral-${neutralUnit.sourceId}`, card: fromCatalogCard(neutralUnit) });
  }

  const ability = neutralCatalogCards.find((card) => {
    const tags = card.tags as readonly string[];
    return card.kind === "special" || tags.includes("weather");
  });
  if (ability) {
    samples.push({ key: `special-${ability.sourceId}`, card: fromCatalogCard(ability) });
  }

  return samples;
};

const buildFallbackSample = (): SampleCardEntry | null => {
  const base = neutralCatalogCards[0] ?? currentCatalogCards[0];
  if (!base) {
    return null;
  }
  return {
    key: `fallback-${base.sourceId}`,
    card: {
      ...fromCatalogCard(base),
      image: "/images/__missing-on-purpose__.png",
    },
  };
};

const AuthenticUiHarness: React.FC = () => {
  const samples = useMemo(buildSampleCards, []);
  const fallbackSample = useMemo(buildFallbackSample, []);
  const factions = listFactionDisplays();
  const rows = listRowDisplays();
  const abilityChips = useMemo(
    () =>
      [
        "spy",
        "medic",
        "tight_bond",
        "morale_boost",
        "scorch",
        "commanders_horn",
        "decoy",
        "frost",
        "fog",
        "rain",
        "clear_weather",
      ].map((id) => getAbilityDisplay(id)),
    [],
  );
  const leaderCount = currentCatalogLeaders.length;

  return (
    <main
      className="gwent-authentic gwent-authentic--harness"
      data-testid="authentic-ui-harness"
    >
      <div className="authentic-harness">
        <header className="authentic-harness__topbar">
          <h1 className="authentic-harness__title">Authentic UI Foundation</h1>
          <span className="authentic-harness__caption">
            cEp1 · gallery harness · {currentCatalogCards.length} cards · {leaderCount} leaders
          </span>
        </header>

        <section
          className="authentic-harness__panel"
          aria-label="Faction palette"
        >
          <h2 className="authentic-harness__panel-title">Factions</h2>
          <p className="authentic-harness__panel-subtitle">
            Production palette for current catalog factions.
          </p>
          <div className="authentic-harness__chips">
            {factions.map((faction) => (
              <span
                key={faction.id}
                className="authentic-harness__chip"
                data-testid="authentic-metadata-swatch"
                data-metadata-kind="faction"
              >
                <span
                  className="authentic-harness__chip-swatch"
                  style={{ background: faction.color, borderColor: faction.accent }}
                  aria-hidden="true"
                />
                <span>{faction.short}</span>
                <span aria-hidden="true">·</span>
                <span>{faction.name}</span>
              </span>
            ))}
          </div>
        </section>

        <section
          className="authentic-harness__panel"
          aria-label="Row glyphs"
        >
          <h2 className="authentic-harness__panel-title">Rows</h2>
          <div className="authentic-harness__chips">
            {rows.map((row) => (
              <span
                key={row.id}
                className="authentic-harness__chip"
                data-testid="authentic-metadata-swatch"
                data-metadata-kind="row"
              >
                <span className="authentic-harness__chip-glyph" aria-hidden="true">
                  {row.glyph}
                </span>
                <span>{row.name}</span>
              </span>
            ))}
          </div>
        </section>

        <section
          className="authentic-harness__panel"
          aria-label="Ability glyphs"
        >
          <h2 className="authentic-harness__panel-title">Abilities</h2>
          <div className="authentic-harness__chips">
            {abilityChips.map((ability) => (
              <span
                key={ability.id}
                className="authentic-harness__chip"
                data-testid="authentic-metadata-swatch"
                data-metadata-kind="ability"
                title={ability.description ?? ability.name}
              >
                <span className="authentic-harness__chip-glyph" aria-hidden="true">
                  {ability.glyph || "·"}
                </span>
                <span>{ability.name}</span>
              </span>
            ))}
          </div>
        </section>

        <section
          className="authentic-harness__panel"
          aria-label="Sample card row"
        >
          <h2 className="authentic-harness__panel-title">Sample Cards</h2>
          <p className="authentic-harness__panel-subtitle">
            Catalog cards across factions and kinds. The hidden seat is shown by an
            opaque card back; identity stays in the catalog.
          </p>
          <div className="authentic-harness__panel-body">
            <span className="authentic-harness__row-label">Catalog</span>
            {samples.map((sample) => (
              <AuthenticCard key={sample.key} card={sample.card} size="md" />
            ))}
            <span className="authentic-harness__row-label">Hidden</span>
            <AuthenticCardBack size="md" faction="neutral" label="Hidden seat card back" />
          </div>
          <hr className="authentic-harness__divider" />
          <div className="authentic-harness__panel-body">
            <span className="authentic-harness__row-label">Sizes</span>
            {samples[0] ? (
              (["xs", "sm", "md", "lg"] as const).map((size) => (
                <AuthenticCard
                  key={`size-${size}`}
                  card={samples[0]!.card}
                  size={size}
                />
              ))
            ) : null}
          </div>
        </section>

        {fallbackSample ? (
          <section
            className="authentic-harness__panel"
            aria-label="Missing image fallback"
          >
            <h2 className="authentic-harness__panel-title">Missing Image Fallback</h2>
            <p className="authentic-harness__panel-subtitle">
              When a card image is missing or fails to load, an SVG placeholder
              rendered from faction and kind metadata is used instead.
            </p>
            <div className="authentic-harness__panel-body">
              <AuthenticCard
                card={fallbackSample.card}
                size="md"
                testId="authentic-card-fallback"
              />
            </div>
          </section>
        ) : null}

        <p className="authentic-harness__notes">
          This harness is a visual foundation. The match table, prompts, and deck
          builder are intentionally deferred to later Cluster E phases.
        </p>
      </div>
    </main>
  );
};

export default AuthenticUiHarness;
