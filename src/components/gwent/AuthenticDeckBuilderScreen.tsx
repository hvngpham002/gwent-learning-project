import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { currentCatalogCards, currentCatalogLeaders, currentDeckPresets } from "@/data/catalog";
import type { CatalogDeckPreset, CatalogLeaderSource } from "@/game/catalog";

import AuthenticCard from "./AuthenticCard";
import AuthenticLeaderCard from "./AuthenticLeaderCard";
import { Alert, Toast } from "./alert";
import {
  addCardToDeck,
  buildCardPool,
  buildDeckBuilderCardActions,
  buildDeckBuilderCardInspection,
  buildDeckCardItems,
  buildFactionOptions,
  buildGeneratedCardItems,
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
import type {
  DeckBuilderCardActionOrigin,
  DeckBuilderFilter,
} from "./deckBuilderTypes";
import type { CardStudioBlockedSources, CardStudioSourceSets } from "./cardStudioTypes";
import { fromCatalogCard } from "./cardViewModel";
import {
  getAbilityDisplay,
  getCardKindDisplay,
  getFactionDisplay,
  getLeaderAbilityDisplay,
  getRowDisplay,
} from "./displayMetadata";
import Listbox from "./Listbox";
import "./authentic-deck-builder.css";

interface AuthenticDeckBuilderScreenProps {
  readonly decks: readonly CatalogDeckPreset[];
  readonly activePresetId?: string;
  readonly storageWarning?: string | null;
  readonly sourceSets?: CardStudioSourceSets;
  readonly blockedSources?: CardStudioBlockedSources;
  readonly onDecksChange: (decks: readonly CatalogDeckPreset[], activePresetId?: string) => void;
  readonly onExit: () => void;
  readonly onPlay: (deck: CatalogDeckPreset) => void;
  readonly onOpenCardStudio?: () => void;
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

interface CardContextMenuState {
  readonly sourceId: string;
  readonly origin: DeckBuilderCardActionOrigin;
  readonly x: number;
  readonly y: number;
}

const CONTEXT_MENU_WIDTH = 200;
const CONTEXT_MENU_HEIGHT = 132;

const clampMenuPosition = (x: number, y: number) => {
  if (typeof window === "undefined") return { x, y };
  const maxX = Math.max(8, window.innerWidth - CONTEXT_MENU_WIDTH - 8);
  const maxY = Math.max(8, window.innerHeight - CONTEXT_MENU_HEIGHT - 8);
  return {
    x: Math.min(Math.max(8, x), maxX),
    y: Math.min(Math.max(8, y), maxY),
  };
};

const AuthenticDeckBuilderScreen: React.FC<AuthenticDeckBuilderScreenProps> = ({
  decks,
  activePresetId,
  storageWarning,
  sourceSets = { cards: currentCatalogCards, leaders: currentCatalogLeaders },
  blockedSources = { cards: new Map(), leaders: new Map() },
  onDecksChange,
  onExit,
  onPlay,
  onOpenCardStudio,
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
  const [contextMenu, setContextMenu] = useState<CardContextMenuState | null>(null);
  const [inspectTarget, setInspectTarget] = useState<{ readonly sourceId: string; readonly origin: DeckBuilderCardActionOrigin } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const stats = useMemo(
    () => (activeDeck ? validateDeckPreset(activeDeck, sourceSets.cards, sourceSets.leaders, blockedSources) : null),
    [activeDeck, blockedSources, sourceSets.cards, sourceSets.leaders],
  );
  const pool = useMemo(
    () => (activeDeck ? filterCardPool(buildCardPool(activeDeck, sourceSets.cards, blockedSources.cards), filter, search) : []),
    [activeDeck, blockedSources.cards, filter, search, sourceSets.cards],
  );
  const deckItems = useMemo(() => (activeDeck ? buildDeckCardItems(activeDeck, sourceSets.cards) : []), [activeDeck, sourceSets.cards]);
  const generatedItems = useMemo(
    () => (activeDeck ? buildGeneratedCardItems(activeDeck, sourceSets.cards) : []),
    [activeDeck, sourceSets.cards],
  );
  const factionOptions = useMemo(() => buildFactionOptions(sourceSets.cards, sourceSets.leaders), [sourceSets.cards, sourceSets.leaders]);
  const catalogSource = useMemo(() => (activeDeck ? findCatalogSourceForLocalDeck(activeDeck) : null), [activeDeck]);
  const selectedCard =
    sourceSets.cards.find((card) => card.sourceId === selectedSourceId) ?? deckItems[0]?.card ?? pool[0]?.card ?? null;
  const leaderOptions = activeDeck ? leadersForFaction(activeDeck.faction, sourceSets.leaders) : [];
  const leader: CatalogLeaderSource | null =
    sourceSets.leaders.find((candidate) => candidate.sourceId === activeDeck?.leaderSourceId) ?? null;
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
    updateActiveDeck(addCardToDeck(activeDeck, sourceId, sourceSets.cards, blockedSources.cards));
  };

  const removeCard = (sourceId: string) => {
    if (!activeDeck) return;
    setSelectedSourceId(sourceId);
    updateActiveDeck(removeCardFromDeck(activeDeck, sourceId, sourceSets.cards));
  };

  const closeCardContextMenu = useCallback(() => setContextMenu(null), []);

  const openCardContextMenu = useCallback(
    (event: React.MouseEvent, sourceId: string, origin: DeckBuilderCardActionOrigin) => {
      event.preventDefault();
      event.stopPropagation();
      const { x, y } = clampMenuPosition(event.clientX, event.clientY);
      setContextMenu({ sourceId, origin, x, y });
    },
    [],
  );

  const inspectCard = useCallback((sourceId: string, origin: DeckBuilderCardActionOrigin) => {
    setInspectTarget({ sourceId, origin });
    setContextMenu(null);
  }, []);

  const closeInspect = useCallback(() => setInspectTarget(null), []);

  useEffect(() => {
    if (!contextMenu && !inspectTarget) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (inspectTarget) {
        setInspectTarget(null);
      } else {
        setContextMenu(null);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [contextMenu, inspectTarget]);

  const createDeck = () => {
    const deck = createEmptyDeckPreset(newLocalId(), makeUniqueDeckName("New Deck", decks), "northern_realms", sourceSets.leaders);
    updateDecks([...decks, deck], deck.presetId);
    setSelectedSourceId(null);
    setNotice("Choose a faction, then add cards.");
  };

  const duplicateDeck = () => {
    if (!activeDeck) return;
    const duplicate = duplicateDeckPreset(activeDeck, decks, sourceSets.cards);
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
    const result = changeDeckFaction(activeDeck, nextFaction, sourceSets.cards, sourceSets.leaders);
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
    const currentStats = validateDeckPreset(activeDeck, sourceSets.cards, sourceSets.leaders, blockedSources);
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
    const result = parseDeckImport(
      importText,
      [
        ...decks.map((deck) => deck.presetId),
        ...currentDeckPresets.map((deck) => deck.presetId),
      ],
      sourceSets,
      blockedSources,
    );
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
            <button type="button" className="authentic-button authentic-button--ghost authentic-deck-builder__ghost" onClick={onExit}>
              ← back
            </button>
            <h1>Deck Builder</h1>
          </div>
          <div className="authentic-deck-builder__actions">
            <button type="button" className="authentic-button authentic-button--secondary" onClick={createDeck}>+ new</button>
            <button type="button" className="authentic-button authentic-button--secondary" onClick={duplicateDeck}>duplicate</button>
            <button
              type="button"
              className="authentic-button authentic-button--secondary"
              onClick={resetToCatalog}
              disabled={!catalogSource}
              title={catalogSource ? `Reset to ${catalogSource.name}` : "No catalog source"}
            >
              reset
            </button>
            <button type="button" className="authentic-button authentic-button--secondary" onClick={() => setImportOpen(true)}>import</button>
            <button type="button" className="authentic-button authentic-button--secondary" onClick={exportJson}>export</button>
            <button type="button" className="authentic-button authentic-button--secondary" onClick={copyJson} disabled={!navigator.clipboard}>copy</button>
            {onOpenCardStudio ? (
              <button type="button" className="authentic-button authentic-button--secondary" onClick={onOpenCardStudio}>card studio →</button>
            ) : null}
            <button type="button" className="authentic-button authentic-button--secondary" onClick={saveNow}>save</button>
            <button type="button" className="authentic-button authentic-button--primary is-primary" disabled={!stats.playable} onClick={playCurrentDeck}>
              play →
            </button>
          </div>
        </header>

        <div className="authentic-deck-builder__body">
          <aside className="authentic-deck-builder__deck-list" data-testid="authentic-deck-builder-deck-list">
            <div className="authentic-deck-builder__label">your decks · {decks.length}</div>
            {decks.map((deck) => {
              const deckStats = validateDeckPreset(deck, sourceSets.cards, sourceSets.leaders, blockedSources);
              return (
                <button
                  key={deck.presetId}
                  type="button"
                  className={`authentic-button authentic-button--tile authentic-deck-builder__deck-tile${deck.presetId === activeDeck.presetId ? " is-selected" : ""}`}
                  onClick={() => updateDecks(decks, deck.presetId)}
                >
                  <strong>{deck.name || "Unnamed deck"}</strong>
                  <span>{getFactionDisplay(deck.faction).name} · {deckTotal(deck)} cards</span>
                  <em>{deckStats.playable ? "ready" : "needs work"}</em>
                </button>
              );
            })}
            <button
              type="button"
              className="authentic-button authentic-button--destructive authentic-deck-builder__delete"
              disabled={decks.length <= 1}
              onClick={deleteDeck}
            >
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
                    className={`authentic-button authentic-button--choice authentic-button--compact${filter === nextFilter ? " is-selected" : ""}`}
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
                  onContextMenu={(event) => openCardContextMenu(event, card.sourceId, "pool")}
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
                  <div
                    key={card.sourceId}
                    className="authentic-deck-builder__deck-card"
                    data-source-id={card.sourceId}
                    onContextMenu={(event) => openCardContextMenu(event, card.sourceId, "deck")}
                  >
                    <span>{card.kind === "special" ? "·" : card.strength}</span>
                    <strong>{card.name}</strong>
                    <em>x{count}</em>
                    <button
                      type="button"
                      className="authentic-button authentic-button--icon authentic-button--ghost"
                      onClick={() => removeCard(card.sourceId)}
                      aria-label={`Remove ${card.name}`}
                    >
                      -
                    </button>
                  </div>
                ))}
              </div>
            </section>

            {generatedItems.length > 0 ? (
              <section data-testid="authentic-deck-builder-generated">
                <div className="authentic-deck-builder__label">generated cards</div>
                <p className="authentic-deck-builder__generated-help">
                  Automatically created by cards in your deck. Not manually added.
                </p>
                <div className="authentic-deck-builder__generated-grid">
                  {generatedItems.map(({ card, count, generatedBy }) => {
                    const generatorText = generatedBy.length > 0
                      ? `generated by ${generatedBy.map((source) => source.name).join(", ")}`
                      : "generated card";
                    return (
                      <div
                        key={card.sourceId}
                        className="authentic-deck-builder__generated-item"
                        data-source-id={card.sourceId}
                        data-testid="authentic-deck-builder-generated-item"
                        title={`${card.sourceId} · ${generatorText}`}
                        onContextMenu={(event) => openCardContextMenu(event, card.sourceId, "generated")}
                      >
                        <AuthenticCard
                          card={fromCatalogCard(card)}
                          size="sm"
                          onClick={() => inspectCard(card.sourceId, "generated")}
                        />
                        <div className="authentic-deck-builder__generated-meta">
                          <strong>{card.name}</strong>
                          <em>x{count}</em>
                          <span>{generatorText}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ) : null}
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
              <button type="button" className="authentic-button authentic-button--secondary" onClick={() => fileInputRef.current?.click()}>upload file...</button>
              <button type="button" className="authentic-button authentic-button--ghost" onClick={() => setImportOpen(false)}>cancel</button>
              <button type="button" className="authentic-button authentic-button--primary is-primary" onClick={importDeck}>import</button>
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
      {contextMenu ? (() => {
        const card = sourceSets.cards.find((entry) => entry.sourceId === contextMenu.sourceId);
        if (!card) return null;
        const actions = buildDeckBuilderCardActions({
          deck: activeDeck,
          card,
          cards: sourceSets.cards,
          blockedSources: blockedSources.cards,
          origin: contextMenu.origin,
        });
        return (
          <>
            <div
              className="authentic-deck-builder__context-overlay"
              onClick={closeCardContextMenu}
              onContextMenu={(event) => {
                event.preventDefault();
                closeCardContextMenu();
              }}
            />
            <div
              className="authentic-deck-builder__context-menu"
              role="menu"
              aria-label={`Actions for ${card.name}`}
              data-testid="authentic-deck-builder-context-menu"
              style={{ left: contextMenu.x, top: contextMenu.y, width: CONTEXT_MENU_WIDTH }}
            >
              <div className="authentic-deck-builder__context-title">{card.name}</div>
              <button
                type="button"
                role="menuitem"
                className="authentic-button authentic-button--ghost authentic-deck-builder__context-action"
                disabled={!actions.add.enabled}
                title={actions.add.reason}
                data-testid="authentic-deck-builder-context-add"
                onClick={() => {
                  if (!actions.add.enabled) return;
                  addCard(card.sourceId);
                  closeCardContextMenu();
                }}
              >
                add{actions.add.enabled ? "" : ` · ${actions.add.reason ?? "disabled"}`}
              </button>
              <button
                type="button"
                role="menuitem"
                className="authentic-button authentic-button--ghost authentic-deck-builder__context-action"
                disabled={!actions.remove.enabled}
                title={actions.remove.reason}
                data-testid="authentic-deck-builder-context-remove"
                onClick={() => {
                  if (!actions.remove.enabled) return;
                  removeCard(card.sourceId);
                  closeCardContextMenu();
                }}
              >
                remove{actions.remove.enabled ? "" : ` · ${actions.remove.reason ?? "disabled"}`}
              </button>
              <button
                type="button"
                role="menuitem"
                className="authentic-button authentic-button--ghost authentic-deck-builder__context-action"
                data-testid="authentic-deck-builder-context-inspect"
                onClick={() => inspectCard(card.sourceId, contextMenu.origin)}
              >
                inspect
              </button>
            </div>
          </>
        );
      })() : null}
      {inspectTarget ? (() => {
        const card = sourceSets.cards.find((entry) => entry.sourceId === inspectTarget.sourceId);
        if (!card) return null;
        const inspection = buildDeckBuilderCardInspection({
          deck: activeDeck,
          card,
          cards: sourceSets.cards,
          blockedSources: blockedSources.cards,
          origin: inspectTarget.origin,
        });
        const cardAbilities = card.abilities
          .filter((id) => id !== "none")
          .map((id) => getAbilityDisplay(id));
        const rowDisplays = card.rows.map((row) => getRowDisplay(row));
        const factionDisplay = getFactionDisplay(card.faction);
        const kindDisplay = getCardKindDisplay(card.kind);
        const showStrength = card.kind !== "special";
        const limitLabel = card.kind === "hero" ? 1 : inspection.limit;
        return (
          <div
            className="authentic-deck-builder__modal authentic-deck-builder__modal--inspect"
            role="dialog"
            aria-modal="true"
            aria-labelledby="authentic-deck-builder-inspect-title"
            onClick={(event) => {
              if (event.target === event.currentTarget) {
                closeInspect();
              }
            }}
          >
            <div
              className="authentic-deck-builder__inspect-box"
              data-testid="authentic-deck-builder-inspect"
            >
              <div className="authentic-deck-builder__inspect-header">
                <h2 id="authentic-deck-builder-inspect-title">{card.name}</h2>
                <button
                  type="button"
                  className="authentic-button authentic-button--ghost"
                  onClick={closeInspect}
                  aria-label="Close"
                  data-testid="authentic-deck-builder-inspect-close"
                >
                  close
                </button>
              </div>
              <div className="authentic-deck-builder__inspect-body">
                <div className="authentic-deck-builder__inspect-art">
                  <AuthenticCard card={fromCatalogCard(card)} size="lg" />
                </div>
                <dl className="authentic-deck-builder__inspect-facts">
                  <dt>Source ID</dt><dd data-testid="authentic-deck-builder-inspect-source-id">{card.sourceId}</dd>
                  <dt>Faction</dt><dd>{factionDisplay.name}</dd>
                  <dt>Kind</dt><dd>{kindDisplay.name}</dd>
                  {showStrength ? (<><dt>Strength</dt><dd>{card.strength}</dd></>) : null}
                  <dt>Rows</dt><dd>{rowDisplays.length === 0 ? "—" : rowDisplays.map((row) => row.name).join(", ")}</dd>
                  <dt>Deck limit</dt><dd>{limitLabel}</dd>
                  <dt>Image path</dt><dd>{card.image}</dd>
                  {card.tags.length > 0 ? (<><dt>Tags</dt><dd>{card.tags.join(", ")}</dd></>) : null}
                </dl>
                <section className="authentic-deck-builder__inspect-section">
                  <div className="authentic-deck-builder__label">Abilities</div>
                  {cardAbilities.length === 0 ? (
                    <p>None.</p>
                  ) : (
                    <ul className="authentic-deck-builder__inspect-abilities">
                      {cardAbilities.map((ability) => (
                        <li key={ability.id}>
                          <strong>{ability.name}</strong>
                          {ability.glyph ? <span aria-hidden="true"> {ability.glyph}</span> : null}
                          <em> · {ability.status}</em>
                          {ability.description ? <p>{ability.description}</p> : null}
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
                {(inspection.linkedGenerated.length > 0 || inspection.generatedBy.length > 0) ? (
                  <section className="authentic-deck-builder__inspect-section">
                    <div className="authentic-deck-builder__label">Generated</div>
                    {inspection.linkedGenerated.length > 0 ? (
                      <p data-testid="authentic-deck-builder-inspect-linked">
                        Generates: {inspection.linkedGenerated.map((entry) => entry.name).join(", ")}
                      </p>
                    ) : null}
                    {inspection.generatedBy.length > 0 ? (
                      <p data-testid="authentic-deck-builder-inspect-generated-by">
                        Generated by: {inspection.generatedBy.map((entry) => entry.name).join(", ")}
                      </p>
                    ) : null}
                  </section>
                ) : null}
                <section className="authentic-deck-builder__inspect-section">
                  <div className="authentic-deck-builder__label">In Current Deck</div>
                  <p>
                    Main deck: {inspection.currentCount}
                    {inspection.currentGeneratedCount > 0 ? ` · generated: ${inspection.currentGeneratedCount}` : ""}
                  </p>
                </section>
              </div>
              <div className="authentic-deck-builder__inspect-actions">
                <button
                  type="button"
                  className="authentic-button authentic-button--secondary"
                  disabled={!inspection.actions.add.enabled}
                  title={inspection.actions.add.reason}
                  data-testid="authentic-deck-builder-inspect-add"
                  onClick={() => {
                    if (!inspection.actions.add.enabled) return;
                    addCard(card.sourceId);
                    closeInspect();
                  }}
                >
                  {inspection.actions.add.enabled ? "add" : `add · ${inspection.actions.add.reason ?? "disabled"}`}
                </button>
                <button
                  type="button"
                  className="authentic-button authentic-button--secondary"
                  disabled={!inspection.actions.remove.enabled}
                  title={inspection.actions.remove.reason}
                  data-testid="authentic-deck-builder-inspect-remove"
                  onClick={() => {
                    if (!inspection.actions.remove.enabled) return;
                    removeCard(card.sourceId);
                    closeInspect();
                  }}
                >
                  {inspection.actions.remove.enabled ? "remove" : `remove · ${inspection.actions.remove.reason ?? "disabled"}`}
                </button>
              </div>
            </div>
          </div>
        );
      })() : null}
      <Toast open={Boolean(toastMessage)} message={toastMessage ?? ""} onDismiss={() => setToastMessage(null)} />
    </main>
  );
};

export default AuthenticDeckBuilderScreen;
