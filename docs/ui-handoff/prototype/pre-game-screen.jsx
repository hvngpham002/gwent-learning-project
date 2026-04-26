// pre-game-screen.jsx — choose deck and game mode before match.
const { useState: useStateP } = React;

const GAME_MODES = [
  { id: 'casual', name: 'Casual', desc: 'Practice match versus AI. No ranking.', icon: '☕' },
  { id: 'ranked', name: 'Ranked', desc: 'Climb the ladder. Win streaks affect MMR.', icon: '⚔' },
  { id: 'training', name: 'Training', desc: 'Single round, free mulligans, undo enabled.', icon: '✎' },
  { id: 'seed', name: 'Seed Suite', desc: 'Replay deterministic suite from research lab.', icon: '⚙' },
];

const OPPONENTS = [
  { id: 'eredin', name: 'Eredin', faction: 'monsters', desc: 'Aggressive Muster spammer. ~3 min match.' },
  { id: 'emhyr', name: 'Emhyr var Emreis', faction: 'nilfgaard', desc: 'Tempo spy deck with disruption.' },
  { id: 'foltest', name: 'Foltest mirror', faction: 'northern_realms', desc: 'Tight-bond machine. Toughest matchup.' },
  { id: 'random', name: 'Random opponent', faction: 'neutral', desc: 'Drawn from ladder pool.' },
];

