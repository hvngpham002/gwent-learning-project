import React, { useMemo, useRef, useState } from "react";

import { currentCatalogCards, currentCatalogLeaders } from "@/data/catalog";
import type { CatalogDeckPreset, CatalogLeaderSource } from "@/game/catalog";

import AuthenticCard from "./AuthenticCard";
import {
  addCardToDeck,
  buildCardPool,
  buildDeckCardItems,
  createEmptyDeckPreset,
  filterCardPool,
  leadersForFaction,
  removeCardFromDeck,
  validateDeckPreset,
} from "./deckBuilderViewModel";
import { parseDeckImport, stringifyDeckExport } from "./deckBuilderImportExport";
import { writeDeckBuilderStore } from "./deckBuilderStorage";
import type { DeckBuilderFilter } from "./deckBuilderTypes";
import { fromCatalogCard } from "./cardViewModel";
import { getAbilityDisplay, getFactionDisplay, getLeaderAbilityDisplay } from "./displayMetadata";
import "./authentic-deck-builder.css";

interface AuthenticDeckBuilderScreenProps {
  readonly decks: readonly CatalogDeckPreset[];
  readonly activePresetId?: string;
  readonly storageWarning?: string | null;
  readonly onDecksChange: (decks: readonly CatalogDeckPreset[], activePresetId?: string) => void;
  readonly onExit: () => void;
  readonly onPlay: (deck: CatalogDeckPreset) => void;
}

const newLocalId = () => `local-${Date.now().toString(36)}`;

const deckTotal = (deck: CatalogDeckPreset) => deck.mainDeck.reduce((total, entry) => total + entry.count, 0);

