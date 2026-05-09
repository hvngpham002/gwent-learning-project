import React, { useMemo, useState } from "react";

import { currentCatalogCards, currentCatalogLeaders, neutralCatalogCards } from "@/data/catalog";
import { CATALOG_ABILITY_IDS } from "@/game/catalog";

import AuthenticButton from "./AuthenticButton";
import AuthenticCard from "./AuthenticCard";
import AuthenticCardBack from "./AuthenticCardBack";
import AuthenticLeaderCard from "./AuthenticLeaderCard";
import Listbox from "./Listbox";
import { Alert, Toast } from "./alert";
import { fromCatalogCard } from "./cardViewModel";
import {
  getAbilityDisplay,
  getFactionDisplay,
  getLeaderAbilityDisplay,
  listFactionDisplays,
  listRowDisplays,
} from "./displayMetadata";
import { ReturnToSetupModal } from "./modal/ReturnToSetupModal";
import { StartMatchModal } from "./modal/StartMatchModal";
import "./authentic-ui.css";
import "./authentic-component-foundation.css";

const noop = () => undefined;

const findSampleCard = (predicate: (card: (typeof currentCatalogCards)[number]) => boolean) =>
  currentCatalogCards.find(predicate) ?? currentCatalogCards[0];

const useSampleCards = () =>
  useMemo(() => {
    const samples = [
      findSampleCard((card) => card.faction === "northern_realms" && card.kind === "unit"),
      findSampleCard((card) => card.faction === "nilfgaard" && card.kind === "hero"),
      findSampleCard((card) => card.faction === "neutral" && card.kind !== "special"),
      findSampleCard((card) => card.kind === "special"),
    ].filter(Boolean);

    return samples.map((card) => fromCatalogCard(card));
  }, []);

const useLeaderSample = () =>
  useMemo(() => {
    const leader = currentCatalogLeaders[0];
    if (!leader) return null;
    return {
      sourceId: leader.sourceId,
      name: leader.name,
      faction: leader.faction,
      abilityName: getLeaderAbilityDisplay(leader.ability).name,
      image: leader.image,
    };
  }, []);

const ButtonMatrix: React.FC = () => (
  <div className="authentic-foundation__button-grid" data-testid="authentic-foundation-buttons">
    <AuthenticButton type="button" variant="primary" onClick={noop}>
      primary
    </AuthenticButton>
    <AuthenticButton type="button" variant="primary" size="flow" onClick={noop}>
      primary flow
    </AuthenticButton>
    <AuthenticButton type="button" variant="secondary" onClick={noop}>
      secondary
    </AuthenticButton>
    <AuthenticButton type="button" variant="ghost" onClick={noop}>
      ghost
    </AuthenticButton>
    <AuthenticButton type="button" variant="destructive" onClick={noop}>
      destructive
    </AuthenticButton>
    <AuthenticButton type="button" variant="secondary" size="compact" onClick={noop}>
      compact
    </AuthenticButton>
    <AuthenticButton type="button" variant="ghost" icon aria-label="icon button" onClick={noop}>
      x
    </AuthenticButton>
    <AuthenticButton type="button" variant="primary" disabled>
      disabled
    </AuthenticButton>
  </div>
);

const SelectionButtons: React.FC = () => (
  <div className="authentic-foundation__selection-grid">
    <AuthenticButton type="button" variant="tile" selected onClick={noop}>
      <strong>Northern Realms</strong>
      <span>Selected tile action with multiline content.</span>
    </AuthenticButton>
    <AuthenticButton type="button" variant="tile" onClick={noop}>
      <strong>Nilfgaard</strong>
      <span>Standard tile action with matching spacing.</span>
    </AuthenticButton>
    <div className="authentic-foundation__segmented" aria-label="Choice button examples">
      <AuthenticButton type="button" variant="choice" size="compact" selected onClick={noop}>
        all
      </AuthenticButton>
      <AuthenticButton type="button" variant="choice" size="compact" onClick={noop}>
        units
      </AuthenticButton>
      <AuthenticButton type="button" variant="choice" size="compact" disabled>
        locked
      </AuthenticButton>
    </div>
  </div>
);

