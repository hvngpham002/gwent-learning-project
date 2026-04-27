import React, { useMemo, useRef, useState } from "react";

import { currentCatalogCards, currentCatalogLeaders, currentDeckPresets } from "@/data/catalog";
import type { CatalogDeckPreset, CatalogLeaderSource } from "@/game/catalog";

import AuthenticCard from "./AuthenticCard";
import AuthenticLeaderCard from "./AuthenticLeaderCard";
import { Alert, Toast } from "./alert";
import {
  addCardToDeck,
  buildCardPool,
  buildDeckCardItems,
  buildFactionOptions,
  changeDeckFaction,
  createEmptyDeckPreset,
  duplicateDeckPreset,
  findCatalogSourceForLocalDeck,
  filterCardPool,
  leadersForFaction,
  makeUniqueDeckName,
  removeCardFromDeck,
  resetDeckToCatalogSource,
  validateDeckPreset,
} from "./deckBuilderViewModel";
import { parseDeckImport, stringifyDeckExport } from "./deckBuilderImportExport";
import { writeDeckBuilderStore } from "./deckBuilderStorage";
import type { DeckBuilderFilter } from "./deckBuilderTypes";
import { fromCatalogCard } from "./cardViewModel";
import { getAbilityDisplay, getFactionDisplay, getLeaderAbilityDisplay } from "./displayMetadata";
import Listbox from "./Listbox";
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

