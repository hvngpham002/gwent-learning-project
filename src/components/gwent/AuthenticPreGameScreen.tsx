import React, { useMemo, useState } from "react";

import type { CatalogDeckPreset } from "@/game/catalog";
import { currentCatalogCards, currentCatalogLeaders } from "@/data/catalog";

import { ENGINE_AI_POLICY_ID } from "../game/engine/engineShellViewModels";
import AuthenticLeaderCard from "./AuthenticLeaderCard";
import Listbox from "./Listbox";
import {
  buildPreGameDeckOptions,
  buildPreGameDeckOptionsWithLocal,
  buildPreGameFormatOptions,
  buildPreGameModeOptions,
  buildPreGameRoundOptions,
  buildSetupConfig,
  getDefaultPreGameSelection,
  getSuggestedOpponentPresetId,
  seedFromSearch,
  type AuthenticMatchSetupConfig,
} from "./preGameViewModel";
import type { CardStudioBlockedSources, CardStudioSourceSets } from "./cardStudioTypes";
import "./authentic-pregame.css";

interface AuthenticPreGameScreenProps {
  readonly search?: string;
  readonly localDecks?: readonly CatalogDeckPreset[];
  readonly sourceSets?: CardStudioSourceSets;
  readonly blockedSources?: CardStudioBlockedSources;
  readonly onBeginMatch: (config: AuthenticMatchSetupConfig) => void;
  readonly onOpenDeckBuilder?: (mode?: "create" | "edit") => void;
  readonly onOpenCardStudio?: () => void;
}