const TokenSwatches: React.FC = () => {
  const factions = listFactionDisplays();
  const rows = listRowDisplays();
  const abilityChips = CATALOG_ABILITY_IDS.filter((id) => id !== "none").map((id) => getAbilityDisplay(id));

  return (
    <div className="authentic-foundation__token-grid" data-testid="authentic-foundation-tokens">
      <div className="authentic-foundation__chip-row">
        {factions.map((faction) => (
          <span key={faction.id} className="authentic-foundation__chip">
            <span className="authentic-foundation__swatch" style={{ background: faction.color, borderColor: faction.accent }} />
            {faction.name}
          </span>
        ))}
      </div>
      <div className="authentic-foundation__chip-row">
        {rows.map((row) => (
          <span key={row.id} className="authentic-foundation__chip">
            <span className="authentic-foundation__glyph">{row.glyph}</span>
            {row.name}
          </span>
        ))}
      </div>
      <div className="authentic-foundation__chip-row">
        {abilityChips.map((ability) => (
          <span key={ability.id} className="authentic-foundation__chip" title={ability.description}>
            <span className="authentic-foundation__glyph">{ability.glyph || "."}</span>
            {ability.name}
          </span>
        ))}
      </div>
    </div>
  );
};

const FONT_AUDIT_ROWS = [
  {
    key: "authentic-body",
    label: "authentic body",
    token: "--font-body",
    stack: '"EB Garamond", "Iowan Old Style", Georgia, serif',
    source: "src/styles/gwent-tokens.css",
    use: "default readable copy inside .gwent-authentic routes",
    sample: "The field report stays compact, warm, and readable.",
    sampleClass: "authentic-foundation__font-sample--body",
  },
  {
    key: "authentic-display",
    label: "authentic display",
    token: "--font-display",
    stack: '"EB Garamond", "Iowan Old Style", "Palatino", Georgia, serif',
    source: "src/styles/gwent-tokens.css",
    use: "screen titles, card names, alert titles, modals, listboxes, and standard buttons",
    sample: "Round resolved",
    sampleClass: "authentic-foundation__font-sample--display",
  },
  {
    key: "authentic-mono",
    label: "authentic data",
    token: "--font-data",
    stack: '"JetBrains Mono", "Iosevka", ui-monospace, monospace',
    source: "src/styles/gwent-tokens.css",
    use: "seeds, debug traces, imported JSON, technical IDs, and compact numeric card badges only",
    sample: "seed 8675309 / score 27",
    sampleClass: "authentic-foundation__font-sample--mono",
  },
  {
    key: "legacy-body",
    label: "legacy body",
    token: "body",
    stack: '"Inter", sans-serif',
    source: "src/styles/global.css",
    use: "named legacy route and non-authentic diagnostic surfaces unless overridden",
    sample: "Legacy surfaces inherit the app body stack.",
    sampleClass: "authentic-foundation__font-sample--legacy",
  },
] as const;

const FONT_USAGE_ROWS = [
  ["Authentic route wrapper", "--font-body", "sets body copy on every .gwent-authentic screen"],
  ["Pre-game / deck builder / match / mulligan roots", "--font-body + --font-display", "body handles panel copy; display handles compact titles and names"],
  ["Shared buttons", "--font-display", "13px lowercase action text with normal style and shared hover states"],
  ["Cards and card backs", "--font-display + --font-data", "names and banners use display; strength and compact numeric badges use data"],
  ["Leader cards", "--font-body + --font-display", "leader names use display; faction/ability captions use body"],
  ["Listbox, alerts, toast, modals", "--font-body + --font-display", "labels and body text use body; titles and actions use display"],
  ["Legacy app shell", "Inter, sans-serif", "global body fallback for the /legacy route"],
] as const;

