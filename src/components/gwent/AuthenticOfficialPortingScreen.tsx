import React, { useMemo, useRef, useState } from "react";

import {
  game8OfficialCardCandidates,
  game8OfficialLeaderCandidates,
  type OfficialImageCandidate,
} from "@/data/catalog/official";
import {
  CATALOG_ABILITY_METADATA,
  CATALOG_FACTIONS,
  CATALOG_LEADER_ABILITY_METADATA,
  CATALOG_ROWS,
  type CatalogAbilityId,
  type CatalogCardKind,
  type CatalogCardSource,
  type CatalogFaction,
  type CatalogLeaderAbilityId,
  type CatalogRow,
} from "@/game/catalog";

import AuthenticCard from "./AuthenticCard";
import AuthenticLeaderCard from "./AuthenticLeaderCard";
import Listbox from "./Listbox";
import { Alert, Toast } from "./alert";
import { dimensionsForSize, fromCatalogCard } from "./cardViewModel";
import { getFactionDisplay, getLeaderAbilityDisplay } from "./displayMetadata";
import {
  parseOfficialPortingReviewImport,
  stringifyOfficialPortingReviewBundle,
} from "./officialPortingImportExport";
import { clampOfficialCrop } from "./officialPortingStorage";
import {
  defaultOfficialPortingFilters,
  filterOfficialPortingRecords,
  findOfficialRecord,
  officialPortingCounts,
  setOfficialActiveSource,
  setOfficialApproved,
  setOfficialNote,
  upsertOfficialDataOverride,
  upsertOfficialImageOverride,
  buildOfficialPortingRecords,
} from "./officialPortingViewModel";
import type {
  OfficialPortingDataOverride,
  OfficialPortingFilters,
  OfficialPortingStoreV1,
} from "./officialPortingTypes";
import "./authentic-official-porting.css";

interface AuthenticOfficialPortingScreenProps {
  readonly store: OfficialPortingStoreV1;
  readonly storageWarning?: string | null;
  readonly onStoreChange: (store: OfficialPortingStoreV1) => void;
  readonly onExit: () => void;
}

const imageByteLimit = 1024 * 1024;
const nonNeutralFactions = CATALOG_FACTIONS.filter((faction) => faction !== "neutral");
const previewDimensions = dimensionsForSize("lg");

const downloadJson = (filename: string, text: string) => {
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};

const splitList = (value: string): string[] =>
  value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