function PreGameScreen({ onExit, onPlay, onDeckBuilder }) {
  const [decks] = useStateP(loadSavedDecks);
  const [selectedDeck, setSelectedDeck] = useStateP(decks[0]?.id);
  const [mode, setMode] = useStateP('casual');
  const [opponent, setOpponent] = useStateP('eredin');
  const [seed, setSeed] = useStateP('');
  const [bestOf, setBestOf] = useStateP(3);

  const deck = decks.find(d => d.id === selectedDeck) || decks[0];
  const cardCount = Object.values(deck?.cards || {}).reduce((a,b) => a+b, 0);
  const valid = !!deck && cardCount >= 22;

  return (
    <div className="dir-a" style={{ width: 1200, height: 780, background: 'var(--bg)', display: 'grid', gridTemplateRows: 'auto 1fr auto', overflow: 'hidden', position: 'relative' }}>
      {/* parchment background flourish */}
      <svg viewBox="0 0 1200 780" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity: 0.06 }}>
        <defs>
          <pattern id="flourish" patternUnits="userSpaceOnUse" width="120" height="120">
            <circle cx="60" cy="60" r="3" fill="#1f1a12"/>
            <path d="M0 60 L120 60 M60 0 L60 120" stroke="#1f1a12" strokeWidth="0.4"/>
          </pattern>
        </defs>
        <rect width="1200" height="780" fill="url(#flourish)"/>
      </svg>

      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 22px', borderBottom: '2px solid var(--rule-strong)', background: 'var(--bg-paper)', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button onClick={onExit} style={btnGhostP}>← menu</button>
          <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 22, fontWeight: 600, color: 'var(--ink)' }}>Prepare for Battle</div>
        </div>
        <button onClick={onDeckBuilder} style={btnGhostP}>open deck builder →</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', overflow: 'auto', padding: 28, gap: 24, position: 'relative' }}>
        {/* LEFT — Deck */}
        <section style={{ background: 'var(--bg-paper)', border: '1px solid var(--rule-strong)', borderRadius: 4, padding: 20, boxShadow: 'var(--shadow)' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>step 1 — choose deck</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}>
            {decks.map(d => {
              const cnt = Object.values(d.cards || {}).reduce((a,b)=>a+b, 0);
              const ok = cnt >= 22;
              const sel = d.id === selectedDeck;
              return (
                <button key={d.id} onClick={() => setSelectedDeck(d.id)}
                        style={{ textAlign: 'left', padding: '12px 14px', background: sel ? 'rgba(138,58,31,0.10)' : 'rgba(31,26,18,0.04)', border: `2px solid ${sel ? 'var(--accent)' : 'var(--rule)'}`, borderRadius: 3, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 50, height: 70, borderRadius: 3, overflow: 'hidden', border: '1px solid #2a1f10', background: '#1a140c', flex: '0 0 auto' }}>
                    <SvgCardArt cardId={`leader_${d.faction}`} faction={d.faction} type="leader" w={50} h={70} theme="a"/>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, fontStyle: 'italic', color: 'var(--ink)' }}>{d.name}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 }}>{d.faction.replace('_',' ')}</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 12, color: ok ? 'var(--ink-2)' : 'var(--accent)', marginTop: 4 }}>
                      {cnt} cards · {ok ? '✓ ready' : 'incomplete'}
                    </div>
                  </div>
                  {sel && <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--accent)' }}>✓</span>}
                </button>
              );
            })}
          </div>
          <button onClick={onDeckBuilder} style={{ ...btnGhostP, width: '100%', marginTop: 14, padding: '8px 14px', fontStyle: 'italic', fontFamily: 'var(--font-display)', fontSize: 13 }}>＋ create or edit a deck…</button>
        </section>

        {/* RIGHT — Mode */}
        <section style={{ background: 'var(--bg-paper)', border: '1px solid var(--rule-strong)', borderRadius: 4, padding: 20, boxShadow: 'var(--shadow)' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>step 2 — game mode</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 14 }}>
            {GAME_MODES.map(m => {
              const sel = m.id === mode;
              return (
                <button key={m.id} onClick={() => setMode(m.id)}
                        style={{ textAlign: 'left', padding: 12, background: sel ? 'rgba(138,58,31,0.10)' : 'rgba(31,26,18,0.04)', border: `2px solid ${sel ? 'var(--accent)' : 'var(--rule)'}`, borderRadius: 3, cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 18 }}>{m.icon}</span>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, color: 'var(--ink)' }}>{m.name}</span>
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 11, color: 'var(--ink-2)', marginTop: 4, lineHeight: 1.4 }}>{m.desc}</div>
                </button>
              );
            })}
          </div>

          <div style={{ marginTop: 18 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>opponent</div>
            <select value={opponent} onChange={e => setOpponent(e.target.value)} style={{ width: '100%', marginTop: 6, padding: '8px 10px', fontFamily: 'var(--font-display)', fontSize: 14, background: 'var(--bg)', border: '1px solid var(--rule-strong)', borderRadius: 3, color: 'var(--ink)' }}>
              {OPPONENTS.map(o => <option key={o.id} value={o.id}>{o.name} ({o.faction.replace('_',' ')})</option>)}
            </select>
            <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 11, color: 'var(--ink-2)', marginTop: 4 }}>{OPPONENTS.find(o => o.id === opponent)?.desc}</div>
          </div>

          <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>format</div>
              <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                {[1,3].map(n => (
                  <button key={n} onClick={() => setBestOf(n)} style={{ flex: 1, padding: '6px 0', background: bestOf === n ? 'rgba(138,58,31,0.10)' : 'transparent', border: `1px solid ${bestOf === n ? 'var(--accent)' : 'var(--rule-strong)'}`, fontFamily: 'var(--font-display)', fontSize: 12, color: 'var(--ink)', cursor: 'pointer', borderRadius: 3 }}>Best of {n}</button>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>seed {mode === 'seed' ? '(required)' : '(optional)'}</div>
              <input value={seed} onChange={e => setSeed(e.target.value)} placeholder="e.g. 8aF3-29-c1" style={{ width: '100%', marginTop: 6, padding: '6px 8px', fontFamily: 'var(--font-mono)', fontSize: 11, background: 'var(--bg)', border: '1px solid var(--rule-strong)', borderRadius: 3, color: 'var(--ink)' }}/>
            </div>
          </div>
        </section>
      </div>

      {/* Bottom action bar */}
      <div style={{ padding: '14px 28px', borderTop: '2px solid var(--rule-strong)', background: 'var(--bg-paper)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', color: 'var(--ink-2)', fontSize: 13 }}>
          {valid ? `${deck.name}  vs  ${OPPONENTS.find(o => o.id === opponent)?.name}  · ${GAME_MODES.find(m => m.id === mode)?.name} (Bo${bestOf})` : 'Pick a complete deck to begin.'}
        </div>
        <button onClick={() => onPlay({ deck, mode, opponent, seed, bestOf })} disabled={!valid}
                style={{ background: valid ? 'var(--accent)' : 'var(--rule)', color: '#f0e2c0', border: '1px solid #4a1a08', padding: '10px 32px', borderRadius: 3, fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: '0.1em', cursor: valid ? 'pointer' : 'not-allowed', opacity: valid ? 1 : 0.5 }}>
          Begin Match →
        </button>
      </div>
    </div>
  );
}

const btnGhostP = { background: 'transparent', border: '1px solid var(--rule-strong)', padding: '5px 12px', borderRadius: 3, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-2)', cursor: 'pointer' };

Object.assign(window, { PreGameScreen });