const AuthenticPreGameScreen: React.FC<AuthenticPreGameScreenProps> = ({
  search = window.location.search,
  localDecks = [],
  sourceSets = { cards: currentCatalogCards, leaders: currentCatalogLeaders },
  blockedSources = { cards: new Map(), leaders: new Map() },
  onBeginMatch,
  onOpenDeckBuilder,
  onOpenCardStudio,
}) => {
  const deckOptions = useMemo(
    () => buildPreGameDeckOptionsWithLocal(localDecks, sourceSets, blockedSources),
    [blockedSources, localDecks, sourceSets],
  );
  const opponentOptions = useMemo(() => buildPreGameDeckOptions(), []);
  const modeOptions = useMemo(() => buildPreGameModeOptions(), []);
  const roundOptions = useMemo(() => buildPreGameRoundOptions(), []);
  const formatOptions = useMemo(() => buildPreGameFormatOptions(), []);
  const defaults = useMemo(() => getDefaultPreGameSelection(), []);
  const [humanDeckOptionId, setHumanDeckOptionId] = useState(`catalog:${defaults.humanDeckPresetId}`);
  const [opponentDeckPresetId, setOpponentDeckPresetId] = useState(defaults.opponentDeckPresetId);
  const [roundId, setRoundId] = useState<"standard" | null>(defaults.roundId);
  const [formatId, setFormatId] = useState<"best-of-3" | null>(defaults.formatId);
  const [seed, setSeed] = useState(() => seedFromSearch(search));
  const [copyLabel, setCopyLabel] = useState("copy");

  const selectedDeck = deckOptions.find((option) => option.optionId === humanDeckOptionId) ?? deckOptions[0];
  const selectedOpponent = opponentOptions.find((option) => option.presetId === opponentDeckPresetId) ?? opponentOptions[1] ?? opponentOptions[0];
  const selectedRound = roundOptions.find((option) => option.id === roundId) ?? null;
  const selectedFormat = formatOptions.find((option) => option.id === formatId) ?? null;
  const canBegin = Boolean(selectedDeck?.ready && selectedOpponent?.ready && selectedRound?.available && selectedFormat?.available);
  const seedLabel = seed.trim().length > 0 ? seed.trim() : "generated on begin";

  const chooseHumanDeck = (optionId: string) => {
    const option = deckOptions.find((candidate) => candidate.optionId === optionId);
    if (!option) return;
    setHumanDeckOptionId(option.optionId);
    if (option.presetId === opponentDeckPresetId) {
      setOpponentDeckPresetId(getSuggestedOpponentPresetId(option.presetId, opponentOptions));
    }
  };

  const beginMatch = () => {
    if (!canBegin) {
      return;
    }
    if (!roundId || !formatId) {
      return;
    }
    if (!selectedDeck) {
      return;
    }
    const localDeck =
      selectedDeck.source === "local" ? localDecks.find((deck) => deck.presetId === selectedDeck.presetId) : undefined;
    const config = buildSetupConfig({
      humanDeckPresetId: selectedDeck.presetId,
      humanDeckPreset: localDeck,
      opponentDeckPresetId,
      roundId,
      formatId,
      seed,
      catalogCards: sourceSets.cards,
      catalogLeaders: sourceSets.leaders,
    });
    setSeed(String(config.seed));
    onBeginMatch(config);
  };

  const copySeed = async () => {
    if (!navigator.clipboard || seed.trim().length === 0) {
      return;
    }
    await navigator.clipboard.writeText(seed.trim());
    setCopyLabel("copied");
  };

  return (
    <main className="gwent-authentic gwent-authentic--pregame" data-testid="authentic-pregame">
      <div className="authentic-pregame">
        <header className="authentic-pregame__topbar">
          <div className="authentic-pregame__topbar-title">
            <button
              type="button"
              className="authentic-button authentic-button--ghost authentic-pregame__ghost"
              onClick={() => window.history.back()}
              aria-label="back"
            >
              ← menu
            </button>
            <h1>Prepare for Battle</h1>
          </div>
          <button
            type="button"
            className="authentic-button authentic-button--ghost authentic-pregame__ghost"
            onClick={() => onOpenDeckBuilder?.("edit")}
          >
            open deck builder →
          </button>
          {onOpenCardStudio ? (
            <button
              type="button"
              className="authentic-button authentic-button--ghost authentic-pregame__ghost"
              data-testid="authentic-pregame-card-studio"
              onClick={onOpenCardStudio}
            >
              card studio →
            </button>
          ) : null}
        </header>

        <div className="authentic-pregame__body">
          <section className="authentic-pregame__panel">
            <div className="authentic-pregame__section-label">Step 1 - choose deck</div>
            <div className="authentic-pregame__deck-list">
              {deckOptions.map((option) => (
                <button
                  key={option.optionId}
                  type="button"
                  data-testid="authentic-pregame-deck-option"
                  className={`authentic-button authentic-button--tile authentic-pregame__deck-option${option.optionId === selectedDeck?.optionId ? " is-selected" : ""}`}
                  disabled={!option.ready}
                  onClick={() => chooseHumanDeck(option.optionId)}
                >
                  <span className="authentic-pregame__deck-leader">
                    {option.leader ? (
                      <AuthenticLeaderCard
                        size="pregame"
                        leader={{
                          sourceId: option.leader.sourceId,
                          name: option.leader.name,
                          faction: option.leader.faction,
                          abilityName: option.leaderAbilityName,
                          image: option.leader.image,
                        }}
                      />
                    ) : null}
                  </span>
                  <span className="authentic-pregame__deck-copy">
                    <strong>{option.name}</strong>
                    <em>{option.factionName}</em>
                    <small>
                      {option.cardCount} cards · {option.source === "local" ? "local · " : ""}
                      {option.ready ? "ready" : option.disabledReason}
                    </small>
                  </span>
                  {option.optionId === selectedDeck?.optionId ? <span className="authentic-pregame__checkmark">✓</span> : null}
                </button>
              ))}
            </div>
            <div className="authentic-pregame__builder-actions">
              <button
                type="button"
                className="authentic-button authentic-button--ghost authentic-pregame__builder-entry"
                data-testid="authentic-pregame-create-deck"
                onClick={() => onOpenDeckBuilder?.("create")}
              >
                <span className="authentic-pregame__builder-entry-text">+ create deck...</span>
              </button>
              <button
                type="button"
                className="authentic-button authentic-button--ghost authentic-pregame__builder-entry"
                data-testid="authentic-pregame-edit-decks"
                onClick={() => onOpenDeckBuilder?.("edit")}
              >
                <span className="authentic-pregame__builder-entry-text">edit decks →</span>
              </button>
            </div>
          </section>

          <section className="authentic-pregame__panel">
            <div className="authentic-pregame__section-label">Step 2 - game mode</div>
            <div className="authentic-pregame__mode-grid">
              {modeOptions.map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  data-testid="authentic-pregame-mode-option"
                  className={`authentic-button authentic-button--tile authentic-pregame__mode-option${mode.available ? " is-selected" : ""}`}
                  disabled={!mode.available}
                  aria-disabled={!mode.available}
                >
                  <span className="authentic-pregame__mode-heading">
                    <span aria-hidden="true">{mode.icon}</span>
                    <strong>{mode.name}</strong>
                  </span>
                  <span>{mode.description}</span>
                  <em>{mode.note}</em>
                </button>
              ))}
            </div>

            <div className="authentic-pregame__field">
              <Listbox
                label="Opponent"
                value={opponentDeckPresetId}
                onChange={setOpponentDeckPresetId}
                testId="authentic-pregame-opponent-option"
                options={opponentOptions.map((option) => ({
                  value: option.presetId,
                  label: option.name,
                  meta: option.factionName,
                  disabled: !option.ready || option.presetId === selectedDeck?.presetId,
                }))}
              />
              <em>{selectedOpponent?.description ?? "Choose a ready catalog opponent."}</em>
            </div>

            <div className="authentic-pregame__control-grid">
              <div>
                <div className="authentic-pregame__section-label">Round</div>
                <div className="authentic-pregame__segments authentic-pregame__segments--round">
                  {roundOptions.map((round) => (
                    <button
                      key={round.id}
                      type="button"
                      data-testid="authentic-pregame-round-option"
                      disabled={!round.available}
                      className={`authentic-button authentic-button--choice authentic-button--compact authentic-pregame__segment-option${round.id === roundId ? " is-selected" : ""}`}
                      onClick={() => {
                        if (round.available && round.id === "standard") {
                          setRoundId(round.id);
                        }
                      }}
                    >
                      {round.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="authentic-pregame__section-label">Format</div>
                <div className="authentic-pregame__segments authentic-pregame__segments--format">
                  {formatOptions.map((format) => (
                    <button
                      key={format.id}
                      type="button"
                      data-testid="authentic-pregame-format-option"
                      disabled={!format.available}
                      className={`authentic-button authentic-button--choice authentic-button--compact authentic-pregame__segment-option${format.id === formatId ? " is-selected" : ""}`}
                      onClick={() => {
                        if (format.available && format.id === "best-of-3") {
                          setFormatId(format.id);
                        }
                      }}
                    >
                      {format.name}
                    </button>
                  ))}
                </div>
              </div>

              <label className="authentic-pregame__field authentic-pregame__seed-field">
                <span>Seed</span>
                <div className="authentic-pregame__seed-row">
                  <input
                    data-testid="authentic-pregame-seed"
                    value={seed}
                    onChange={(event) => {
                      setSeed(event.target.value);
                      setCopyLabel("copy");
                    }}
                    placeholder="e.g. 8aF3-29-c1"
                  />
                  <button
                    type="button"
                    className="authentic-button authentic-button--secondary authentic-button--compact"
                    data-testid="authentic-pregame-copy-seed"
                    disabled={!navigator.clipboard || seed.trim().length === 0}
                    onClick={copySeed}
                  >
                    {copyLabel}
                  </button>
                </div>
              </label>
            </div>
          </section>
        </div>

        <footer className="authentic-pregame__summary">
          <p>
            {selectedDeck?.name ?? "Deck"} vs {selectedOpponent?.name ?? "Opponent"} · Human vs AI · {selectedRound?.name ?? "choose round"} ·{" "}
            {selectedFormat?.name ?? "choose format"} · seed {seedLabel} · {ENGINE_AI_POLICY_ID}
          </p>
          <button
            type="button"
            className="authentic-button authentic-button--primary authentic-button--flow authentic-pregame__begin"
            data-testid="authentic-pregame-begin"
            disabled={!canBegin}
            onClick={beginMatch}
          >
            begin match →
          </button>
        </footer>
      </div>
    </main>
  );
};

export default AuthenticPreGameScreen;