const TypographyAudit: React.FC = () => (
  <div className="authentic-foundation__font-audit" data-testid="authentic-foundation-fonts">
    <div className="authentic-foundation__font-grid">
      {FONT_AUDIT_ROWS.map((row) => (
        <article key={row.key} className="authentic-foundation__font-card">
          <div>
            <span>{row.label}</span>
            <strong>{row.token}</strong>
          </div>
          <p className={row.sampleClass} data-testid={`authentic-foundation-font-${row.key}`}>
            {row.sample}
          </p>
          <dl>
            <dt>stack</dt>
            <dd>
              <code>{row.stack}</code>
            </dd>
            <dt>source</dt>
            <dd>{row.source}</dd>
            <dt>use</dt>
            <dd>{row.use}</dd>
          </dl>
        </article>
      ))}
    </div>
    <div className="authentic-foundation__font-detail-grid">
      <article className="authentic-foundation__font-panel">
        <h3>Loaded Weights</h3>
        <p>
          Google Fonts loads EB Garamond normal and italic at 400, 500, 600, and 700, plus JetBrains Mono at 400, 500,
          600, and 700. The platform guideline is to use EB Garamond normal as the default voice, reserve italic for
          rare ceremonial emphasis, and keep JetBrains Mono behind <code>--font-data</code>.
        </p>
      </article>
      <article className="authentic-foundation__font-panel">
        <h3>Audit Notes</h3>
        <ul>
          {FONT_USAGE_ROWS.map(([surface, stack, note]) => (
            <li key={surface}>
              <strong>{surface}</strong>
              <span>{stack}</span>
              <em>{note}</em>
            </li>
          ))}
        </ul>
      </article>
      <article className="authentic-foundation__font-panel">
        <h3>Open Decisions</h3>
        <p>
          Keep Inter isolated to legacy surfaces, or replace the legacy body stack in a later cleanup pass. Decide
          whether production should self-host EB Garamond and JetBrains Mono instead of depending on the external Google
          Fonts import.
        </p>
      </article>
    </div>
  </div>
);

const CardGallery: React.FC = () => {
  const samples = useSampleCards();
  const leader = useLeaderSample();
  const fallbackBase = neutralCatalogCards[0] ?? currentCatalogCards[0];
  const fallback = fallbackBase
    ? {
        ...fromCatalogCard(fallbackBase),
        image: "/images/__missing-foundation-preview__.png",
      }
    : null;
  const [selected, setSelected] = useState(samples[0]?.sourceId ?? "");

  return (
    <div className="authentic-foundation__card-gallery" data-testid="authentic-foundation-cards">
      <div className="authentic-foundation__card-row">
        {samples.map((card) => (
          <AuthenticCard
            key={card.sourceId}
            card={card}
            size="md"
            selected={selected === card.sourceId}
            onClick={() => setSelected(card.sourceId)}
          />
        ))}
        {fallback ? <AuthenticCard card={fallback} size="md" dimmed /> : null}
      </div>
      <div className="authentic-foundation__card-row">
        {(["xs", "sm", "md", "lg"] as const).map((size) =>
          samples[0] ? <AuthenticCard key={size} card={samples[0]} size={size} /> : null,
        )}
      </div>
      <div className="authentic-foundation__card-row">
        {listFactionDisplays().map((faction) => (
          <AuthenticCardBack key={faction.id} size="sm" faction={faction.id} label={`${faction.name} hidden card`} />
        ))}
        <AuthenticCardBack size="sm" faction="neutral" variant="discard" label="Discard pile" />
        {leader ? <AuthenticLeaderCard leader={leader} size="match" /> : null}
      </div>
    </div>
  );
};

const FormControls: React.FC = () => {
  const [value, setValue] = useState("northern_realms");

  return (
    <div className="authentic-foundation__form-grid" data-testid="authentic-foundation-forms">
      <label>
        <span>Text input</span>
        <input className="authentic-foundation__input" value="review-seed-001" readOnly />
      </label>
      <label>
        <span>Textarea</span>
        <textarea className="authentic-foundation__input" value="Compact review copy for component states." readOnly rows={3} />
      </label>
      <Listbox
        label="Listbox"
        value={value}
        onChange={setValue}
        testId="authentic-foundation-listbox"
        options={[
          { value: "northern_realms", label: "Northern Realms", meta: "ready" },
          { value: "nilfgaard", label: "Nilfgaard", meta: "ready" },
          { value: "monsters", label: "Monsters", meta: "future", disabled: true },
        ]}
        hint="Custom trigger with native touch fallback."
      />
    </div>
  );
};