const AuthenticDeckBuilderScreen: React.FC<AuthenticDeckBuilderScreenProps> = ({
  decks,
  activePresetId,
  storageWarning,
  onDecksChange,
  onExit,
  onPlay,
}) => {
  const activeDeck = decks.find((deck) => deck.presetId === activePresetId) ?? decks[0];
  const [filter, setFilter] = useState<DeckBuilderFilter>("all");
  const [search, setSearch] = useState("");
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(activeDeck?.mainDeck[0]?.sourceId ?? null);
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [importErrors, setImportErrors] = useState<readonly string[]>([]);
  const [notice, setNotice] = useState(storageWarning ?? "");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const stats = useMemo(() => (activeDeck ? validateDeckPreset(activeDeck) : null), [activeDeck]);
  const pool = useMemo(() => (activeDeck ? filterCardPool(buildCardPool(activeDeck), filter, search) : []), [activeDeck, filter, search]);
  const deckItems = useMemo(() => (activeDeck ? buildDeckCardItems(activeDeck) : []), [activeDeck]);
  const selectedCard =
    currentCatalogCards.find((card) => card.sourceId === selectedSourceId) ?? deckItems[0]?.card ?? pool[0]?.card ?? null;
  const leaderOptions = activeDeck ? leadersForFaction(activeDeck.faction) : [];
  const leader: CatalogLeaderSource | null =
    currentCatalogLeaders.find((candidate) => candidate.sourceId === activeDeck?.leaderSourceId) ?? null;
  const leaderAbility = leader ? getLeaderAbilityDisplay(leader.ability) : null;
  const selectedAbility = selectedCard?.abilities.find((ability) => ability !== "none");
  const selectedAbilityDisplay = selectedAbility ? getAbilityDisplay(selectedAbility) : null;

  const updateDecks = (nextDecks: readonly CatalogDeckPreset[], nextActiveId = activeDeck?.presetId) => {
    onDecksChange(nextDecks, nextActiveId);
    const write = writeDeckBuilderStore({
      schemaVersion: "authentic-decks-v1",
      decks: nextDecks,
      activePresetId: nextActiveId,
    });
    setNotice(write.warning ?? "saved");
  };

  const updateActiveDeck = (nextDeck: CatalogDeckPreset) => {
    updateDecks(decks.map((deck) => (deck.presetId === nextDeck.presetId ? nextDeck : deck)), nextDeck.presetId);
  };

  const addCard = (sourceId: string) => {
    if (!activeDeck) return;
    setSelectedSourceId(sourceId);
    updateActiveDeck(addCardToDeck(activeDeck, sourceId));
  };

  const removeCard = (sourceId: string) => {
    if (!activeDeck) return;
    setSelectedSourceId(sourceId);
    updateActiveDeck(removeCardFromDeck(activeDeck, sourceId));
  };

  const createDeck = () => {
    const deck = createEmptyDeckPreset(newLocalId());
    updateDecks([...decks, deck], deck.presetId);
    setSelectedSourceId(null);
  };

  const deleteDeck = () => {
    if (!activeDeck || decks.length <= 1) return;
    if (!window.confirm(`Delete ${activeDeck.name}?`)) return;
    const remaining = decks.filter((deck) => deck.presetId !== activeDeck.presetId);
    updateDecks(remaining, remaining[0]?.presetId);
  };

  const saveNow = () => {
    const write = writeDeckBuilderStore({
      schemaVersion: "authentic-decks-v1",
      decks,
      activePresetId: activeDeck?.presetId,
    });
    setNotice(write.warning ?? "saved");
  };

  const playCurrentDeck = () => {
    if (!activeDeck) return;
    const currentStats = validateDeckPreset(activeDeck);
    if (!currentStats.playable) return;
    const write = writeDeckBuilderStore({
      schemaVersion: "authentic-decks-v1",
      decks,
      activePresetId: activeDeck.presetId,
    });
    setNotice(write.warning ?? "saved");
    onPlay(activeDeck);
  };

  const exportJson = () => {
    if (!activeDeck) return;
    const blob = new Blob([stringifyDeckExport(activeDeck)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${activeDeck.name.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "deck"}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const copyJson = async () => {
    if (!activeDeck || !navigator.clipboard) return;
    await navigator.clipboard.writeText(stringifyDeckExport(activeDeck));
    setNotice("copied");
  };

  const importDeck = () => {
    const result = parseDeckImport(importText, decks.map((deck) => deck.presetId));
    if (!result.ok || !result.preset) {
      setImportErrors(result.errors);
      return;
    }
    updateDecks([...decks, result.preset], result.preset.presetId);
    setImportOpen(false);
    setImportText("");
    setImportErrors([]);
  };

  const readImportFile: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    const file = event.currentTarget.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImportText(String(reader.result ?? ""));
    reader.readAsText(file);
  };

  if (!activeDeck || !stats) {
    return null;
  }

  return (
    <main className="gwent-authentic gwent-authentic--deck-builder" data-testid="authentic-deck-builder">
      <div className="authentic-deck-builder">
        <header className="authentic-deck-builder__topbar">
          <div className="authentic-deck-builder__title">
            <button type="button" className="authentic-deck-builder__ghost" onClick={onExit}>
              ← back
            </button>
            <h1>Deck Builder</h1>
          </div>
          <div className="authentic-deck-builder__actions">
            <button type="button" onClick={createDeck}>+ New</button>
            <button type="button" onClick={() => setImportOpen(true)}>Import</button>
            <button type="button" onClick={exportJson}>Export .json</button>
            <button type="button" onClick={copyJson} disabled={!navigator.clipboard}>copy</button>
            <button type="button" onClick={saveNow}>Save</button>
            <button type="button" className="is-primary" disabled={!stats.playable} onClick={playCurrentDeck}>
              Play →
            </button>
          </div>
        </header>

        <div className="authentic-deck-builder__body">
          <aside className="authentic-deck-builder__deck-list" data-testid="authentic-deck-builder-deck-list">
            <div className="authentic-deck-builder__label">your decks · {decks.length}</div>
            {decks.map((deck) => {
              const deckStats = validateDeckPreset(deck);
              return (
                <button
                  key={deck.presetId}
                  type="button"
                  className={`authentic-deck-builder__deck-tile${deck.presetId === activeDeck.presetId ? " is-selected" : ""}`}
                  onClick={() => updateDecks(decks, deck.presetId)}
                >
                  <strong>{deck.name || "Unnamed deck"}</strong>
                  <span>{getFactionDisplay(deck.faction).name} · {deckTotal(deck)} cards</span>
                  <em>{deckStats.playable ? "ready" : "needs work"}</em>
                </button>
              );
            })}
            <button type="button" className="authentic-deck-builder__delete" disabled={decks.length <= 1} onClick={deleteDeck}>
              delete current
            </button>
          </aside>

          <section className="authentic-deck-builder__pool" data-testid="authentic-deck-builder-card-pool">
            <div className="authentic-deck-builder__pool-header">
              <label>
                <span className="authentic-deck-builder__label">deck name</span>
                <input
                  value={activeDeck.name}
                  onChange={(event) => updateActiveDeck({ ...activeDeck, name: event.target.value })}
                  aria-label="Deck name"
                />
              </label>
              <p>
                {getFactionDisplay(activeDeck.faction).name} · leader {leader?.name ?? "missing"} · {activeDeck.presetId}
              </p>
              <div className="authentic-deck-builder__filters">
                {(["all", "heroes", "units", "specials"] as const).map((nextFilter) => (
                  <button
                    key={nextFilter}
                    type="button"
                    className={filter === nextFilter ? "is-selected" : ""}
                    onClick={() => setFilter(nextFilter)}
                  >
                    {nextFilter}
                  </button>
                ))}
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="search cards or ids"
                  aria-label="Search cards"
                />
              </div>
            </div>

            <div className="authentic-deck-builder__pool-grid">
              {pool.map(({ card, count, atLimit }) => (
                <div key={card.sourceId} className="authentic-deck-builder__pool-item" title={`${card.sourceId} · ${card.image}`}>
                  <AuthenticCard card={fromCatalogCard(card)} size="md" dimmed={atLimit} onClick={atLimit ? undefined : () => addCard(card.sourceId)} />
                  {count > 0 ? <span className="authentic-deck-builder__count">{count}/{card.deckLimit}</span> : null}
                  <button type="button" disabled={atLimit} onClick={() => addCard(card.sourceId)}>
                    {card.name}
                  </button>
                </div>
              ))}
            </div>
          </section>

          <aside className="authentic-deck-builder__stats" data-testid="authentic-deck-builder-stats">
            <section>
              <div className="authentic-deck-builder__label">composition</div>
              <dl>
                <dt>Battlefield</dt><dd className={stats.battlefieldCards < 22 ? "is-bad" : ""}>{stats.battlefieldCards} / 22 min</dd>
                <dt>Specials</dt><dd className={stats.specialCards > 10 ? "is-bad" : ""}>{stats.specialCards} / 10 max</dd>
                <dt>Heroes</dt><dd>{stats.heroCards}</dd>
                <dt>Total strength</dt><dd>{stats.totalStrength}</dd>
                <dt>Total cards</dt><dd data-testid="authentic-deck-builder-total">{stats.totalCards}</dd>
              </dl>
              {notice ? <p className="authentic-deck-builder__notice">{notice}</p> : null}
              <ul className="authentic-deck-builder__issues">
                {stats.issues.length === 0 ? <li>Ready for play.</li> : null}
                {stats.issues.map((issue, index) => (
                  <li key={`${issue.code}-${issue.sourceId ?? index}`} className={`is-${issue.severity}`}>
                    {issue.severity}: {issue.message}
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <div className="authentic-deck-builder__label">leader</div>
              <select
                value={activeDeck.leaderSourceId}
                onChange={(event) => updateActiveDeck({ ...activeDeck, leaderSourceId: event.target.value })}
                data-testid="authentic-deck-builder-leader"
              >
                {leaderOptions.map((option) => (
                  <option key={option.sourceId} value={option.sourceId}>
                    {option.name}
                  </option>
                ))}
              </select>
              <p>{leader?.description ?? leaderAbility?.description ?? "Choose a leader for this faction."}</p>
              {leaderAbility && leaderAbility.status !== "implemented" ? (
                <p className="authentic-deck-builder__notice">{leaderAbility.name} is {leaderAbility.status}.</p>
              ) : null}
            </section>

            {selectedCard ? (
              <section>
                <div className="authentic-deck-builder__label">selected card</div>
                <p><strong>{selectedCard.name}</strong></p>
                <p>{selectedCard.sourceId}</p>
                <p>{selectedCard.image}</p>
                {selectedAbilityDisplay ? (
                  <p>{selectedAbilityDisplay.name} · {selectedAbilityDisplay.status}</p>
                ) : null}
              </section>
            ) : null}

            <section>
              <div className="authentic-deck-builder__label">cards in deck</div>
              <div className="authentic-deck-builder__deck-cards">
                {deckItems.length === 0 ? <p>(empty)</p> : null}
                {deckItems.map(({ card, count }) => (
                  <div key={card.sourceId} className="authentic-deck-builder__deck-card">
                    <span>{card.kind === "special" ? "·" : card.strength}</span>
                    <strong>{card.name}</strong>
                    <em>x{count}</em>
                    <button type="button" onClick={() => removeCard(card.sourceId)} aria-label={`Remove ${card.name}`}>
                      -
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </div>

      {importOpen ? (
        <div className="authentic-deck-builder__modal" role="dialog" aria-modal="true">
          <div className="authentic-deck-builder__modal-box">
            <h2>Import Deck JSON</h2>
            <textarea value={importText} onChange={(event) => setImportText(event.target.value)} />
            <input ref={fileInputRef} type="file" accept="application/json,.json" hidden onChange={readImportFile} />
            {importErrors.map((error) => <p key={error} className="authentic-deck-builder__error">{error}</p>)}
            <div>
              <button type="button" onClick={() => fileInputRef.current?.click()}>upload file...</button>
              <button type="button" onClick={() => setImportOpen(false)}>cancel</button>
              <button type="button" className="is-primary" onClick={importDeck}>import</button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
};

export default AuthenticDeckBuilderScreen;
