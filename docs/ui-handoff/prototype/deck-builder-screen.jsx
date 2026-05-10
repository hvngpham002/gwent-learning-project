// deck-builder-screen.jsx — Deck Builder with Import / Export / Save / Load.
const { useState: useStateD, useRef: useRefD } = React;

// Card pool — drawn from legacy-era northern-realms source naming
const CARD_POOL = [
  // NR Heroes
  { id: 'nr_philippa', name: 'Philippa Eilhart', faction: 'northern_realms', strength: 10, type: 'hero', ability: 'none', row: 'ranged', max: 1 },
  { id: 'nr_vernon', name: 'Vernon Roche', faction: 'northern_realms', strength: 10, type: 'hero', ability: 'none', row: 'close', max: 1 },
  { id: 'nr_natalis', name: 'John Natalis', faction: 'northern_realms', strength: 10, type: 'hero', ability: 'morale_boost', row: 'close', max: 1 },
  { id: 'nr_esterad', name: 'Esterad Thyssen', faction: 'northern_realms', strength: 10, type: 'hero', ability: 'none', row: 'ranged', max: 1 },
  // Neutral heroes
  { id: 'n_geralt', name: 'Geralt of Rivia', faction: 'neutral', strength: 15, type: 'hero', ability: 'none', row: 'close', max: 1 },
  { id: 'n_triss', name: 'Triss Merigold', faction: 'neutral', strength: 7, type: 'hero', ability: 'none', row: 'close', max: 1 },
  { id: 'n_elf', name: 'Mysterious Elf', faction: 'neutral', strength: 0, type: 'hero', ability: 'none', row: 'ranged', max: 1 },
  // NR Units
  { id: 'nr_dijkstra', name: 'Sigismund Dijkstra', faction: 'northern_realms', strength: 4, type: 'unit', ability: 'spy', row: 'close', max: 1 },
  { id: 'nr_thaler', name: 'Thaler', faction: 'northern_realms', strength: 1, type: 'unit', ability: 'spy', row: 'siege', max: 1 },
  { id: 'nr_stennis', name: 'Prince Stennis', faction: 'northern_realms', strength: 5, type: 'unit', ability: 'spy', row: 'close', max: 1 },
  { id: 'nr_blue', name: 'Blue Stripes Commando', faction: 'northern_realms', strength: 4, type: 'unit', ability: 'tight_bond', row: 'close', max: 3 },
  { id: 'nr_crinfrid', name: 'Crinfrid Reavers', faction: 'northern_realms', strength: 5, type: 'unit', ability: 'tight_bond', row: 'ranged', max: 3 },
  { id: 'nr_medic', name: 'Dun Banner Medic', faction: 'northern_realms', strength: 2, type: 'unit', ability: 'medic', row: 'siege', max: 5 },
  { id: 'nr_cat', name: 'Catapult', faction: 'northern_realms', strength: 8, type: 'unit', ability: 'tight_bond', row: 'siege', max: 2 },
  { id: 'nr_poor', name: 'Poor F. Infantry', faction: 'northern_realms', strength: 1, type: 'unit', ability: 'muster', row: 'close', max: 3 },
  // Neutral units
  { id: 'n_villen', name: 'Villentretenmerth', faction: 'neutral', strength: 7, type: 'unit', ability: 'scorch', row: 'close', max: 1 },
  { id: 'n_olgierd', name: 'Olgierd von Everec', faction: 'neutral', strength: 6, type: 'unit', ability: 'morale_boost', row: 'close', max: 1 },
  { id: 'n_gaunter', name: "Gaunter O'Dimm", faction: 'neutral', strength: 4, type: 'unit', ability: 'none', row: 'close', max: 1 },
  // Specials & weather
  { id: 'sp_decoy', name: 'Decoy', faction: 'neutral', strength: 0, type: 'special', ability: 'decoy', max: 3 },
  { id: 'sp_horn', name: "Commander's Horn", faction: 'neutral', strength: 0, type: 'special', ability: 'commanders_horn', max: 3 },
  { id: 'sp_scorch', name: 'Scorch', faction: 'neutral', strength: 0, type: 'special', ability: 'scorch', max: 3 },
  { id: 'sp_frost', name: 'Biting Frost', faction: 'neutral', strength: 0, type: 'weather', ability: 'frost', max: 3 },
  { id: 'sp_fog', name: 'Impenetrable Fog', faction: 'neutral', strength: 0, type: 'weather', ability: 'fog', max: 3 },
  { id: 'sp_rain', name: 'Torrential Rain', faction: 'neutral', strength: 0, type: 'weather', ability: 'rain', max: 3 },
  { id: 'sp_clear', name: 'Clear Weather', faction: 'neutral', strength: 0, type: 'weather', ability: 'clear_weather', max: 3 },
];

