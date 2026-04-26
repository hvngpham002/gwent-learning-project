import React, { useMemo, useState } from "react";

import { ENGINE_AI_POLICY_ID } from "../game/engine/engineShellViewModels";
import AuthenticLeaderCard from "./AuthenticLeaderCard";
import {
  buildPreGameDeckOptions,
  buildPreGameFormatOptions,
  buildPreGameModeOptions,
  buildSetupConfig,
  getDefaultPreGameSelection,
  getSuggestedOpponentPresetId,
  seedFromSearch,
  type AuthenticMatchSetupConfig,
} from "./preGameViewModel";
import "./authentic-pregame.css";

interface AuthenticPreGameScreenProps {
  readonly search?: string;
  readonly onBeginMatch: (config: AuthenticMatchSetupConfig) => void;
}

const AuthenticPreGameScreen: React.FC<AuthenticPreGameScreenProps> = ({ search = window.location.search, onBeginMatch }) => {
  const deckOptions = useMemo(() => buildPreGameDeckOptions(), []);
  const modeOptions = useMemo(() => buildPreGameModeOptions(), []);
  const formatOptions = useMemo(() => buildPreGameFormatOptions(), []);
  const defaults = useMemo(() => getDefaultPreGameSelection(), []);
  const [humanDeckPresetId, setHumanDeckPresetId] = useState(defaults.humanDeckPresetId);
  const [opponentDeckPresetId, setOpponentDeckPresetId] = useState(defaults.opponentDeckPresetId);
  const [seed, setSeed] = useState(() => seedFromSearch(search));
  const [copyLabel, setCopyLabel] = useState("Copy seed");

  const selectedDeck = deckOptions.find((option) => option.presetId === humanDeckPresetId) ?? deckOptions[0];
  const selectedOpponent = deckOptions.find((option) => option.presetId === opponentDeckPresetId) ?? deckOptions[1] ?? deckOptions[0];
  const canBegin = Boolean(selectedDeck?.ready && selectedOpponent?.ready);
  const seedLabel = seed.trim().length > 0 ? seed.trim() : "generated on begin";

  const chooseHumanDeck = (presetId: string) => {
    setHumanDeckPresetId(presetId);
    if (presetId === opponentDeckPresetId) {
      setOpponentDeckPresetId(getSuggestedOpponentPresetId(presetId, deckOptions));
    }
  };

  const beginMatch = () => {
    if (!canBegin) {
      return;
    }
    const config = buildSetupConfig({ humanDeckPresetId, opponentDeckPresetId, seed });
    setSeed(String(config.seed));
    onBeginMatch(config);
  };

  const copySeed = async () => {
    if (!navigator.clipboard || seed.trim().length === 0) {
      return;
    }
    await navigator.clipboard.writeText(seed.trim());
    setCopyLabel("Copied");
  };

  return (
    <main className="gwent-authentic gwent-authentic--pregame" data-testid="authentic-pregame">
      <div className="authentic-pregame">
        <header className="authentic-pregame__topbar">
          <button type="button" className="authentic-pregame__ghost" onClick={() => window.history.back()} aria-label="Back">
            Menu
          </button>
          <div>
            <span>Authentic table</span>
            <h1>Prepare for Battle</h1>
          </div>
          <button
            type="button"
            className="authentic-pregame__ghost"
            data-testid="authentic-pregame-builder-placeholder"
            disabled
            title="Deck builder arrives in cEp5"
          >
            Deck Builder - coming next
          </button>
        </header>

        <div className="authentic-pregame__body">
          <section className="authentic-pregame__panel">
            <div className="authentic-pregame__section-label">Step 1 - choose deck</div>
            <div className="authentic-pregame__deck-list">
              {deckOptions.map((option) => (
                <button
                  key={option.presetId}
                  type="button"
                  data-testid="authentic-pregame-deck-option"
                  className={`authentic-pregame__deck-option${option.presetId === humanDeckPresetId ? " is-selected" : ""}`}
                  disabled={!option.ready}
                  onClick={() => chooseHumanDeck(option.presetId)}
                >
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
                  <span>
                    <strong>{option.name}</strong>
                    <em>{option.factionName}</em>
                    <small>
                      {option.cardCount} cards · {option.unitCount} units · {option.heroCount} heroes · {option.specialCount} specials
                    </small>
                    <small>{option.ready ? "ready" : option.disabledReason}</small>
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section className="authentic-pregame__panel">
            <div className="authentic-pregame__section-label">Step 2 - configure match</div>
            <div className="authentic-pregame__mode-grid">
              {modeOptions.map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  data-testid="authentic-pregame-mode-option"
                  className={`authentic-pregame__mode-option${mode.available ? " is-selected" : ""}`}
                  disabled={!mode.available}
                  aria-disabled={!mode.available}
                >
                  <strong>{mode.name}</strong>
                  <span>{mode.description}</span>
                  <em>{mode.note}</em>
                </button>
              ))}
            </div>

            <label className="authentic-pregame__field">
              <span>Opponent preset</span>
              <select
                data-testid="authentic-pregame-opponent-option"
                value={opponentDeckPresetId}
                onChange={(event) => setOpponentDeckPresetId(event.target.value)}
              >
                {deckOptions.map((option) => (
                  <option key={option.presetId} value={option.presetId} disabled={!option.ready || option.presetId === humanDeckPresetId}>
                    {option.name} ({option.factionName})
                  </option>
                ))}
              </select>
            </label>

            <div className="authentic-pregame__formats">
              {formatOptions.map((format) => (
                <button key={format.id} type="button" disabled={!format.available} className={format.available ? "is-selected" : ""}>
                  {format.name}
                  <span>{format.note}</span>
                </button>
              ))}
            </div>

            <label className="authentic-pregame__field">
              <span>Seed</span>
              <div className="authentic-pregame__seed-row">
                <input
                  data-testid="authentic-pregame-seed"
                  value={seed}
                  onChange={(event) => {
                    setSeed(event.target.value);
                    setCopyLabel("Copy seed");
                  }}
                  placeholder="Blank generates a visible seed"
                />
                <button
                  type="button"
                  data-testid="authentic-pregame-copy-seed"
                  disabled={!navigator.clipboard || seed.trim().length === 0}
                  onClick={copySeed}
                >
                  {copyLabel}
                </button>
              </div>
            </label>
          </section>
        </div>

        <footer className="authentic-pregame__summary">
          <p>
            {selectedDeck?.name ?? "Deck"} vs {selectedOpponent?.name ?? "Opponent"} · Human vs AI · Standard · seed {seedLabel} ·{" "}
            {ENGINE_AI_POLICY_ID}
          </p>
          <button type="button" data-testid="authentic-pregame-begin" disabled={!canBegin} onClick={beginMatch}>
            Begin Match
          </button>
        </footer>
      </div>
    </main>
  );
};

export default AuthenticPreGameScreen;