const AlertShowcase: React.FC = () => {
  const [toastOpen, setToastOpen] = useState(false);
  const [startModalOpen, setStartModalOpen] = useState(false);
  const [returnModalOpen, setReturnModalOpen] = useState(false);

  return (
    <div className="authentic-foundation__alerts" data-testid="authentic-foundation-alerts">
      <Alert
        severity="info"
        variant="ledger"
        eyebrow="ledger"
        title="Round resolved"
        body="Ledger alerts carry round and match summaries without inventing progression data."
        actions={[
          { label: "next round →", kind: "primary", onClick: noop },
          { label: "close", kind: "ghost", onClick: noop },
        ]}
      />
      <Alert
        severity="warn"
        variant="seal"
        eyebrow="seal"
        title="Confirm destructive action"
        body="Seal alerts are reserved for blocking decisions and handoff-style confirmations."
        actions={[
          { label: "cancel", kind: "ghost", onClick: noop },
          { label: "delete", kind: "destructive", onClick: noop },
        ]}
      />
      <div className="authentic-foundation__button-grid">
        <AuthenticButton
          type="button"
          variant="secondary"
          data-testid="authentic-foundation-toast-button"
          onClick={() => setToastOpen(true)}
        >
          show toast
        </AuthenticButton>
        <AuthenticButton
          type="button"
          variant="secondary"
          data-testid="authentic-foundation-start-modal"
          onClick={() => setStartModalOpen(true)}
        >
          start modal
        </AuthenticButton>
        <AuthenticButton type="button" variant="secondary" onClick={() => setReturnModalOpen(true)}>
          return modal
        </AuthenticButton>
      </div>
      <Toast
        open={toastOpen}
        severity="success"
        message="Toast component preview"
        autoDismissMs={900000}
        onDismiss={() => setToastOpen(false)}
      />
      <StartMatchModal open={startModalOpen} onReviewHand={() => setStartModalOpen(false)} onStart={() => setStartModalOpen(false)} />
      <ReturnToSetupModal open={returnModalOpen} onStay={() => setReturnModalOpen(false)} onLeave={() => setReturnModalOpen(false)} />
    </div>
  );
};

const GameSurfaces: React.FC = () => {
  const samples = useSampleCards();
  const faction = getFactionDisplay("northern_realms");

  return (
    <div className="authentic-foundation__game-grid" data-testid="authentic-foundation-game-surfaces">
      <div className="authentic-foundation__score-strip">
        <span className="authentic-foundation__swatch" style={{ background: faction.color, borderColor: faction.accent }} />
        <strong>Human</strong>
        <span>hand 10</span>
        <span>deck 18</span>
        <span>discard 0</span>
      </div>
      <div className="authentic-foundation__hidden-hand" aria-label="Hidden hand preview">
        {Array.from({ length: 10 }, (_, index) => (
          <AuthenticCardBack key={index} size="sm" faction="nilfgaard" label="Opponent hidden hand card" />
        ))}
      </div>
      <div className="authentic-foundation__board-row">
        <div className="authentic-foundation__board-label">
          <span>II</span>
          <strong>Ranged</strong>
        </div>
        <div className="authentic-foundation__board-cards">
          {samples.slice(0, 3).map((card) => (
            <AuthenticCard key={`board-${card.sourceId}`} card={card} size="xs" />
          ))}
        </div>
        <div className="authentic-foundation__board-score">18</div>
      </div>
      <div className="authentic-foundation__prompt-row">
        <AuthenticButton type="button" variant="secondary" onClick={noop}>
          play to ranged
        </AuthenticButton>
        <AuthenticButton type="button" variant="secondary" onClick={noop}>
          choose revive target
        </AuthenticButton>
      </div>
    </div>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode; testId?: string }> = ({ title, children, testId }) => (
  <section className="authentic-foundation__section" data-testid={testId}>
    <h2>{title}</h2>
    {children}
  </section>
);

const AuthenticComponentFoundationPage: React.FC = () => (
  <main className="gwent-authentic gwent-authentic--component-foundation" data-testid="authentic-component-foundation">
    <div className="authentic-foundation">
      <header className="authentic-foundation__topbar">
        <div>
          <h1>UI Component Foundation</h1>
          <p>Review the authentic platform primitives in one opt-in surface.</p>
        </div>
        <span>normal + debug routes share these components</span>
      </header>

      <Section title="Tokens">
        <TokenSwatches />
      </Section>

      <Section title="Typography">
        <TypographyAudit />
      </Section>

      <Section title="Buttons">
        <ButtonMatrix />
        <SelectionButtons />
      </Section>

      <Section title="Forms">
        <FormControls />
      </Section>

      <Section title="Cards And Leaders">
        <CardGallery />
      </Section>

      <Section title="Alerts, Toasts, Modals">
        <AlertShowcase />
      </Section>

      <Section title="Game Surfaces">
        <GameSurfaces />
      </Section>
    </div>
  </main>
);

export default AuthenticComponentFoundationPage;