interface PendingConfirmation {
  readonly title: string;
  readonly body: string;
  readonly confirmLabel: string;
  readonly destructive?: boolean;
  readonly onConfirm: () => void;
}

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
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [pendingConfirmation, setPendingConfirmation] = useState<PendingConfirmation | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const stats = useMemo(() => (activeDeck ? validateDeckPreset(activeDeck) : null), [activeDeck]);
  const pool = useMemo(() => (activeDeck ? filterCardPool(buildCardPool(activeDeck), filter, search) : []), [activeDeck, filter, search]);
  const deckItems = useMemo(() => (activeDeck ? buildDeckCardItems(activeDeck) : []), [activeDeck]);
  const factionOptions = useMemo(() => buildFactionOptions(), []);
  const catalogSource = useMemo(() => (activeDeck ? findCatalogSourceForLocalDeck(activeDeck) : null), [activeDeck]);
  const selectedCard =
    currentCatalogCards.find((card) => card.sourceId === selectedSourceId) ?? deckItems[0]?.card ?? pool[0]?.card ?? null;
  const leaderOptions = activeDeck ? leadersForFaction(activeDeck.faction) : [];
  const leader: CatalogLeaderSource | null =
    currentCatalogLeaders.find((candidate) => candidate.sourceId === activeDeck?.leaderSourceId) ?? null;
  const leaderAbility = leader ? getLeaderAbilityDisplay(leader.ability) : null;
  const selectedAbility = selectedCard?.abilities.find((ability) => ability !== "none");
  const selectedAbilityDisplay = selectedAbility ? getAbilityDisplay(selectedAbility) : null;
  const hasErrorIssues = stats?.issues.some((issue) => issue.severity === "error") ?? false;
  const hasWarningIssues = stats?.issues.some((issue) => issue.severity === "warning") ?? false;

  const showNotice = (message: string) => {
    setNotice(message);
    setToastMessage(message);
  };

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
    const deck = createEmptyDeckPreset(newLocalId(), makeUniqueDeckName("New Deck", decks));
    updateDecks([...decks, deck], deck.presetId);
    setSelectedSourceId(null);
    setNotice("Choose a faction, then add cards.");
  };

  const duplicateDeck = () => {
    if (!activeDeck) return;
    const duplicate = duplicateDeckPreset(activeDeck, decks);
    updateDecks([...decks, duplicate], duplicate.presetId);
    setSelectedSourceId(duplicate.mainDeck[0]?.sourceId ?? null);
    setNotice(`Duplicated as ${duplicate.name}.`);
  };

  const resetToCatalog = () => {
    if (!activeDeck || !catalogSource) return;
    setPendingConfirmation({
      title: `Reset ${activeDeck.name}?`,
      body: `Restore this local deck from ${catalogSource.name}. Current edits will be replaced.`,
      confirmLabel: "reset",
      destructive: true,
      onConfirm: () => {
        const reset = resetDeckToCatalogSource(activeDeck, catalogSource);
        updateActiveDeck(reset);
        setSelectedSourceId(reset.mainDeck[0]?.sourceId ?? null);
        showNotice(`Reset to ${catalogSource.name}.`);
      },
    });
  };

  const updateFaction = (nextFaction: CatalogDeckPreset["faction"]) => {
    if (!activeDeck || nextFaction === activeDeck.faction) return;
    const result = changeDeckFaction(activeDeck, nextFaction);
    const applyFactionChange = () => {
      updateActiveDeck(result.deck);
      setSelectedSourceId(result.deck.mainDeck[0]?.sourceId ?? null);
      showNotice(`Faction changed to ${getFactionDisplay(nextFaction).name}; removed ${result.removedCards} wrong-faction cards.`);
    };
    if (result.removedCards > 0) {
      setPendingConfirmation({
        title: `Change faction to ${getFactionDisplay(nextFaction).name}?`,
        body: `This removes ${result.removedCards} wrong-faction cards from the current deck.`,
        confirmLabel: "change faction",
        destructive: true,
        onConfirm: applyFactionChange,
      });
      return;
    }
    applyFactionChange();
  };

  const deleteDeck = () => {
    if (!activeDeck || decks.length <= 1) return;
    setPendingConfirmation({
      title: `Delete ${activeDeck.name}?`,
      body: "This removes the browser-local deck. Catalog presets remain available.",
      confirmLabel: "delete current",
      destructive: true,
      onConfirm: () => {
        const remaining = decks.filter((deck) => deck.presetId !== activeDeck.presetId);
        updateDecks(remaining, remaining[0]?.presetId);
      },
    });
  };

  const saveNow = () => {
    const write = writeDeckBuilderStore({
      schemaVersion: "authentic-decks-v1",
      decks,
      activePresetId: activeDeck?.presetId,
    });
    showNotice(write.warning ?? "saved");
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
    showNotice(write.warning ?? "saved");
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
    showNotice("copied");
  };

  const importDeck = () => {
    const result = parseDeckImport(importText, [
      ...decks.map((deck) => deck.presetId),
      ...currentDeckPresets.map((deck) => deck.presetId),
    ]);
    if (!result.ok || !result.preset) {
      setImportErrors(result.errors);
      return;
    }
    const preset = { ...result.preset, name: makeUniqueDeckName(result.preset.name, decks) };
    updateDecks([...decks, preset], preset.presetId);
    showNotice(result.notices?.length ? `Imported as ${preset.name}. ${result.notices.join(" ")}` : `Imported as ${preset.name}.`);
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
            <button type="button" onClick={createDeck}>+ new</button>
            <button type="button" onClick={duplicateDeck}>duplicate</button>
            <button
              type="button"
              onClick={resetToCatalog}
              disabled={!catalogSource}
              title={catalogSource ? `Reset to ${catalogSource.name}` : "No catalog source"}
            >
              reset
            </button>
            <button type="button" onClick={() => setImportOpen(true)}>import</button>
            <button type="button" onClick={exportJson}>export</button>
            <button type="button" onClick={copyJson} disabled={!navigator.clipboard}>copy</button>
            <button type="button" onClick={saveNow}>save</button>
            <button type="button" className="is-primary" disabled={!stats.playable} onClick={playCurrentDeck}>
              play →
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
              {activeDeck.mainDeck.length === 0 ? (
                <p className="authentic-deck-builder__notice">Choose a faction, then add cards.</p>
              ) : null}
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
              {pool.map(({ card, count, limit, addState }) => (
                <div
                  key={card.sourceId}
                  className="authentic-deck-builder__pool-item"
                  data-source-id={card.sourceId}
                  title={`${card.sourceId} · ${card.image}${addState.reason ? ` · ${addState.reason}` : ""}`}
                >
                  <AuthenticCard card={fromCatalogCard(card)} size="md" dimmed={!addState.canAdd} onClick={addState.canAdd ? () => addCard(card.sourceId) : undefined} />
                  {count > 0 ? <span className="authentic-deck-builder__count">{count}/{limit}</span> : null}
                </div>
              ))}
            </div>
          </section>

          <aside className="authentic-deck-builder__stats" data-testid="authentic-deck-builder-stats">
            <section className="authentic-deck-builder__leader-section">
              {leader ? (
                <div className="authentic-deck-builder__leader-preview">
                  <AuthenticLeaderCard
                    leader={{
                      sourceId: leader.sourceId,
                      name: leader.name,
                      faction: leader.faction,
                      abilityName: leaderAbility?.name ?? leader.ability,
                      image: leader.image,
                    }}
                    size="large"
                  />
                </div>
              ) : null}
              <div className="authentic-deck-builder__leader-controls">
                <Listbox
                  label="faction"
                  value={activeDeck.faction}
                  onChange={(value) => updateFaction(value as CatalogDeckPreset["faction"])}
                  testId="authentic-deck-builder-faction"
                  options={factionOptions.map((option) => ({
                    value: option.faction,
                    label: option.name,
                    meta: option.available ? `${option.cardCount} cards` : "unavailable",
                    disabled: !option.available,
                  }))}
                />
                <Listbox
                  label="leader"
                  value={activeDeck.leaderSourceId}
                  onChange={(value) => updateActiveDeck({ ...activeDeck, leaderSourceId: value })}
                  options={leaderOptions.map((option) => ({ value: option.sourceId, label: option.name }))}
                  testId="authentic-deck-builder-leader"
                />
              </div>
              <p>{leader?.description ?? leaderAbility?.description ?? "Choose a leader for this faction."}</p>
              {leaderAbility && leaderAbility.status !== "implemented" ? (
                <p className="authentic-deck-builder__notice">{leaderAbility.name} is {leaderAbility.status}.</p>
              ) : null}
            </section>

            <section>
              <div className="authentic-deck-builder__label">composition</div>
              <dl>
                <dt>Battlefield</dt><dd className={stats.battlefieldCards < 22 ? "is-bad" : ""}>{stats.battlefieldCards} / 22 min</dd>
                <dt>Specials</dt><dd data-testid="authentic-deck-builder-specials" className={stats.specialCards > 10 ? "is-bad" : ""}>{stats.specialCards} / 10 max</dd>
                <dt>Heroes</dt><dd>{stats.heroCards}</dd>
                <dt>Total strength</dt><dd>{stats.totalStrength}</dd>
                <dt>Total cards</dt><dd data-testid="authentic-deck-builder-total">{stats.totalCards}</dd>
              </dl>
              {notice ? (
                <Alert
                  severity="success"
                  variant="ledger"
                  className="authentic-alert--compact"
                  eyebrow="deck builder"
                  title={notice}
                  testId="authentic-deck-builder-notice"
                />
              ) : null}
              <Alert
                severity={hasErrorIssues ? "error" : hasWarningIssues ? "warn" : "success"}
                variant="ledger"
                className="authentic-alert--compact"
                eyebrow="composition"
                title={stats.issues.length === 0 ? "Ready for play." : "Deck needs attention."}
                body={
                  stats.issues.length > 0 ? (
                    <ul className="authentic-deck-builder__issues">
                      {stats.issues.map((issue, index) => (
                        <li key={`${issue.code}-${issue.sourceId ?? index}`} className={`is-${issue.severity}`}>
                          {issue.severity}: {issue.message}
                        </li>
                      ))}
                    </ul>
                  ) : null
                }
                testId="authentic-deck-builder-issues"
              />
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
            {importErrors.length > 0 ? (
              <Alert
                severity="error"
                variant="ledger"
                className="authentic-alert--compact"
                eyebrow="import failed"
                title="Deck JSON cannot be imported."
                body={
                  <ul>
                    {importErrors.map((error) => (
                      <li key={error}>{error}</li>
                    ))}
                  </ul>
                }
                testId="authentic-deck-builder-import-errors"
              />
            ) : null}
            <div>
              <button type="button" onClick={() => fileInputRef.current?.click()}>upload file...</button>
              <button type="button" onClick={() => setImportOpen(false)}>cancel</button>
              <button type="button" className="is-primary" onClick={importDeck}>import</button>
            </div>
          </div>
        </div>
      ) : null}
      {pendingConfirmation ? (
        <div className="authentic-deck-builder__modal" role="dialog" aria-modal="true">
          <Alert
            severity="confirm"
            variant="ledger"
            eyebrow="confirm"
            title={pendingConfirmation.title}
            body={<p>{pendingConfirmation.body}</p>}
            actions={[
              { label: "cancel", onClick: () => setPendingConfirmation(null), kind: "ghost" },
              {
                label: pendingConfirmation.confirmLabel,
                onClick: () => {
                  pendingConfirmation.onConfirm();
                  setPendingConfirmation(null);
                },
                kind: pendingConfirmation.destructive ? "destructive" : "primary",
                testId: "authentic-deck-builder-confirm-action",
              },
            ]}
            testId="authentic-deck-builder-confirmation"
          />
        </div>
      ) : null}
      <Toast open={Boolean(toastMessage)} message={toastMessage ?? ""} onDismiss={() => setToastMessage(null)} />
    </main>
  );
};

export default AuthenticDeckBuilderScreen;