const LEADERS_NR = [
  { id: 'nr_l1', name: 'Foltest: King of Temeria', ability: 'play_fog', desc: 'Play an Impenetrable Fog from your deck.' },
  { id: 'nr_l2', name: 'Foltest: Lord Commander of The North', ability: 'clear_weather', desc: 'Clear all weather effects in play.' },
  { id: 'nr_l3', name: 'Foltest: The Siegemaster', ability: 'double_siege', desc: 'Doubles strength of all your Siege units.' },
];

const STORAGE_KEY = 'gwent_decks_v1';

function loadSavedDecks() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || defaultDecks(); }
  catch { return defaultDecks(); }
}
function saveDecks(d) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); } catch {} }
function defaultDecks() {
  return [
    { id: 'd_default', name: 'Foltest Tight-Bond Standard', faction: 'northern_realms', leader: 'nr_l2', cards: {
      nr_philippa: 1, nr_vernon: 1, nr_esterad: 1, n_geralt: 1, n_triss: 1, n_elf: 1,
      nr_dijkstra: 1, nr_thaler: 1, nr_stennis: 1,
      nr_medic: 5, nr_blue: 3, nr_crinfrid: 3, nr_cat: 2,
      sp_decoy: 2, sp_horn: 2, sp_scorch: 2, sp_frost: 1, sp_fog: 1,
      n_villen: 1, n_olgierd: 1,
    }},
  ];
}