const AuthenticOfficialPortingScreen: React.FC<AuthenticOfficialPortingScreenProps> = ({
  store,
  storageWarning,
  onStoreChange,
  onExit,
}) => {
  const [filters, setFilters] = useState<OfficialPortingFilters>(() => defaultOfficialPortingFilters());
  const [notice, setNotice] = useState(storageWarning ?? "");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [importErrors, setImportErrors] = useState<readonly string[]>([]);
  const importFileRef = useRef<HTMLInputElement | null>(null);
  const localImageRef = useRef<HTMLInputElement | null>(null);

  const records = useMemo(() => buildOfficialPortingRecords(store), [store]);
  const filteredRecords = useMemo(() => filterOfficialPortingRecords(records, filters), [records, filters]);
  const selectedRecord = findOfficialRecord(store, store.activeSourceId);
  const counts = officialPortingCounts(store);
  const selectedCardCandidate = game8OfficialCardCandidates.find(
    (candidate) => candidate.source.sourceId === selectedRecord.originalSourceId,
  );
  const selectedLeaderCandidate = game8OfficialLeaderCandidates.find(
    (candidate) => candidate.sourceId === selectedRecord.originalSourceId,
  );
  const selectedImage = selectedRecord.image;
  const sourceIdLocked = Boolean(selectedRecord.matchedCurrentSourceId);
  const cropStyle = {
    width: previewDimensions.width,
    height: previewDimensions.height,
  } as React.CSSProperties;
  const cropInnerStyle = {
    transform: `translate(${selectedImage.crop.offsetX}px, ${selectedImage.crop.offsetY}px) scale(${selectedImage.crop.scale})`,
  } as React.CSSProperties;

  const updateStore = (nextStore: OfficialPortingStoreV1, message: string) => {
    onStoreChange(nextStore);
    setNotice(message);
    setToastMessage(message);
  };

  const selectSource = (sourceId: string) => {
    onStoreChange(setOfficialActiveSource(store, sourceId));
  };

  const updateData = (patch: OfficialPortingDataOverride) => {
    updateStore(upsertOfficialDataOverride(store, selectedRecord.originalSourceId, patch), "updated staging data");
  };

  const updateImage = (patch: Partial<OfficialImageCandidate>) => {
    const nextImage = {
      ...selectedImage,
      ...patch,
      sourceId: selectedRecord.originalSourceId,
      crop: clampOfficialCrop(patch.crop ?? selectedImage.crop),
    };
    updateStore(upsertOfficialImageOverride(store, selectedRecord.originalSourceId, nextImage), "updated image review");
  };

  const copyReviewBundle = async () => {
    if (!navigator.clipboard) return;
    await navigator.clipboard.writeText(stringifyOfficialPortingReviewBundle(store));
    setToastMessage("copied official review bundle");
  };

  const importReviewBundle = () => {
    const result = parseOfficialPortingReviewImport(importText);
    if (!result.ok || !result.store) {
      setImportErrors(result.errors);
      return;
    }
    updateStore(result.store, result.notices.join(" ") || "imported official review bundle");
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

  const readLocalImage: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    const file = event.currentTarget.files?.[0];
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setNotice("Use PNG, JPEG, or WebP images.");
      return;
    }
    if (file.size > imageByteLimit) {
      setNotice("Image is over the 1 MB browser-storage review limit.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      updateImage({
        preferredImagePath: String(reader.result ?? ""),
        browserLocalPreview: true,
        existsInPublicImages: false,
        approved: false,
      });
    };
    reader.readAsDataURL(file);
  };

  const renderCardEditor = (source: CatalogCardSource) => (
    <>
      <div className="authentic-official-porting__field-grid">
        <label>
          <span>name</span>
          <input value={source.name} onChange={(event) => updateData({ name: event.target.value })} />
        </label>
        <label>
          <span>source id</span>
          <input
            value={source.sourceId}
            disabled={sourceIdLocked}
            onChange={(event) => updateData({ sourceId: event.target.value.trim() })}
          />
        </label>
        <Listbox
          label="faction"
          value={source.faction}
          onChange={(value) => updateData({ faction: value as CatalogFaction })}
          options={CATALOG_FACTIONS.map((faction) => ({ value: faction, label: getFactionDisplay(faction).name }))}
        />
        <Listbox
          label="kind"
          value={source.kind}
          onChange={(value) => updateData({ kind: value as CatalogCardKind })}
          options={["unit", "hero", "special"].map((kind) => ({ value: kind, label: kind }))}
        />
        <label>
          <span>strength</span>
          <input
            type="number"
            min={0}
            value={source.strength}
            onChange={(event) => updateData({ strength: Math.max(0, Number(event.target.value) || 0) })}
          />
        </label>
        <label>
          <span>deck limit</span>
          <input
            type="number"
            min={1}
            value={source.deckLimit}
            onChange={(event) => updateData({ deckLimit: Math.max(1, Number(event.target.value) || 1) })}
          />
        </label>
      </div>
      <div className="authentic-official-porting__checks">
        <span>rows</span>
        {CATALOG_ROWS.map((row) => (
          <label key={row}>
            <input
              type="checkbox"
              checked={source.rows.includes(row)}
              onChange={() => {
                const rows = source.rows.includes(row)
                  ? source.rows.filter((entry) => entry !== row)
                  : [...source.rows, row as CatalogRow];
                updateData({ rows });
              }}
            />
            {row}
          </label>
        ))}
      </div>
      <div className="authentic-official-porting__ability-grid">
        {Object.values(CATALOG_ABILITY_METADATA).map((ability) => (
          <label key={ability.id}>
            <input
              type="checkbox"
              checked={source.abilities.includes(ability.id)}
              onChange={() => {
                if (ability.id === "none") {
                  updateData({ abilities: ["none"] });
                  return;
                }
                const withoutNone = source.abilities.filter((entry) => entry !== "none");
                const abilities = source.abilities.includes(ability.id)
                  ? withoutNone.filter((entry) => entry !== ability.id)
                  : [...withoutNone, ability.id as CatalogAbilityId];
                updateData({ abilities: abilities.length > 0 ? abilities : ["none"] });
              }}
            />
            {ability.name} · {ability.status}
          </label>
        ))}
      </div>
      <label>
        <span>tags</span>
        <input value={source.tags.join(", ")} onChange={(event) => updateData({ tags: splitList(event.target.value) })} />
      </label>
      <label>
        <span>description</span>
        <textarea value={source.description ?? ""} onChange={(event) => updateData({ description: event.target.value })} />
      </label>
    </>
  );

  const renderLeaderEditor = (candidate: NonNullable<typeof selectedLeaderCandidate>) => {
    const override = store.dataOverridesBySourceId[candidate.sourceId] as Partial<typeof candidate> | undefined;
    const name = override?.name ?? candidate.name;
    const sourceId = override?.sourceId ?? candidate.sourceId;
    const faction = override?.faction ?? candidate.faction;
    const mappedAbilityId = override?.mappedAbilityId ?? candidate.mappedAbilityId;
    return (
      <>
        <div className="authentic-official-porting__field-grid">
          <label>
            <span>name</span>
            <input value={name} onChange={(event) => updateData({ name: event.target.value })} />
          </label>
          <label>
            <span>source id</span>
            <input
              value={sourceId}
              disabled={sourceIdLocked}
              onChange={(event) => updateData({ sourceId: event.target.value.trim() })}
            />
          </label>
          <Listbox
            label="faction"
            value={faction}
            onChange={(value) => updateData({ faction: value as Exclude<CatalogFaction, "neutral"> })}
            options={nonNeutralFactions.map((nextFaction) => ({ value: nextFaction, label: getFactionDisplay(nextFaction).name }))}
          />
          <Listbox
            label="mapped ability"
            value={mappedAbilityId ?? "unmapped"}
            onChange={(value) =>
              updateData({ mappedAbilityId: value === "unmapped" ? undefined : (value as CatalogLeaderAbilityId) })
            }
            options={[
              { value: "unmapped", label: "unmapped" },
              ...Object.values(CATALOG_LEADER_ABILITY_METADATA).map((ability) => ({
                value: ability.id,
                label: ability.name,
                meta: ability.status,
              })),
            ]}
          />
        </div>
        <label>
          <span>pending ability id</span>
          <input value={candidate.pendingAbilityId ?? ""} readOnly />
        </label>
        <label>
          <span>leader effect</span>
          <textarea
            value={(store.dataOverridesBySourceId[candidate.sourceId] as Partial<typeof candidate> | undefined)?.leaderEffectText ?? candidate.leaderEffectText ?? ""}
            onChange={(event) => updateData({ leaderEffectText: event.target.value })}
          />
        </label>
      </>
    );
  };

  const selectedCardSource = selectedCardCandidate
    ? {
        ...selectedCardCandidate.source,
        ...(store.dataOverridesBySourceId[selectedCardCandidate.source.sourceId] as Partial<CatalogCardSource> | undefined),
        image: selectedImage.preferredImagePath,
      }
    : null;
  const selectedLeader = selectedLeaderCandidate
    ? {
        sourceId: selectedRecord.sourceId,
        name: selectedRecord.name,
        faction: selectedRecord.faction,
        abilityName: getLeaderAbilityDisplay(selectedLeaderCandidate.mappedAbilityId).name,
        image: selectedImage.preferredImagePath,
      }
    : null;

  return (
    <main className="gwent-authentic gwent-authentic--official-porting" data-testid="authentic-official-porting">
      <div className="authentic-official-porting">
        <header className="authentic-official-porting__topbar">
          <div className="authentic-official-porting__title">
            <button type="button" className="authentic-button authentic-button--ghost" onClick={onExit}>← back</button>
            <h1>Official Porting</h1>
          </div>
          <div className="authentic-official-porting__counts" data-testid="official-porting-counts">
            <span>{counts.total} candidates</span>
            <span>{counts.approved} approved</span>
            <span>{counts.missingImages} missing images</span>
            <span>{counts.ruleGaps} rule gaps</span>
          </div>
          <div className="authentic-official-porting__actions">
            <button type="button" className="authentic-button authentic-button--secondary" onClick={() => setImportOpen(true)}>import</button>
            <button
              type="button"
              className="authentic-button authentic-button--secondary"
              onClick={() => downloadJson("official-porting-review.json", stringifyOfficialPortingReviewBundle(store))}
            >
              export
            </button>
            <button type="button" className="authentic-button authentic-button--secondary" onClick={copyReviewBundle} disabled={!navigator.clipboard}>copy</button>
          </div>
        </header>

        <div className="authentic-official-porting__body">
          <aside className="authentic-official-porting__list-panel">
            <div className="authentic-official-porting__filters">
              <input
                aria-label="Search official candidates"
                value={filters.search}
                placeholder="search official cards"
                onChange={(event) => setFilters({ ...filters, search: event.target.value })}
              />
              <Listbox
                label="faction"
                value={filters.faction}
                onChange={(value) => setFilters({ ...filters, faction: value })}
                options={[
                  { value: "all", label: "all factions" },
                  ...CATALOG_FACTIONS.map((faction) => ({ value: faction, label: getFactionDisplay(faction).name })),
                ]}
              />
              <Listbox
                label="kind"
                value={filters.kind}
                onChange={(value) => setFilters({ ...filters, kind: value as OfficialPortingFilters["kind"] })}
                options={[
                  { value: "all", label: "all kinds" },
                  { value: "card", label: "cards" },
                  { value: "leader", label: "leaders" },
                  { value: "unit", label: "units" },
                  { value: "hero", label: "heroes" },
                  { value: "special", label: "specials" },
                ]}
              />
              <Listbox
                label="status"
                value={filters.status}
                onChange={(value) => setFilters({ ...filters, status: value as OfficialPortingFilters["status"] })}
                options={[
                  { value: "all", label: "all status" },
                  { value: "ready_for_catalog", label: "ready" },
                  { value: "needs_image", label: "needs image" },
                  { value: "needs_rule", label: "needs rule" },
                  { value: "needs_leader_rule", label: "leader rule" },
                  { value: "needs_review", label: "review" },
                ]}
              />
              <div className="authentic-official-porting__filter-buttons">
                <button
                  type="button"
                  className={`authentic-button authentic-button--choice authentic-button--compact${filters.missingImageOnly ? " is-selected" : ""}`}
                  onClick={() => setFilters({ ...filters, missingImageOnly: !filters.missingImageOnly })}
                >
                  missing image
                </button>
                <button
                  type="button"
                  className={`authentic-button authentic-button--choice authentic-button--compact${filters.ruleGapOnly ? " is-selected" : ""}`}
                  onClick={() => setFilters({ ...filters, ruleGapOnly: !filters.ruleGapOnly })}
                >
                  rule gap
                </button>
                <button
                  type="button"
                  className={`authentic-button authentic-button--choice authentic-button--compact${filters.approvedOnly ? " is-selected" : ""}`}
                  onClick={() => setFilters({ ...filters, approvedOnly: !filters.approvedOnly })}
                >
                  approved
                </button>
              </div>
            </div>
            <div className="authentic-official-porting__record-list" data-testid="official-porting-candidate-list">
              {filteredRecords.map((record) => (
                <button
                  key={record.originalSourceId}
                  type="button"
                  className={`authentic-button authentic-button--tile authentic-official-porting__record${record.originalSourceId === selectedRecord.originalSourceId ? " is-selected" : ""}`}
                  onClick={() => selectSource(record.originalSourceId)}
                  data-source-id={record.originalSourceId}
                >
                  <strong>{record.name}</strong>
                  <span>{record.sourceId}</span>
                  <em>{getFactionDisplay(record.faction).short} · {record.typeLabel} · {record.status}</em>
                </button>
              ))}
            </div>
          </aside>

          <section className="authentic-official-porting__editor">
            <div className="authentic-official-porting__editor-heading">
              <div>
                <h2>{selectedRecord.name}</h2>
                <p>{selectedRecord.sourceId}</p>
              </div>
              <div className="authentic-official-porting__editor-actions">
                <button
                  type="button"
                  className="authentic-button authentic-button--secondary"
                  onClick={() => updateImage({ approved: true })}
                >
                  approve image
                </button>
                <button
                  type="button"
                  className="authentic-button authentic-button--primary"
                  onClick={() => updateStore(setOfficialApproved(store, selectedRecord.originalSourceId, true), "approved staging data")}
                >
                  approve data
                </button>
              </div>
            </div>
            {sourceIdLocked ? (
              <p className="authentic-official-porting__hint">Source ID is locked because this candidate matches an existing current catalog ID.</p>
            ) : (
              <p className="authentic-official-porting__hint">Source ID edits are for verified official mapping conflicts only.</p>
            )}
            {selectedCardSource ? renderCardEditor(selectedCardSource) : null}
            {selectedLeaderCandidate ? renderLeaderEditor(selectedLeaderCandidate) : null}
            <label>
              <span>review note</span>
              <textarea value={selectedRecord.note} onChange={(event) => updateStore(setOfficialNote(store, selectedRecord.originalSourceId, event.target.value), "updated note")} />
            </label>
          </section>

          <aside className="authentic-official-porting__preview">
            <div className="authentic-official-porting__crop-frame" style={cropStyle} data-fit={selectedImage.crop.fit} data-testid="official-porting-preview">
              <div className="authentic-official-porting__crop-inner" style={cropInnerStyle}>
                {selectedCardSource ? <AuthenticCard card={fromCatalogCard(selectedCardSource)} size="lg" /> : null}
                {selectedLeader ? <AuthenticLeaderCard leader={selectedLeader} size="large" /> : null}
              </div>
            </div>

            <div className="authentic-official-porting__image-controls">
              <label>
                <span>image path</span>
                <input
                  value={selectedImage.preferredImagePath}
                  onChange={(event) =>
                    updateImage({
                      preferredImagePath: event.target.value,
                      existsInPublicImages: event.target.value === selectedRecord.image.preferredImagePath && selectedRecord.image.existsInPublicImages,
                      browserLocalPreview: event.target.value.startsWith("data:image/") || undefined,
                      approved: false,
                    })
                  }
                />
              </label>
              <Listbox
                label="fit"
                value={selectedImage.crop.fit}
                onChange={(value) => updateImage({ crop: { ...selectedImage.crop, fit: value === "cover" ? "cover" : "contain" } })}
                options={[
                  { value: "contain", label: "contain" },
                  { value: "cover", label: "cover" },
                ]}
              />
              <label>
                <span>scale</span>
                <input type="number" min={0.5} max={2} step={0.05} value={selectedImage.crop.scale} onChange={(event) => updateImage({ crop: { ...selectedImage.crop, scale: Number(event.target.value) } })} />
              </label>
              <label>
                <span>offset x</span>
                <input type="number" min={-100} max={100} value={selectedImage.crop.offsetX} onChange={(event) => updateImage({ crop: { ...selectedImage.crop, offsetX: Number(event.target.value) } })} />
              </label>
              <label>
                <span>offset y</span>
                <input type="number" min={-100} max={100} value={selectedImage.crop.offsetY} onChange={(event) => updateImage({ crop: { ...selectedImage.crop, offsetY: Number(event.target.value) } })} />
              </label>
              <label>
                <span>bottom crop</span>
                <input type="number" min={0} max={80} value={selectedImage.crop.cropBottomPx} onChange={(event) => updateImage({ crop: { ...selectedImage.crop, cropBottomPx: Number(event.target.value) } })} />
              </label>
              <div className="authentic-official-porting__image-actions">
                <input ref={localImageRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={readLocalImage} />
                <button type="button" className="authentic-button authentic-button--secondary" onClick={() => localImageRef.current?.click()}>local preview</button>
                <button type="button" className="authentic-button authentic-button--ghost" onClick={() => updateImage({ crop: clampOfficialCrop({}) })}>reset crop</button>
              </div>
            </div>

            <Alert
              severity={selectedRecord.status === "ready_for_catalog" ? "success" : selectedRecord.status === "needs_image" ? "warn" : "error"}
              variant="ledger"
              className="authentic-alert--compact"
              eyebrow={selectedRecord.status}
              title={selectedRecord.approved ? "Approved for review bundle." : "Review still open."}
              body={
                <ul className="authentic-official-porting__issues">
                  {selectedRecord.issues.length === 0 ? <li>No current staging issues.</li> : null}
                  {selectedRecord.issues.map((issue) => <li key={issue}>{issue}</li>)}
                  {selectedImage.browserLocalPreview ? <li>browser-local preview image; prefer a stable /images/... path before promotion.</li> : null}
                </ul>
              }
              testId="official-porting-status"
            />
            {notice ? (
              <Alert
                severity="info"
                variant="ledger"
                className="authentic-alert--compact"
                eyebrow="review store"
                title={notice}
                testId="official-porting-notice"
              />
            ) : null}
          </aside>
        </div>
      </div>

      {importOpen ? (
        <div className="authentic-official-porting__modal" role="dialog" aria-modal="true">
          <div className="authentic-official-porting__modal-box">
            <h2>Import Official Review Bundle</h2>
            <textarea value={importText} onChange={(event) => setImportText(event.target.value)} />
            <input ref={importFileRef} type="file" accept="application/json,.json" hidden onChange={readImportFile} />
            {importErrors.length > 0 ? (
              <Alert
                severity="error"
                variant="ledger"
                className="authentic-alert--compact"
                eyebrow="import failed"
                title="Official review bundle cannot be imported."
                body={<ul>{importErrors.map((error) => <li key={error}>{error}</li>)}</ul>}
              />
            ) : null}
            <div>
              <button type="button" className="authentic-button authentic-button--secondary" onClick={() => importFileRef.current?.click()}>upload file...</button>
              <button type="button" className="authentic-button authentic-button--ghost" onClick={() => setImportOpen(false)}>cancel</button>
              <button type="button" className="authentic-button authentic-button--primary" onClick={importReviewBundle}>import</button>
            </div>
          </div>
        </div>
      ) : null}
      <Toast open={Boolean(toastMessage)} message={toastMessage ?? ""} onDismiss={() => setToastMessage(null)} />
    </main>
  );
};

export default AuthenticOfficialPortingScreen;
