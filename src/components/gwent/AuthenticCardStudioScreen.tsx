import React, { useEffect, useMemo, useRef, useState } from "react";

import {
  CATALOG_ABILITY_METADATA,
  CATALOG_CARD_KINDS,
  CATALOG_FACTIONS,
  CATALOG_LEADER_ABILITY_METADATA,
  CATALOG_ROWS,
  type CatalogAbilityId,
  type CatalogCardKind,
  type CatalogDeckPreset,
  type CatalogFaction,
  type CatalogLeaderAbilityId,
} from "@/game/catalog";

import AuthenticCard from "./AuthenticCard";
import AuthenticLeaderCard from "./AuthenticLeaderCard";
import Listbox from "./Listbox";
import { Alert, Toast } from "./alert";
import { fromCatalogCard } from "./cardViewModel";
import {
  CARD_STUDIO_MAX_IMAGE_BYTES,
  type CardStudioStoreV1,
  type CustomCardRecord,
  type CustomCatalogRecord,
  type CustomLeaderRecord,
} from "./cardStudioTypes";
import {
  appendImportedCustomRecords,
  customRecordFileName,
  parseCardStudioImport,
  stringifyCardStudioBundleExport,
  stringifyCardStudioRecordExport,
} from "./cardStudioImportExport";
import {
  countDeckReferencesToSource,
  createCustomCardRecord,
  createCustomLeaderRecord,
  duplicateCustomRecord,
  recordKind,
  removeCustomSourceFromDecks,
  buildCardStudioValidationContext,
} from "./cardStudioViewModel";
import {
  normalizeCustomSourceId,
  sourceIdFromName,
  validateCustomCardRecord,
  validateCustomLeaderRecord,
} from "./cardStudioValidation";
import { getFactionDisplay, getLeaderAbilityDisplay } from "./displayMetadata";
import "./authentic-card-studio.css";

interface AuthenticCardStudioScreenProps {
  readonly store: CardStudioStoreV1;
  readonly decks: readonly CatalogDeckPreset[];
  readonly storageWarning?: string | null;
  readonly onStoreChange: (store: CardStudioStoreV1) => void;
  readonly onDecksChange: (decks: readonly CatalogDeckPreset[], activePresetId?: string) => void;
  readonly onExit: () => void;
}

interface PendingConfirmation {
  readonly title: string;
  readonly body: string;
  readonly confirmLabel: string;
  readonly onConfirm: () => void;
}

const nonNeutralFactions = CATALOG_FACTIONS.filter((faction) => faction !== "neutral");

const allRecords = (store: CardStudioStoreV1): readonly CustomCatalogRecord[] => [...store.cards, ...store.leaders];

const firstRecord = (store: CardStudioStoreV1): CustomCatalogRecord =>
  allRecords(store).find((record) => record.recordId === store.activeRecordId) ??
  store.cards[0] ??
  store.leaders[0] ??
  createCustomCardRecord(store);

const recordMatchesSearch = (record: CustomCatalogRecord, search: string, filter: "all" | "cards" | "leaders" | "drafts" | "playable") => {
  const kind = recordKind(record);
  if (filter === "cards" && kind !== "card") return false;
  if (filter === "leaders" && kind !== "leader") return false;
  if (filter === "drafts" && !record.draft) return false;
  if (filter === "playable" && record.draft) return false;
  const needle = search.trim().toLowerCase();
  if (!needle) return true;
  return (
    record.source.name.toLowerCase().includes(needle) ||
    record.source.sourceId.toLowerCase().includes(needle) ||
    ("abilities" in record.source && record.source.abilities.some((ability) => ability.includes(needle))) ||
    ("ability" in record.source && record.source.ability.includes(needle))
  );
};

const downloadJson = (filename: string, text: string) => {
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};

const withUpdatedCardSource = (
  record: CustomCardRecord,
  updater: (source: CustomCardRecord["source"]) => CustomCardRecord["source"],
): CustomCardRecord => ({
  ...record,
  source: updater(record.source),
});

const withUpdatedLeaderSource = (
  record: CustomLeaderRecord,
  updater: (source: CustomLeaderRecord["source"]) => CustomLeaderRecord["source"],
): CustomLeaderRecord => ({
  ...record,
  source: updater(record.source),
});