function DeckBuilderScreen({ onExit, onPlay }) {
  const [decks, setDecks] = useStateD(loadSavedDecks);
  const [activeDeckId, setActiveDeckId] = useStateD(decks[0]?.id);
  const [importOpen, setImportOpen] = useStateD(false);
  const [importText, setImportText] = useStateD('');
  const [importError, setImportError] = useStateD(null);
  const [filter, setFilter] = useStateD('all');
  const [renaming, setRenaming] = useStateD(false);
  const fileInputRef = useRefD(null);

  const deck = decks.find(d => d.id === activeDeckId) || decks[0];
  function updateDeck(updater) {
    setDecks(prev => {
      const next = prev.map(d => d.id === deck.id ? updater(d) : d);
      saveDecks(next);
      return next;
    });
  }

  // Compute stats
  const cardEntries = Object.entries(deck.cards).map(([id, count]) => ({ ...CARD_POOL.find(c => c.id === id), count })).filter(c => c.id);
  const totalUnits = cardEntries.filter(c => c.type === 'unit' || c.type === 'hero').reduce((s, c) => s + c.count, 0);
  const totalSpecials = cardEntries.filter(c => c.type === 'special' || c.type === 'weather').reduce((s, c) => s + c.count, 0);
  const totalHeroes = cardEntries.filter(c => c.type === 'hero').reduce((s, c) => s + c.count, 0);
  const totalStrength = cardEntries.reduce((s, c) => s + (c.strength || 0) * c.count, 0);
  const valid = totalUnits >= 22 && totalSpecials <= 10;

  function addCard(id) {
    const c = CARD_POOL.find(x => x.id === id);
    const cur = deck.cards[id] || 0;
    if (cur >= c.max) return;
    updateDeck(d => ({ ...d, cards: { ...d.cards, [id]: cur + 1 } }));
  }
  function removeCard(id) {
    const cur = deck.cards[id] || 0;
    if (cur <= 0) return;
    const next = { ...deck.cards };
    if (cur - 1 === 0) delete next[id]; else next[id] = cur - 1;
    updateDeck(d => ({ ...d, cards: next }));
  }
  function newDeck() {
    const id = 'd_' + Date.now();
    const newD = { id, name: 'New Deck', faction: 'northern_realms', leader: 'nr_l2', cards: {} };
    setDecks(prev => { const n = [...prev, newD]; saveDecks(n); return n; });
    setActiveDeckId(id);
    setRenaming(true);
  }
  function deleteDeck() {
    if (decks.length <= 1) return;
    setDecks(prev => { const n = prev.filter(d => d.id !== deck.id); saveDecks(n); setActiveDeckId(n[0].id); return n; });
  }
  function exportDeck() {
    const blob = new Blob([JSON.stringify(deck, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${deck.name.replace(/\s+/g,'_')}.gwent.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
  function exportClipboard() {
    navigator.clipboard?.writeText(JSON.stringify(deck, null, 2));
  }
  function importDeck() {
    setImportError(null);
    try {
      const parsed = JSON.parse(importText);
      if (!parsed.cards || !parsed.faction) throw new Error('Missing required fields: cards, faction');
      const id = 'd_' + Date.now();
      const newD = { ...parsed, id };
      setDecks(prev => { const n = [...prev, newD]; saveDecks(n); return n; });
      setActiveDeckId(id);
      setImportOpen(false);
      setImportText('');
    } catch (e) {
      setImportError(e.message);
    }
  }
  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => { setImportText(ev.target.result); };
    reader.readAsText(file);
  }

  // Filtered pool
  const pool = CARD_POOL.filter(c => {
    if (filter === 'units') return c.type === 'unit';
    if (filter === 'heroes') return c.type === 'hero';
    if (filter === 'specials') return c.type === 'special' || c.type === 'weather';
    return true;
  });

  return (
    <div className="dir-a" style={{ width: 1200, height: 780, background: 'var(--bg)', display: 'grid', gridTemplateRows: 'auto 1fr', overflow: 'hidden' }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 18px', borderBottom: '2px solid var(--rule-strong)', background: 'var(--bg-paper)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button onClick={onExit} style={{ background: 'transparent', border: '1px solid var(--rule-strong)', padding: '4px 10px', borderRadius: 3, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-2)', cursor: 'pointer' }}>← back</button>
          <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 18, fontWeight: 600, color: 'var(--ink)' }}>Deck Builder</div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={newDeck} style={btnGhost}>＋ New</button>
          <button onClick={() => setImportOpen(true)} style={btnGhost}>↓ Import</button>
          <button onClick={exportDeck} style={btnGhost}>↑ Export .json</button>
          <button onClick={exportClipboard} style={btnGhost}>📋 Copy</button>
          <button onClick={() => { saveDecks(decks); }} style={btnPrimary}>Save</button>
          <button onClick={() => onPlay(deck)} disabled={!valid} style={{ ...btnPrimary, opacity: valid ? 1 : 0.5, cursor: valid ? 'pointer' : 'not-allowed' }}>Play →</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr 320px', overflow: 'hidden' }}>
        {/* Decks list */}
        <div style={{ borderRight: '2px solid var(--rule-strong)', background: 'var(--bg-2)', padding: 12, overflow: 'auto' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>your decks · {decks.length}</div>
          {decks.map(d => (
            <div key={d.id} onClick={() => setActiveDeckId(d.id)}
                 style={{ padding: '8px 10px', borderRadius: 3, marginBottom: 4, background: d.id === activeDeckId ? 'rgba(138,58,31,0.14)' : 'transparent', border: `1px solid ${d.id === activeDeckId ? 'var(--accent)' : 'var(--rule)'}`, cursor: 'pointer' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, color: 'var(--ink)' }}>{d.name}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-3)' }}>{d.faction.replace('_',' ')} · {Object.values(d.cards || {}).reduce((a,b)=>a+b,0)} cards</div>
            </div>
          ))}
          {decks.length > 1 && <button onClick={deleteDeck} style={{ ...btnGhost, width: '100%', marginTop: 12, color: '#7a3a3a' }}>🗑 delete current</button>}
        </div>

        {/* Card pool */}
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg-paper)' }}>
          <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--rule)', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
            <div>
              {renaming ? (
                <input autoFocus value={deck.name} onChange={e => updateDeck(d => ({ ...d, name: e.target.value }))} onBlur={() => setRenaming(false)} onKeyDown={e => e.key === 'Enter' && setRenaming(false)} style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, fontStyle: 'italic', background: 'transparent', border: 'none', borderBottom: '1px solid var(--accent)', color: 'var(--ink)', outline: 'none', padding: 0 }}/>
              ) : (
                <div onClick={() => setRenaming(true)} style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, fontStyle: 'italic', color: 'var(--ink)', cursor: 'text' }}>{deck.name} <span style={{ fontSize: 11, color: 'var(--ink-3)', fontStyle: 'normal' }}>✎</span></div>
              )}
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-3)' }}>{deck.faction.replace('_',' ')} · leader: {LEADERS_NR.find(l => l.id === deck.leader)?.name || '—'}</div>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {['all','heroes','units','specials'].map(f => (
                <button key={f} onClick={() => setFilter(f)} style={{ ...btnGhost, background: filter === f ? 'rgba(138,58,31,0.14)' : 'transparent', borderColor: filter === f ? 'var(--accent)' : 'var(--rule-strong)' }}>{f}</button>
              ))}
            </div>
          </div>
          <div style={{ padding: 12, overflow: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8, alignContent: 'start' }}>
            {pool.map(c => {
              const inDeck = deck.cards[c.id] || 0;
              const atMax = inDeck >= c.max;
              return (
                <div key={c.id} style={{ position: 'relative' }}>
                  <div onClick={() => addCard(c.id)} style={{ cursor: atMax ? 'not-allowed' : 'pointer', opacity: atMax ? 0.4 : 1, transition: 'transform .15s' }}
                       onMouseOver={e => !atMax && (e.currentTarget.style.transform = 'translateY(-3px)')}
                       onMouseOut={e => e.currentTarget.style.transform = ''}>
                    <GameCard card={c} size="md" theme="a"/>
                  </div>
                  {inDeck > 0 && (
                    <div style={{ position: 'absolute', top: -6, right: -6, width: 24, height: 24, borderRadius: '50%', background: 'var(--accent)', color: '#f0e2c0', fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700, display: 'grid', placeItems: 'center', border: '1px solid #4a1a08' }}>
                      {inDeck}/{c.max}
                    </div>
                  )}
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--ink-3)', textAlign: 'center', marginTop: 3 }}>{c.name.length > 14 ? c.name.slice(0,14)+'…' : c.name}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Stats panel */}
        <div style={{ borderLeft: '2px solid var(--rule-strong)', background: 'var(--bg-2)', padding: 14, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>deck composition</div>
            <div style={{ marginTop: 8, fontFamily: 'var(--font-display)', fontSize: 13, color: 'var(--ink)', display: 'grid', gridTemplateColumns: '1fr auto', rowGap: 4, columnGap: 8 }}>
              <span>Total units</span><b style={{ color: totalUnits >= 22 ? 'var(--ink)' : 'var(--accent)' }}>{totalUnits}<span style={{ color: 'var(--ink-3)', fontWeight: 400 }}> / 22 min</span></b>
              <span>Specials</span><b style={{ color: totalSpecials <= 10 ? 'var(--ink)' : 'var(--accent)' }}>{totalSpecials}<span style={{ color: 'var(--ink-3)', fontWeight: 400 }}> / 10 max</span></b>
              <span>Heroes</span><b>{totalHeroes}</b>
              <span>Total strength</span><b>{totalStrength}</b>
            </div>
            {!valid && (
              <div style={{ marginTop: 10, padding: 8, background: 'rgba(138,58,31,0.10)', border: '1px solid var(--accent)', borderRadius: 3, fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 11, color: 'var(--accent)' }}>
                Deck not valid: {totalUnits < 22 && `need ${22-totalUnits} more units. `}{totalSpecials > 10 && `${totalSpecials - 10} too many specials.`}
              </div>
            )}
          </div>

          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>leader</div>
            <select value={deck.leader} onChange={e => updateDeck(d => ({ ...d, leader: e.target.value }))} style={{ width: '100%', marginTop: 6, padding: '6px 8px', fontFamily: 'var(--font-display)', fontSize: 13, background: 'var(--bg-paper)', border: '1px solid var(--rule-strong)', borderRadius: 3, color: 'var(--ink)' }}>
              {LEADERS_NR.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
            <div style={{ marginTop: 6, fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 11, color: 'var(--ink-2)', lineHeight: 1.4 }}>{LEADERS_NR.find(l => l.id === deck.leader)?.desc}</div>
          </div>

          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>cards in deck</div>
            <div style={{ marginTop: 6, maxHeight: 380, overflow: 'auto', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
              {cardEntries.length === 0 && <span style={{ color: 'var(--ink-3)', fontStyle: 'italic' }}>(empty)</span>}
              {cardEntries.sort((a,b) => (b.strength||0) - (a.strength||0)).map(c => (
                <div key={c.id} style={{ display: 'grid', gridTemplateColumns: '24px 1fr auto auto', alignItems: 'center', gap: 4, padding: '3px 0', borderBottom: '1px dotted var(--rule)' }}>
                  <span style={{ color: c.type === 'hero' ? 'var(--gold)' : c.strength ? 'var(--ink-2)' : 'var(--ink-3)', textAlign: 'right' }}>{c.strength || '·'}</span>
                  <span style={{ color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                  <span style={{ color: 'var(--accent)' }}>×{c.count}</span>
                  <button onClick={() => removeCard(c.id)} style={{ background: 'transparent', border: 'none', color: 'var(--ink-3)', cursor: 'pointer', padding: '0 4px' }}>−</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Import modal */}
      {importOpen && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(31,26,18,0.65)', display: 'grid', placeItems: 'center', zIndex: 80 }}>
          <div style={{ background: 'var(--bg-paper)', border: '2px solid var(--rule-strong)', borderRadius: 4, padding: 20, width: 540 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>import deck</div>
            <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 18, color: 'var(--ink)' }}>Paste JSON or upload a .gwent.json file.</div>
            <textarea value={importText} onChange={e => setImportText(e.target.value)} placeholder='{"name": "...", "faction": "northern_realms", "leader": "nr_l2", "cards": {"nr_blue": 3, ...}}' style={{ width: '100%', height: 200, marginTop: 10, padding: 8, fontFamily: 'var(--font-mono)', fontSize: 11, background: '#fffaf0', border: '1px solid var(--rule-strong)', borderRadius: 3, color: 'var(--ink)', resize: 'vertical' }}/>
            <input ref={fileInputRef} type="file" accept=".json,.gwent.json" onChange={handleFile} style={{ display: 'none' }}/>
            {importError && <div style={{ marginTop: 8, color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>error: {importError}</div>}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14 }}>
              <button onClick={() => fileInputRef.current?.click()} style={btnGhost}>upload file…</button>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => setImportOpen(false)} style={btnGhost}>cancel</button>
                <button onClick={importDeck} style={btnPrimary}>import</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const btnGhost = { background: 'transparent', border: '1px solid var(--rule-strong)', padding: '5px 12px', borderRadius: 3, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-2)', cursor: 'pointer' };
const btnPrimary = { background: 'var(--accent)', border: '1px solid #4a1a08', padding: '5px 14px', borderRadius: 3, fontFamily: 'var(--font-display)', fontSize: 12, color: '#f0e2c0', cursor: 'pointer', fontWeight: 600, letterSpacing: '0.04em' };

Object.assign(window, { DeckBuilderScreen, loadSavedDecks });