const AuthenticCardStudioScreen: React.FC<AuthenticCardStudioScreenProps> = ({
  store,
  decks,
  storageWarning,
  onStoreChange,
  onDecksChange,
  onExit,
}) => {
  const [editing, setEditing] = useState<CustomCatalogRecord>(() => firstRecord(store));
  const [filter, setFilter] = useState<"all" | "cards" | "leaders" | "drafts" | "playable">("all");
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState(storageWarning ?? "");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [importErrors, setImportErrors] = useState<readonly string[]>([]);
  const [pendingConfirmation, setPendingConfirmation] = useState<PendingConfirmation | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const importFileRef = useRef<HTMLInputElement | null>(null);

  const savedRecord = allRecords(store).find((record) => record.recordId === editing.recordId) ?? null;
  const isSavedRecord = Boolean(savedRecord);
  const kind = recordKind(editing);
  const validation = useMemo(() => {
    const context = buildCardStudioValidationContext(store, editing.recordId);
    return kind === "card"
      ? validateCustomCardRecord(editing as CustomCardRecord, context)
      : validateCustomLeaderRecord(editing as CustomLeaderRecord, context);
  }, [editing, kind, store]);
  const references = countDeckReferencesToSource(decks, editing.source.sourceId);
  const filteredRecords = allRecords(store).filter((record) => recordMatchesSearch(record, search, filter));

  useEffect(() => {
    const active = firstRecord(store);
    setEditing(active);
  }, [store]);

  const updateStore = (nextStore: CardStudioStoreV1, message: string) => {
    onStoreChange(nextStore);
    setNotice(message);
    setToastMessage(message);
  };

  const selectRecord = (record: CustomCatalogRecord) => {
    onStoreChange({ ...store, activeRecordId: record.recordId });
    setEditing(record);
  };

  const createCard = () => {
    const record = createCustomCardRecord(store);
    setEditing(record);
    setNotice("New card draft ready.");
  };

  const createLeader = () => {
    const record = createCustomLeaderRecord(store);
    setEditing(record);
    setNotice("New leader draft ready.");
  };

  const saveRecord = (draft: boolean) => {
    const updated = { ...editing, draft, updatedAt: new Date().toISOString() } as CustomCatalogRecord;
    const context = buildCardStudioValidationContext(store, updated.recordId);
    const result =
      recordKind(updated) === "card"
        ? validateCustomCardRecord(updated as CustomCardRecord, context)
        : validateCustomLeaderRecord(updated as CustomLeaderRecord, context);
    if (!result.structurallyValid || (!draft && !result.playable)) {
      setNotice(draft ? "Resolve structural errors before saving." : "Record is not playable yet.");
      setToastMessage(draft ? "Resolve structural errors before saving." : "Record is not playable yet.");
      return;
    }

    const cards =
      recordKind(updated) === "card"
        ? [...store.cards.filter((record) => record.recordId !== updated.recordId), updated as CustomCardRecord]
        : store.cards;
    const leaders =
      recordKind(updated) === "leader"
        ? [...store.leaders.filter((record) => record.recordId !== updated.recordId), updated as CustomLeaderRecord]
        : store.leaders;
    updateStore(
      {
        schemaVersion: "custom-catalog-v1",
        cards,
        leaders,
        activeRecordId: updated.recordId,
      },
      draft ? "saved draft" : "saved playable",
    );
    setEditing(updated);
  };

  const duplicateRecord = () => {
    const duplicate = duplicateCustomRecord(editing, store);
    const nextStore =
      recordKind(duplicate) === "card"
        ? { ...store, cards: [...store.cards, duplicate as CustomCardRecord], activeRecordId: duplicate.recordId }
        : { ...store, leaders: [...store.leaders, duplicate as CustomLeaderRecord], activeRecordId: duplicate.recordId };
    updateStore(nextStore, `Duplicated as ${duplicate.source.name}.`);
    setEditing(duplicate);
  };

  const deleteRecord = () => {
    const applyDelete = () => {
      const nextCards = store.cards.filter((record) => record.recordId !== editing.recordId);
      const nextLeaders = store.leaders.filter((record) => record.recordId !== editing.recordId);
      if (references > 0) {
        onDecksChange(removeCustomSourceFromDecks(decks, editing.source.sourceId), undefined);
      }
      const nextStore = {
        schemaVersion: "custom-catalog-v1" as const,
        cards: nextCards,
        leaders: nextLeaders,
        activeRecordId: nextCards[0]?.recordId ?? nextLeaders[0]?.recordId,
      };
      updateStore(nextStore, "deleted");
      setEditing(firstRecord(nextStore));
    };

    if (references > 0) {
      setPendingConfirmation({
        title: `Delete ${editing.source.name}?`,
        body: `This custom source is referenced ${references} time${references === 1 ? "" : "s"} in local decks. Confirming removes those references from browser-local decks.`,
        confirmLabel: "delete",
        onConfirm: applyDelete,
      });
      return;
    }
    applyDelete();
  };

  const resetEditing = () => {
    setEditing(savedRecord ?? firstRecord(store));
  };

  const importJson = () => {
    const result = parseCardStudioImport(importText, store);
    if (!result.ok) {
      setImportErrors(result.errors);
      return;
    }
    const nextStore = appendImportedCustomRecords(store, result);
    updateStore(nextStore, result.notices.length > 0 ? result.notices.join(" ") : "imported");
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

  const readImageFile: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    const file = event.currentTarget.files?.[0];
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setNotice("Use PNG, JPEG, or WebP images.");
      return;
    }
    if (file.size > CARD_STUDIO_MAX_IMAGE_BYTES) {
      setNotice("Image is over the 1 MB browser-storage limit.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const image = String(reader.result ?? "");
      if (kind === "card") {
        setEditing((current) =>
          withUpdatedCardSource(current as CustomCardRecord, (source) => ({ ...source, image })) satisfies CustomCatalogRecord,
        );
      } else {
        setEditing((current) =>
          withUpdatedLeaderSource(current as CustomLeaderRecord, (source) => ({ ...source, image })) satisfies CustomCatalogRecord,
        );
      }
      setEditing((current) => ({ ...current, imageMode: "data_url" }) as CustomCatalogRecord);
      setNotice("Image stored as browser-local data URL. Export this custom catalog for backup.");
    };
    reader.readAsDataURL(file);
  };

  const copySelected = async () => {
    if (!navigator.clipboard) return;
    await navigator.clipboard.writeText(stringifyCardStudioRecordExport(editing));
    setToastMessage("copied selected JSON");
  };

  const copyAll = async () => {
    if (!navigator.clipboard) return;
    await navigator.clipboard.writeText(stringifyCardStudioBundleExport(store));
    setToastMessage("copied custom catalog JSON");
  };

  const updateName = (name: string) => {
    if (kind === "card") {
      setEditing((current) =>
        withUpdatedCardSource(current as CustomCardRecord, (source) => ({
          ...source,
          name,
          sourceId: isSavedRecord ? source.sourceId : sourceIdFromName(name, "card"),
        })) satisfies CustomCatalogRecord,
      );
      return;
    }
    setEditing((current) =>
      withUpdatedLeaderSource(current as CustomLeaderRecord, (source) => ({
        ...source,
        name,
        sourceId: isSavedRecord ? source.sourceId : sourceIdFromName(name, "leader"),
      })) satisfies CustomCatalogRecord,
    );
  };

  const renderCardEditor = (record: CustomCardRecord) => (
    <>
      <div className="authentic-card-studio__field-grid">
        <label>
          <span>name</span>
          <input value={record.source.name} onChange={(event) => updateName(event.target.value)} />
        </label>
        <label>
          <span>source id</span>
          <input
            value={record.source.sourceId}
            disabled={isSavedRecord}
            onChange={(event) =>
              setEditing(withUpdatedCardSource(record, (source) => ({ ...source, sourceId: normalizeCustomSourceId(event.target.value, "card") })))
            }
          />
        </label>
        <Listbox
          label="faction"
          value={record.source.faction}
          onChange={(value) => setEditing(withUpdatedCardSource(record, (source) => ({ ...source, faction: value as CatalogFaction })))}
          options={CATALOG_FACTIONS.map((faction) => ({ value: faction, label: getFactionDisplay(faction).name }))}
        />
        <Listbox
          label="kind"
          value={record.source.kind}
          onChange={(value) => {
            const kind = value as CatalogCardKind;
            setEditing(
              withUpdatedCardSource(record, (source) => ({
                ...source,
                kind,
                strength: kind === "special" ? 0 : Math.max(1, source.strength),
                rows: kind === "special" ? [] : source.rows.length > 0 ? source.rows : ["close"],
                deckLimit: kind === "hero" ? 1 : source.deckLimit,
              })),
            );
          }}
          options={CATALOG_CARD_KINDS.map((cardKind) => ({ value: cardKind, label: cardKind }))}
        />
        <label>
          <span>strength</span>
          <input
            type="number"
            min={0}
            value={record.source.strength}
            disabled={record.source.kind === "special"}
            onChange={(event) =>
              setEditing(withUpdatedCardSource(record, (source) => ({ ...source, strength: Math.max(0, Number(event.target.value) || 0) })))
            }
          />
        </label>
        <label>
          <span>deck limit</span>
          <input
            type="number"
            min={1}
            value={record.source.deckLimit}
            onChange={(event) =>
              setEditing(withUpdatedCardSource(record, (source) => ({ ...source, deckLimit: Math.max(1, Number(event.target.value) || 1) })))
            }
          />
        </label>
      </div>

      <div className="authentic-card-studio__row">
        <span>rows</span>
        {CATALOG_ROWS.map((row) => {
          const checked = record.source.rows.includes(row);
          return (
            <label key={row} className="authentic-card-studio__check">
              <input
                type="checkbox"
                disabled={record.source.kind === "special"}
                checked={checked}
                onChange={() =>
                  setEditing(
                    withUpdatedCardSource(record, (source) => ({
                      ...source,
                      rows: checked ? source.rows.filter((entry) => entry !== row) : [...source.rows, row],
                    })),
                  )
                }
              />
              {row}
            </label>
          );
        })}
      </div>

      <div className="authentic-card-studio__ability-grid">
        {Object.values(CATALOG_ABILITY_METADATA).map((ability) => {
          const checked = record.source.abilities.includes(ability.id);
          return (
            <label key={ability.id} className="authentic-card-studio__check">
              <input
                type="checkbox"
                checked={checked}
                onChange={() =>
                  setEditing(
                    withUpdatedCardSource(record, (source) => {
                      if (ability.id === "none") {
                        return { ...source, abilities: ["none"] };
                      }
                      const withoutNone = source.abilities.filter((entry) => entry !== "none");
                      return {
                        ...source,
                        abilities: checked
                          ? withoutNone.filter((entry) => entry !== ability.id)
                          : [...withoutNone, ability.id as CatalogAbilityId],
                      };
                    }),
                  )
                }
              />
              {ability.name} · {ability.status}
            </label>
          );
        })}
      </div>

      <label>
        <span>tags</span>
        <input
          value={record.source.tags.join(", ")}
          onChange={(event) =>
            setEditing(
              withUpdatedCardSource(record, (source) => ({
                ...source,
                tags: event.target.value.split(",").map((tag) => tag.trim()).filter(Boolean),
              })),
            )
          }
        />
      </label>
      <label>
        <span>linked source ids</span>
        <input
          value={record.source.linkedSourceIds?.join(", ") ?? ""}
          onChange={(event) =>
            setEditing(
              withUpdatedCardSource(record, (source) => ({
                ...source,
                linkedSourceIds: event.target.value.split(",").map((entry) => entry.trim()).filter(Boolean),
              })),
            )
          }
        />
      </label>
      <label>
        <span>description</span>
        <textarea
          value={record.source.description ?? ""}
          onChange={(event) => setEditing(withUpdatedCardSource(record, (source) => ({ ...source, description: event.target.value })))}
        />
      </label>
    </>
  );

  const renderLeaderEditor = (record: CustomLeaderRecord) => (
    <>
      <div className="authentic-card-studio__field-grid">
        <label>
          <span>name</span>
          <input value={record.source.name} onChange={(event) => updateName(event.target.value)} />
        </label>
        <label>
          <span>source id</span>
          <input
            value={record.source.sourceId}
            disabled={isSavedRecord}
            onChange={(event) =>
              setEditing(withUpdatedLeaderSource(record, (source) => ({ ...source, sourceId: normalizeCustomSourceId(event.target.value, "leader") })))
            }
          />
        </label>
        <Listbox
          label="faction"
          value={record.source.faction}
          onChange={(value) => setEditing(withUpdatedLeaderSource(record, (source) => ({ ...source, faction: value as Exclude<CatalogFaction, "neutral"> })))}
          options={nonNeutralFactions.map((faction) => ({ value: faction, label: getFactionDisplay(faction).name }))}
        />
        <Listbox
          label="leader ability"
          value={record.source.ability}
          onChange={(value) =>
            setEditing(withUpdatedLeaderSource(record, (source) => ({ ...source, ability: value as CatalogLeaderAbilityId })))
          }
          options={Object.values(CATALOG_LEADER_ABILITY_METADATA).map((ability) => ({
            value: ability.id,
            label: ability.name,
            meta: ability.status,
          }))}
        />
      </div>
      <label>
        <span>description</span>
        <textarea
          value={record.source.description ?? ""}
          onChange={(event) => setEditing(withUpdatedLeaderSource(record, (source) => ({ ...source, description: event.target.value })))}
        />
      </label>
    </>
  );

  return (
    <main className="gwent-authentic gwent-authentic--card-studio" data-testid="authentic-card-studio">
      <div className="authentic-card-studio">
        <header className="authentic-card-studio__topbar">
          <div className="authentic-card-studio__title">
            <button type="button" className="authentic-button authentic-button--ghost" onClick={onExit}>← back</button>
            <h1>Card Studio</h1>
          </div>
          <div className="authentic-card-studio__actions">
            <button type="button" className="authentic-button authentic-button--secondary" onClick={createCard}>new card</button>
            <button type="button" className="authentic-button authentic-button--secondary" onClick={createLeader}>new leader</button>
            <button type="button" className="authentic-button authentic-button--secondary" onClick={() => setImportOpen(true)}>import</button>
            <button type="button" className="authentic-button authentic-button--secondary" onClick={() => downloadJson(customRecordFileName(editing), stringifyCardStudioRecordExport(editing))}>export</button>
            <button type="button" className="authentic-button authentic-button--secondary" onClick={() => downloadJson("custom-catalog.json", stringifyCardStudioBundleExport(store))}>export all</button>
            <button type="button" className="authentic-button authentic-button--secondary" onClick={copySelected} disabled={!navigator.clipboard}>copy</button>
            <button type="button" className="authentic-button authentic-button--secondary" onClick={copyAll} disabled={!navigator.clipboard}>copy all</button>
          </div>
        </header>

        <div className="authentic-card-studio__body">
          <aside className="authentic-card-studio__library authentic-scroll-fade-y">
            <div className="authentic-card-studio__label">library · {store.cards.length} cards · {store.leaders.length} leaders</div>
            <div className="authentic-card-studio__filters">
              {(["all", "cards", "leaders", "drafts", "playable"] as const).map((nextFilter) => (
                <button
                  key={nextFilter}
                  type="button"
                  className={`authentic-button authentic-button--choice authentic-button--compact${filter === nextFilter ? " is-selected" : ""}`}
                  onClick={() => setFilter(nextFilter)}
                >
                  {nextFilter}
                </button>
              ))}
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="search custom content" />
            </div>
            <div className="authentic-card-studio__record-list">
              {filteredRecords.length === 0 ? <p>No custom records yet.</p> : null}
              {filteredRecords.map((record) => (
                <button
                  key={record.recordId}
                  type="button"
                  className={`authentic-button authentic-button--tile authentic-card-studio__record${record.recordId === editing.recordId ? " is-selected" : ""}`}
                  onClick={() => selectRecord(record)}
                >
                  <strong>{record.source.name}</strong>
                  <span>{record.source.sourceId}</span>
                  <em>{recordKind(record)} · {record.draft ? "draft" : "playable"}</em>
                </button>
              ))}
            </div>
          </aside>

          <section className="authentic-card-studio__editor authentic-scroll-fade-y">
            <div className="authentic-card-studio__editor-actions">
              <button type="button" className="authentic-button authentic-button--secondary" onClick={duplicateRecord} disabled={!isSavedRecord}>duplicate</button>
              <button type="button" className="authentic-button authentic-button--destructive" onClick={deleteRecord} disabled={!isSavedRecord}>delete</button>
              <button type="button" className="authentic-button authentic-button--ghost" onClick={resetEditing}>reset</button>
              <button type="button" className="authentic-button authentic-button--secondary" onClick={() => saveRecord(true)}>save draft</button>
              <button type="button" className="authentic-button authentic-button--primary" onClick={() => saveRecord(false)}>save playable</button>
            </div>
            {kind === "card" ? renderCardEditor(editing as CustomCardRecord) : renderLeaderEditor(editing as CustomLeaderRecord)}
            <div className="authentic-card-studio__image-box">
              <Listbox
                label="image mode"
                value={editing.imageMode}
                onChange={(value) => setEditing((current) => ({ ...current, imageMode: value as "path" | "data_url" }) as CustomCatalogRecord)}
                options={[
                  { value: "path", label: "path" },
                  { value: "data_url", label: "upload" },
                ]}
              />
              <label>
                <span>image path or data url</span>
                <input
                  ref={imageInputRef}
                  value={editing.source.image}
                  onChange={(event) => {
                    const image = event.target.value;
                    if (kind === "card") {
                      setEditing(withUpdatedCardSource(editing as CustomCardRecord, (source) => ({ ...source, image })));
                    } else {
                      setEditing(withUpdatedLeaderSource(editing as CustomLeaderRecord, (source) => ({ ...source, image })));
                    }
                  }}
                />
              </label>
              <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={readImageFile} />
              <button type="button" className="authentic-button authentic-button--secondary" onClick={() => fileInputRef.current?.click()}>
                upload image
              </button>
              <p>Permanent images belong under public/images/custom/. Uploads are browser-storage data URLs and should be exported for backup.</p>
            </div>
          </section>

          <aside className="authentic-card-studio__preview authentic-scroll-fade-y">
            <div className="authentic-card-studio__preview-card">
              {kind === "card" ? (
                <AuthenticCard card={fromCatalogCard((editing as CustomCardRecord).source)} size="lg" />
              ) : (
                <AuthenticLeaderCard
                  leader={{
                    sourceId: (editing as CustomLeaderRecord).source.sourceId,
                    name: editing.source.name,
                    faction: editing.source.faction,
                    abilityName: getLeaderAbilityDisplay((editing as CustomLeaderRecord).source.ability).name,
                    image: editing.source.image,
                  }}
                  size="large"
                />
              )}
            </div>
            <Alert
              severity={validation.playable ? "success" : validation.structurallyValid ? "warn" : "error"}
              variant="ledger"
              className="authentic-alert--compact"
              eyebrow="playability"
              title={validation.playable ? "Playable custom source." : validation.structurallyValid ? "Draft-safe only." : "Resolve errors before saving."}
              body={
                <ul className="authentic-card-studio__issues">
                  {validation.issues.length === 0 ? <li>No validation issues.</li> : null}
                  {validation.issues.map((issue) => (
                    <li key={`${issue.code}-${issue.field}-${issue.message}`} className={`is-${issue.severity}`}>
                      {issue.severity}: {issue.message}
                    </li>
                  ))}
                  {references > 0 ? <li className="is-warning">Referenced {references} time{references === 1 ? "" : "s"} in local decks.</li> : null}
                </ul>
              }
              testId="authentic-card-studio-validation"
            />
            {notice ? (
              <Alert
                severity="info"
                variant="ledger"
                className="authentic-alert--compact"
                eyebrow="storage"
                title={notice}
                testId="authentic-card-studio-notice"
              />
            ) : null}
          </aside>
        </div>
      </div>

      {importOpen ? (
        <div className="authentic-card-studio__modal" role="dialog" aria-modal="true">
          <div className="authentic-card-studio__modal-box">
            <h2>Import Custom Catalog JSON</h2>
            <textarea value={importText} onChange={(event) => setImportText(event.target.value)} />
            <input ref={importFileRef} type="file" accept="application/json,.json" hidden onChange={readImportFile} />
            {importErrors.length > 0 ? (
              <Alert
                severity="error"
                variant="ledger"
                className="authentic-alert--compact"
                eyebrow="import failed"
                title="Custom catalog JSON cannot be imported."
                body={<ul>{importErrors.map((error) => <li key={error}>{error}</li>)}</ul>}
                testId="authentic-card-studio-import-errors"
              />
            ) : null}
            <div>
              <button type="button" className="authentic-button authentic-button--secondary" onClick={() => importFileRef.current?.click()}>upload file...</button>
              <button type="button" className="authentic-button authentic-button--ghost" onClick={() => setImportOpen(false)}>cancel</button>
              <button type="button" className="authentic-button authentic-button--primary" onClick={importJson}>import</button>
            </div>
          </div>
        </div>
      ) : null}

      {pendingConfirmation ? (
        <div className="authentic-card-studio__modal" role="dialog" aria-modal="true">
          <Alert
            severity="confirm"
            variant="ledger"
            eyebrow="confirm"
            title={pendingConfirmation.title}
            body={<p>{pendingConfirmation.body}</p>}
            actions={[
              { label: "cancel", kind: "ghost", onClick: () => setPendingConfirmation(null) },
              {
                label: pendingConfirmation.confirmLabel,
                kind: "destructive",
                testId: "authentic-card-studio-confirm-delete",
                onClick: () => {
                  pendingConfirmation.onConfirm();
                  setPendingConfirmation(null);
                },
              },
            ]}
            testId="authentic-card-studio-confirmation"
          />
        </div>
      ) : null}
      <Toast open={Boolean(toastMessage)} message={toastMessage ?? ""} onDismiss={() => setToastMessage(null)} />
    </main>
  );
};

export default AuthenticCardStudioScreen;
