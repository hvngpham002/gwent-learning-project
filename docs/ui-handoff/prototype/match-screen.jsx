// match-screen.jsx — Direction A match UI with discard pile, medic, animations.
const { useState, useRef, useEffect, useLayoutEffect } = React;

function makeUid(prefix) { return prefix + '_' + Math.random().toString(36).slice(2, 8); }

function makeInitialMatch() {
  const me = {
    hand: [
      { uid: makeUid('h'), id: 'nr_dijkstra', name: 'Dijkstra', faction: 'northern_realms', strength: 4, type: 'unit', ability: 'spy', row: 'ranged' },
      { uid: makeUid('h'), id: 'sp_scorch', name: 'Scorch', faction: 'neutral', strength: 0, type: 'special', ability: 'scorch' },
      { uid: makeUid('h'), id: 'sp_horn', name: "Cmdr's Horn", faction: 'neutral', strength: 0, type: 'special', ability: 'commanders_horn' },
      { uid: makeUid('h'), id: 'nr_st', name: 'Siege Tower', faction: 'northern_realms', strength: 6, type: 'unit', ability: 'morale_boost', row: 'siege' },
      { uid: makeUid('h'), id: 'sp_decoy', name: 'Decoy', faction: 'neutral', strength: 0, type: 'special', ability: 'decoy' },
      { uid: makeUid('h'), id: 'nr_med', name: 'Dun Banner Medic', faction: 'northern_realms', strength: 2, type: 'unit', ability: 'medic', row: 'siege' },
      { uid: makeUid('h'), id: 'sp_clear', name: 'Clear Weather', faction: 'neutral', strength: 0, type: 'weather', ability: 'clear_weather' },
      { uid: makeUid('h'), id: 'nr_blue', name: 'Blue Stripes', faction: 'northern_realms', strength: 4, type: 'unit', ability: 'tight_bond', row: 'close' },
    ],
    deck: Array.from({length: 14}).map((_,i) => ({ uid: makeUid('d'), id: 'd'+i, name: 'Hidden', faction: 'northern_realms', strength: 4, type: 'unit', ability: 'none', row: 'close' })),
    discard: [
      { uid: makeUid('disc'), id: 'nr_blue_1', name: 'Blue Stripes', faction: 'northern_realms', strength: 4, type: 'unit', ability: 'tight_bond', row: 'close' },
      { uid: makeUid('disc'), id: 'nr_yarpen', name: 'Yarpen Zigrin', faction: 'northern_realms', strength: 2, type: 'unit', ability: 'tight_bond', row: 'close' },
      { uid: makeUid('disc'), id: 'nr_cat', name: 'Catapult', faction: 'northern_realms', strength: 8, type: 'unit', ability: 'tight_bond', row: 'siege' },
    ],
  };
  const opp = {
    hand: [], // hidden, just count
    handCount: 4,
    deck: Array.from({length: 12}).map((_,i) => ({ uid: makeUid('od'), id: 'od'+i })),
    discard: [
      { uid: makeUid('disc'), id: 'mn_n', name: 'Nekker', faction: 'monsters', strength: 2, type: 'unit', ability: 'muster', row: 'close' },
    ],
  };
  return {
    round: 2, turn: 'me',
    gems: { me: 2, opp: 1 },
    weather: { close: true, ranged: false, siege: false },
    hornedRow: null,
    passed: { me: false, opp: false },
    rows: {
      opp: {
        siege: [],
        ranged: [
          { uid: makeUid('o'), id: 'mn_ge', name: "Ge'els", faction: 'monsters', strength: 10, type: 'hero', ability: 'none' },
          { uid: makeUid('o'), id: 'mn_cock', name: 'Cockatrice', faction: 'monsters', strength: 6, type: 'unit', ability: 'none' },
        ],
        close: [
          { uid: makeUid('o'), id: 'mn_n1', name: 'Nekker', faction: 'monsters', strength: 2, type: 'unit', ability: 'muster' },
          { uid: makeUid('o'), id: 'mn_n2', name: 'Nekker', faction: 'monsters', strength: 2, type: 'unit', ability: 'muster' },
          { uid: makeUid('o'), id: 'mn_n3', name: 'Nekker', faction: 'monsters', strength: 2, type: 'unit', ability: 'muster' },
        ],
      },
      me: {
        close: [
          { uid: makeUid('m'), id: 'nr_blue', name: 'Blue Stripes', faction: 'northern_realms', strength: 4, type: 'unit', ability: 'tight_bond', row: 'close' },
          { uid: makeUid('m'), id: 'nr_blue', name: 'Blue Stripes', faction: 'northern_realms', strength: 4, type: 'unit', ability: 'tight_bond', row: 'close' },
        ],
        ranged: [
          { uid: makeUid('m'), id: 'nr_yp', name: 'Yarpen', faction: 'northern_realms', strength: 2, type: 'unit', ability: 'tight_bond', row: 'ranged' },
        ],
        siege: [
          { uid: makeUid('m'), id: 'nr_cat', name: 'Catapult', faction: 'northern_realms', strength: 8, type: 'unit', ability: 'tight_bond', row: 'siege' },
          { uid: makeUid('m'), id: 'nr_cat', name: 'Catapult', faction: 'northern_realms', strength: 8, type: 'unit', ability: 'tight_bond', row: 'siege' },
        ],
      },
    },
    me, opp,
    log: [
      ['t-08s', 'you', 'Catapult', 'siege · tight bond x2'],
      ['t-04s', 'opp', 'Frost', 'close · weather'],
      ['now', '—', 'your turn', '— pick a card —'],
    ],
  };
}

// Glyph paths
const ROW_PATHS = {
  close:  'M3 14 L9 4 L15 14 Z',
  ranged: 'M3 9 Q9 3 15 9 Q9 15 3 9 Z',
  siege:  'M3 13 L3 8 L9 4 L15 8 L15 13 Z',
};

function MatchScreen({ tweaks, onExit }) {
  const [s, setS] = useState(makeInitialMatch);
  const [selected, setSelected] = useState(null);
  const [prompt, setPrompt] = useState(null); // {type:'medic'|'decoy', side, card}
  const [discardOpen, setDiscardOpen] = useState(null); // 'me' | 'opp' | null
  const [overlay, setOverlay] = useState(null);
  const [flying, setFlying] = useState([]); // [{uid, fromRect, toRect, label, faction}]
  const cardRefs = useRef({}); // uid -> el
  const discardRefs = useRef({}); // 'me'|'opp' -> el
  const dense = tweaks.density === 'compact';

  const meScore = totalScoreV2(s, 'me');
  const oppScore = totalScoreV2(s, 'opp');

  const legalRows = (() => {
    if (!selected) return [];
    if (selected.type === 'unit' || selected.type === 'hero') {
      if (selected.ability === 'spy') return [`opp.${selected.row}`];
      return [`me.${selected.row}`];
    }
    if (selected.type === 'weather') {
      if (selected.ability === 'frost') return ['weather.close'];
      if (selected.ability === 'fog') return ['weather.ranged'];
      if (selected.ability === 'rain') return ['weather.siege'];
      if (selected.ability === 'clear_weather') return ['weather.clear'];
    }
    if (selected.ability === 'commanders_horn') return ['me.close', 'me.ranged', 'me.siege'];
    if (selected.ability === 'scorch') return ['action.scorch'];
    if (selected.ability === 'decoy') return ['me.swap'];
    return [];
  })();

  function pushLog(actor, name, detail) {
    setS(prev => ({ ...prev, log: [['now', actor, name, detail], ...prev.log.slice(0, 8)] }));
  }

  // Animate cards FROM their current position TO the discard pile.
  function animateToDiscard(deadEntries /* [{uid, side, card}] */) {
    const flights = [];
    deadEntries.forEach(e => {
      const fromEl = cardRefs.current[e.uid];
      const toEl = discardRefs.current[e.side];
      if (!fromEl || !toEl) return;
      const f = fromEl.getBoundingClientRect();
      const t = toEl.getBoundingClientRect();
      flights.push({
        uid: e.uid + '_fly_' + Date.now(),
        from: { left: f.left, top: f.top, width: f.width, height: f.height },
        to: { left: t.left + t.width/2 - f.width/2, top: t.top + t.height/2 - f.height/2 },
        card: e.card,
      });
    });
    if (flights.length === 0) return;
    setFlying(flights);
    setTimeout(() => setFlying([]), 900);
  }

  function animateMedicReturn(card, side) {
    const fromEl = discardRefs.current[side];
    const toRow = card.row || 'close';
    const toEl = document.querySelector(`[data-row="${side}.${toRow}"]`);
    if (!fromEl || !toEl) return;
    const f = fromEl.getBoundingClientRect();
    const t = toEl.getBoundingClientRect();
    const flight = {
      uid: 'medic_fly_' + Date.now(),
      from: { left: f.left + f.width/2 - 40, top: f.top + f.height/2 - 56, width: 80, height: 112 },
      to: { left: t.left + t.width/2 - 40, top: t.top + t.height/2 - 56 },
      card,
    };
    setFlying([flight]);
    setTimeout(() => setFlying([]), 900);
  }

  function clickRow(rowKey) {
    if (!selected) return;
    if (!legalRows.includes(rowKey)) return;
    play(selected, rowKey);
  }

  function play(card, rowKey) {
    let target = null;
    if (rowKey.startsWith('me.')) target = { row: rowKey.split('.')[1] };
    if (rowKey.startsWith('opp.')) target = { row: rowKey.split('.')[1] };
    if (rowKey.startsWith('weather.')) target = { row: rowKey.split('.')[1] };
    if (rowKey === 'action.scorch') target = {};

    if (card.ability === 'decoy') {
      setPrompt({ type: 'decoy', card, side: 'me' });
      return;
    }

    const result = playCard(s, 'me', card, target);
    setS(result.state);
    pushLog('you', card.name, rowKey);

    // Animations: play card -> board first happens via React render. Then animate any deaths.
    setTimeout(() => {
      if (result.animations.length > 0) {
        const dead = result.animations.map(a => ({
          uid: a.fromUid, side: a.side,
          card: ['me', 'opp'].flatMap(s2 => result.state[s2].discard).find(c => c.uid === a.fromUid)
                || s.rows.me.close.find(u => u.uid === a.fromUid)
                || s.rows.me.ranged.find(u => u.uid === a.fromUid)
                || s.rows.me.siege.find(u => u.uid === a.fromUid)
                || s.rows.opp.close.find(u => u.uid === a.fromUid)
                || s.rows.opp.ranged.find(u => u.uid === a.fromUid)
                || s.rows.opp.siege.find(u => u.uid === a.fromUid),
        }));
        animateToDiscard(dead);
      }
    }, 80);

    setSelected(null);

    if (result.pendingPrompt) {
      setTimeout(() => setPrompt(result.pendingPrompt), 400);
    } else {
      setTimeout(aiTurn, 800);
    }
  }

  function aiTurn() {
    setS(prev => {
      if (prev.passed.opp) return prev;
      const move = aiPickMove(prev);
      if (move.type === 'pass') {
        const np = { ...prev, passed: { ...prev.passed, opp: true } };
        if (np.passed.me) setTimeout(() => setOverlay('roundEnd'), 400);
        return { ...np, log: [['now', 'opp', 'pass', 'opponent passed'], ...prev.log.slice(0, 8)] };
      }
      // play opponent card
      const card = move.card;
      const newCard = { ...card, uid: makeUid('o') };
      const np = JSON.parse(JSON.stringify(prev));
      np.opp.handCount = Math.max(0, np.opp.handCount - 1);
      np.rows.opp[move.target.row] = [...np.rows.opp[move.target.row], newCard];
      np.log = [['now', 'opp', card.name, move.target.row], ...prev.log.slice(0, 8)];
      np.turn = 'me';
      return np;
    });
  }

  function resolveMedicPick(picked) {
    const next = resolveMedic(s, prompt.side, prompt.card, picked);
    setS(next);
    animateMedicReturn(picked, prompt.side);
    pushLog('you', `Medic → ${picked.name}`, 'resurrected');
    setPrompt(null);
    setTimeout(aiTurn, 800);
  }

  function resolveDecoyPick(target) {
    const next = resolveDecoy(s, prompt.side, prompt.card, target);
    setS(next);
    pushLog('you', `Decoy → ${target.name}`, 'swapped');
    setPrompt(null);
    setTimeout(aiTurn, 800);
  }

  function passRound() {
    setS(prev => {
      const np = { ...prev, passed: { ...prev.passed, me: true } };
      if (np.passed.opp) setTimeout(() => setOverlay('roundEnd'), 400);
      else setTimeout(aiTurn, 800);
      return { ...np, log: [['now', 'you', 'pass', 'you passed'], ...prev.log.slice(0,8)] };
    });
  }

  function nextRound() {
    setOverlay(null);
    setS(prev => {
      const winner = totalScoreV2(prev, 'me') > totalScoreV2(prev, 'opp') ? 'me' : 'opp';
      const np = JSON.parse(JSON.stringify(prev));
      np.round += 1;
      np.gems = { ...prev.gems };
      const loser = winner === 'me' ? 'opp' : 'me';
      np.gems[loser] = Math.max(0, np.gems[loser] - 1);
      np.passed = { me: false, opp: false };
      // Move all board units to their owner's discard
      ['me', 'opp'].forEach(s2 => {
        ['close', 'ranged', 'siege'].forEach(r => {
          np[s2].discard.push(...np.rows[s2][r].filter(u => u.type === 'unit'));
        });
      });
      np.rows = { me: {close:[],ranged:[],siege:[]}, opp: {close:[],ranged:[],siege:[]} };
      np.weather = { close: false, ranged: false, siege: false };
      np.hornedRow = null;
      np.log = [['now', '—', `Round ${np.round}`, `${winner === 'me' ? 'you' : 'opp'} won previous`], ...prev.log.slice(0,8)];
      return np;
    });
  }

  // Layout helpers
  const rowH = dense ? 92 : 116;

  function ScoreCard({ side }) {
    const sc = totalScoreV2(s, side);
    const isOpp = side === 'opp';
    return (
      <div style={{ padding: dense ? 8 : 10, background: 'var(--bg-paper)', border: '1px solid var(--rule-strong)', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 10, boxShadow: 'var(--shadow)' }}>
        <div style={{ width: 40, height: 56, borderRadius: 2, overflow: 'hidden', border: '1px solid #2a1f10', background: '#1a140c' }}>
          <SvgCardArt cardId={isOpp ? 'leader_mn' : 'leader_nr'} faction={isOpp ? 'monsters' : 'northern_realms'} type="leader" w={40} h={56} theme="a" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14, color: 'var(--ink)' }}>{isOpp ? 'Eredin (AI)' : 'Foltest, Lord Cmdr.'}</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{isOpp ? 'Monsters · Muster' : 'N. Realms · Tight-Bond'}</div>
          <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
            {[0,1].map(i => <span key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: i < s.gems[side] ? '#8a3a1f' : 'rgba(31,26,18,0.15)', border: '1px solid #4a1a08' }} />)}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: dense ? 30 : 38, lineHeight: 1, color: side === s.turn ? 'var(--accent)' : 'var(--ink)', fontVariantNumeric: 'tabular-nums' }}>{sc}</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{s.passed[side] ? 'PASSED' : side === s.turn ? 'TURN' : 'WAIT'}</div>
        </div>
      </div>
    );
  }

  function DiscardPile({ side }) {
    const d = s[side].discard;
    const top = d[d.length - 1];
    return (
      <div ref={el => discardRefs.current[side] = el}
           onClick={() => d.length && setDiscardOpen(side)}
           style={{ position: 'relative', width: 60, height: 84, cursor: d.length ? 'pointer' : 'default', flex: '0 0 auto' }}>
        {d.length === 0 ? (
          <div style={{ width: '100%', height: '100%', border: '1.5px dashed var(--rule-strong)', borderRadius: 3, display: 'grid', placeItems: 'center', color: 'var(--ink-3)', fontFamily: 'var(--font-mono)', fontSize: 9, textTransform: 'uppercase' }}>
            empty
          </div>
        ) : (
          <>
            <div style={{ position: 'absolute', top: 4, left: 4, width: '100%', height: '100%' }}>
              <CardBack size="sm" theme="a" faction={side === 'me' ? 'northern_realms' : 'monsters'} style={{ width: 60, height: 84, opacity: 0.5 }}/>
            </div>
            <div style={{ position: 'absolute', top: 0, left: 0 }}>
              <GameCard card={top} size="sm" theme="a"/>
            </div>
            <div style={{ position: 'absolute', top: -8, right: -8, width: 22, height: 22, borderRadius: '50%', background: '#8a3a1f', color: '#f0e2c0', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11, display: 'grid', placeItems: 'center', border: '1px solid #4a1a08', boxShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>{d.length}</div>
          </>
        )}
        <div style={{ position: 'absolute', bottom: -14, left: 0, right: 0, textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>discard</div>
      </div>
    );
  }

  function DeckPile({ side, count }) {
    return (
      <div style={{ position: 'relative', width: 60, height: 84, flex: '0 0 auto' }}>
        <CardBack size="sm" theme="a" faction={side === 'me' ? 'northern_realms' : 'monsters'} style={{ width: 60, height: 84 }}/>
        <div style={{ position: 'absolute', top: -8, left: -8, width: 22, height: 22, borderRadius: '50%', background: 'var(--ink)', color: 'var(--bg-paper)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11, display: 'grid', placeItems: 'center', border: '1px solid var(--rule-strong)' }}>{count}</div>
        <div style={{ position: 'absolute', bottom: -14, left: 0, right: 0, textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>deck</div>
      </div>
    );
  }

  function Row({ side, row }) {
    const units = s.rows[side][row];
    const wActive = s.weather[row];
    const horned = s.hornedRow === `${side}.${row}`;
    const score = rowScoreV2(units, wActive, horned);
    const rowKey = `${side}.${row}`;
    const isLegal = legalRows.includes(rowKey);
    return (
      <div data-row={rowKey}
           onClick={isLegal ? () => clickRow(rowKey) : undefined}
           style={{
             display: 'grid', gridTemplateColumns: '60px 1fr 60px',
             borderBottom: '1px solid var(--rule)',
             background: wActive ? 'rgba(106,154,196,0.18)' : isLegal ? 'rgba(138,58,31,0.10)' : 'transparent',
             minHeight: rowH, position: 'relative',
             cursor: isLegal ? 'pointer' : 'default',
             boxShadow: isLegal ? 'inset 0 0 0 2px var(--accent)' : 'none',
           }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, borderRight: '1px solid var(--rule)', background: 'rgba(31,26,18,0.04)' }}>
          <svg viewBox="0 0 18 18" width="20" height="20"><path d={ROW_PATHS[row]} fill="none" stroke="var(--ink-2)" strokeWidth="1.4"/></svg>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{row}</span>
          {wActive && <span style={{ color: 'var(--w-frost)', fontSize: 12 }}>❄</span>}
          {horned && <span style={{ color: 'var(--gold)', fontSize: 12 }}>◊</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', overflow: 'hidden' }}>
          {units.map(u => (
            <div key={u.uid} ref={el => cardRefs.current[u.uid] = el}>
              <GameCard card={u} size={dense ? 'sm' : 'md'} theme="a"/>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', borderLeft: '1px solid var(--rule)', background: 'rgba(31,26,18,0.04)' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: dense ? 18 : 22, color: isLegal ? 'var(--accent)' : 'var(--ink)', fontVariantNumeric: 'tabular-nums' }}>{score}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="dir-a" style={{ width: 1200, height: 780, display: 'grid', gridTemplateRows: 'auto 1fr', overflow: 'hidden', position: 'relative', background: 'var(--bg)' }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 18px', borderBottom: '2px solid var(--rule-strong)', background: 'var(--bg-paper)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <button onClick={onExit} style={{ background: 'transparent', border: '1px solid var(--rule-strong)', padding: '4px 10px', borderRadius: 3, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-2)', cursor: 'pointer' }}>← exit</button>
          <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 18, fontWeight: 600, color: 'var(--ink)', letterSpacing: '0.03em' }}>Gwent</div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-3)' }}>round {s.round} · {s.turn === 'me' ? 'your turn' : 'opponent thinking…'}</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr 280px', overflow: 'hidden' }}>
        {/* LEFT: scoreboard, weather, piles */}
        <div style={{ borderRight: '2px solid var(--rule-strong)', padding: 12, display: 'flex', flexDirection: 'column', gap: 12, overflow: 'auto', background: 'var(--bg-2)' }}>
          <ScoreCard side="opp"/>
          <div style={{ display: 'flex', justifyContent: 'space-around', padding: '14px 0', background: 'var(--bg-paper)', border: '1px solid var(--rule-strong)', borderRadius: 4 }}>
            <DeckPile side="opp" count={s.opp.deck.length}/>
            <DiscardPile side="opp"/>
          </div>
          <div style={{ padding: 8, background: 'var(--bg-paper)', border: '1px solid var(--rule-strong)', borderRadius: 4, fontSize: 11, fontFamily: 'var(--font-display)' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>weather</div>
            <div style={{ marginTop: 4, color: 'var(--ink-2)' }}>
              {s.weather.close && <div>❄ Close → 1</div>}
              {s.weather.ranged && <div>≈ Ranged → 1</div>}
              {s.weather.siege && <div>☂ Siege → 1</div>}
              {!s.weather.close && !s.weather.ranged && !s.weather.siege && <span style={{ color: 'var(--ink-3)', fontStyle: 'italic' }}>clear sky</span>}
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-around', padding: '14px 0', background: 'var(--bg-paper)', border: '1px solid var(--rule-strong)', borderRadius: 4 }}>
            <DeckPile side="me" count={s.me.deck.length}/>
            <DiscardPile side="me"/>
          </div>
          <ScoreCard side="me"/>
          <button onClick={passRound} disabled={s.passed.me}
                  style={{ marginTop: 4, background: s.passed.me ? 'transparent' : 'var(--accent)', color: s.passed.me ? 'var(--ink-3)' : '#f0e2c0', border: `1px solid ${s.passed.me ? 'var(--rule-strong)' : '#4a1a08'}`, padding: '8px 14px', borderRadius: 3, fontFamily: 'var(--font-display)', fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: s.passed.me ? 'default' : 'pointer', fontWeight: 600 }}>
            {s.passed.me ? 'Passed' : 'Pass Round'}
          </button>
        </div>

        {/* CENTER: board */}
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg-paper)' }}>
          <Row side="opp" row="siege"/>
          <Row side="opp" row="ranged"/>
          <Row side="opp" row="close"/>
          <div style={{ height: 4, background: 'linear-gradient(90deg, transparent, var(--accent) 40%, var(--accent) 60%, transparent)', boxShadow: '0 0 8px rgba(138,58,31,0.4)' }}/>
          <Row side="me" row="close"/>
          <Row side="me" row="ranged"/>
          <Row side="me" row="siege"/>

          {/* Hand */}
          <div style={{ borderTop: '2px solid var(--rule-strong)', padding: '10px 14px', background: 'var(--bg-2)', display: 'flex', alignItems: 'center', gap: 8, minHeight: 138 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em', minWidth: 60 }}>hand · {s.me.hand.length}</span>
            <div style={{ display: 'flex', gap: 6, flex: 1 }}>
              {s.me.hand.map(c => (
                <div key={c.uid} onClick={() => setSelected(selected?.uid === c.uid ? null : c)}
                     style={{ transform: selected?.uid === c.uid ? 'translateY(-10px)' : 'none', transition: 'transform .15s', cursor: 'pointer' }}>
                  <GameCard card={c} size={dense ? 'sm' : 'md'} theme="a" selected={selected?.uid === c.uid}/>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT: inspector */}
        <div style={{ borderLeft: '2px solid var(--rule-strong)', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg-2)' }}>
          <div style={{ padding: 14, borderBottom: '1px solid var(--rule)' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>selected card</div>
            {selected ? (
              <>
                <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                  <GameCard card={selected} size="lg" theme="a"/>
                  <div style={{ flex: 1, fontSize: 12, color: 'var(--ink)' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600 }}>{selected.name}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-3)', marginTop: 2 }}>{selected.faction.replace('_', ' ')} · {selected.type} · str {selected.strength}</div>
                    <div style={{ marginTop: 8, fontFamily: 'var(--font-display)', fontStyle: 'italic', color: 'var(--ink-2)', lineHeight: 1.5 }}>
                      <span style={{ color: 'var(--accent)', textTransform: 'capitalize', fontStyle: 'normal', fontWeight: 600 }}>{selected.ability.replace(/_/g,' ')}.</span>{' '}
                      {ABILITY_DESC_A[selected.ability] || ''}
                    </div>
                  </div>
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 14 }}>legal targets · {legalRows.length}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6 }}>
                  {legalRows.length === 0 && <span style={{ color: 'var(--ink-3)', fontStyle: 'italic', fontSize: 12 }}>(no legal target)</span>}
                  {legalRows.map(r => (
                    <button key={r} onClick={() => clickRow(r) || play(selected, r)}
                            style={{ padding: '6px 10px', borderRadius: 3, border: '1px solid var(--accent)', background: 'rgba(138,58,31,0.10)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink)' }}>
                      <span>{r}</span><span style={{ color: 'var(--accent)' }}>↵ play</span>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ marginTop: 8, fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.5 }}>Tap a card in your hand to inspect it and see legal placements.</div>
            )}
          </div>

          {tweaks.showAdvisor && (
            <div style={{ padding: 12, borderBottom: '1px solid var(--rule)', background: 'rgba(138,58,31,0.06)' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>strategist's note</div>
              <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 12, color: 'var(--ink-2)', marginTop: 4, lineHeight: 1.5 }}>
                {meScore > oppScore + 5
                  ? `You lead by ${meScore - oppScore}. Consider passing to bait the AI into over-committing.`
                  : oppScore > meScore + 5
                  ? `You're behind by ${oppScore - meScore}. A horn on siege would put you ahead.`
                  : 'Match is close. Save heroes and weather for round 3.'}
              </div>
            </div>
          )}

          <div style={{ flex: 1, overflow: 'auto', padding: '10px 14px' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>battle log</div>
            <div style={{ marginTop: 6, fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--ink-2)', lineHeight: 1.7 }}>
              {s.log.map((r, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '42px 32px 1fr', gap: 6 }}>
                  <span style={{ color: 'var(--ink-3)' }}>{r[0]}</span>
                  <span style={{ color: r[1] === 'you' ? 'var(--accent)' : r[1] === 'opp' ? '#7a3a3a' : 'var(--ink-3)' }}>{r[1]}</span>
                  <span><b style={{ color: 'var(--ink)' }}>{r[2]}</b> <span style={{ color: 'var(--ink-3)' }}>{r[3]}</span></span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Flying cards (board → discard, discard → board) */}
      {flying.map(f => (
        <div key={f.uid} style={{
          position: 'fixed', left: f.from.left, top: f.from.top, width: f.from.width || 80, height: f.from.height || 112,
          zIndex: 100, pointerEvents: 'none',
          animation: 'flyTo .85s cubic-bezier(.55,.05,.4,1.0) forwards',
          '--toLeft': `${f.to.left}px`, '--toTop': `${f.to.top}px`,
        }}>
          <GameCard card={f.card} size="md" theme="a"/>
        </div>
      ))}
      <style>{`
        @keyframes flyTo {
          0% { transform: translate(0, 0) rotate(0deg) scale(1); opacity: 1; }
          50% { transform: translate(calc((var(--toLeft) - ${flying[0]?.from.left || 0}px) * 0.5), calc((var(--toTop) - ${flying[0]?.from.top || 0}px) * 0.5 - 60px)) rotate(15deg) scale(1.05); opacity: 1; }
          100% { transform: translate(calc(var(--toLeft) - ${flying[0]?.from.left || 0}px), calc(var(--toTop) - ${flying[0]?.from.top || 0}px)) rotate(360deg) scale(0.5); opacity: 0; }
        }
      `}</style>

      {/* Medic prompt */}
      {prompt?.type === 'medic' && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(31,26,18,0.65)', display: 'grid', placeItems: 'center', zIndex: 80 }}>
          <div style={{ background: 'var(--bg-paper)', border: '2px solid var(--rule-strong)', borderRadius: 4, padding: 24, maxWidth: 920, boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>medic ability</div>
            <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 22, color: 'var(--ink)', marginTop: 4 }}>Resurrect a unit from your discard pile.</div>
            <div style={{ display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 880 }}>
              {s[prompt.side].discard.filter(c => c.type === 'unit' && c.ability !== 'medic').map(c => (
                <div key={c.uid} onClick={() => resolveMedicPick(c)} style={{ cursor: 'pointer', transition: 'transform .15s' }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-6px)'} onMouseOut={e => e.currentTarget.style.transform = ''}>
                  <GameCard card={c} size="lg" theme="a"/>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
              <button onClick={() => { setPrompt(null); setTimeout(aiTurn, 400); }} style={{ background: 'transparent', border: '1px solid var(--rule-strong)', padding: '6px 14px', borderRadius: 3, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-2)', cursor: 'pointer' }}>skip</button>
            </div>
          </div>
        </div>
      )}

      {/* Decoy prompt */}
      {prompt?.type === 'decoy' && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(31,26,18,0.65)', display: 'grid', placeItems: 'center', zIndex: 80 }}>
          <div style={{ background: 'var(--bg-paper)', border: '2px solid var(--rule-strong)', borderRadius: 4, padding: 24, maxWidth: 920 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>decoy</div>
            <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 22, color: 'var(--ink)', marginTop: 4 }}>Choose a non-Hero unit to swap with.</div>
            <div style={{ display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap', justifyContent: 'center' }}>
              {['close','ranged','siege'].flatMap(r => s.rows.me[r].filter(u => u.type === 'unit')).map(c => (
                <div key={c.uid} onClick={() => resolveDecoyPick(c)} style={{ cursor: 'pointer' }}>
                  <GameCard card={c} size="lg" theme="a"/>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
              <button onClick={() => setPrompt(null)} style={{ background: 'transparent', border: '1px solid var(--rule-strong)', padding: '6px 14px', borderRadius: 3, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-2)', cursor: 'pointer' }}>cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Discard browser */}
      {discardOpen && (() => {
        const cards = s[discardOpen].discard;
        const grouped = { hero: [], close: [], ranged: [], siege: [], special: [] };
        cards.forEach(c => {
          if (c.type === 'hero') grouped.hero.push(c);
          else if (c.type === 'special' || c.type === 'weather') grouped.special.push(c);
          else grouped[c.row || 'close']?.push(c);
        });
        const sections = [
          ['Heroes', grouped.hero],
          ['Close combat', grouped.close],
          ['Ranged', grouped.ranged],
          ['Siege', grouped.siege],
          ['Specials', grouped.special],
        ].filter(([_, arr]) => arr.length > 0);
        return (
        <div onClick={() => setDiscardOpen(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(31,26,18,0.72)', display: 'grid', placeItems: 'center', zIndex: 80, padding: 30 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-paper)', border: '2px solid var(--rule-strong)', borderRadius: 4, width: 1080, maxWidth: '95%', maxHeight: '90%', display: 'flex', flexDirection: 'column', boxShadow: '0 30px 80px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid var(--rule-strong)' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>{discardOpen === 'me' ? 'your' : "opponent's"} discard pile</div>
                <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 22, fontWeight: 600, color: 'var(--ink)' }}>{cards.length} {cards.length === 1 ? 'card' : 'cards'}</div>
              </div>
              <button onClick={() => setDiscardOpen(null)} style={{ background: 'transparent', border: '1px solid var(--rule-strong)', padding: '6px 14px', borderRadius: 3, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-2)', cursor: 'pointer' }}>close ✕</button>
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: '16px 24px 24px' }}>
              {sections.length === 0 && <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', color: 'var(--ink-3)', textAlign: 'center', padding: 40 }}>The pile is empty.</div>}
              {sections.map(([label, arr]) => (
                <div key={label} style={{ marginBottom: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 8, paddingBottom: 4, borderBottom: '1px dotted var(--rule-strong)' }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>{label}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-3)' }}>· {arr.length}</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                    {arr.map(c => <GameCard key={c.uid} card={c} size="md" theme="a"/>)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        );
      })()}

      {/* Round end overlay */}
      {overlay === 'roundEnd' && (
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, rgba(138,58,31,0.35), rgba(31,26,18,0.85) 70%)', display: 'grid', placeItems: 'center', zIndex: 90 }}>
          <div style={{ textAlign: 'center', color: 'var(--bg-paper)' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.2em' }}>round {s.round} complete</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 56, fontWeight: 700, fontStyle: 'italic', color: meScore > oppScore ? 'var(--gold)' : '#d8a890', marginTop: 8 }}>
              {meScore > oppScore ? 'Victory' : meScore < oppScore ? 'Defeat' : 'Stalemate'}
            </div>
            <div style={{ display: 'flex', gap: 30, justifyContent: 'center', marginTop: 14 }}>
              <div><div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 50 }}>{meScore}</div><div style={{ fontSize: 10, opacity: 0.7 }}>YOU</div></div>
              <div style={{ fontSize: 30, opacity: 0.5, alignSelf: 'center' }}>:</div>
              <div><div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 50, opacity: 0.7 }}>{oppScore}</div><div style={{ fontSize: 10, opacity: 0.7 }}>OPP</div></div>
            </div>
            <button onClick={nextRound} style={{ marginTop: 20, background: 'var(--accent)', color: '#f0e2c0', border: '1px solid #4a1a08', padding: '10px 28px', borderRadius: 3, fontFamily: 'var(--font-display)', fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer', fontWeight: 600 }}>continue</button>
          </div>
        </div>
      )}
    </div>
  );
}

const ABILITY_DESC_A = {
  tight_bond: 'Place beside a copy to double both their strengths.',
  morale_boost: '+1 to all units in this row, except itself.',
  spy: "Place on opponent's row, then draw 2 cards.",
  medic: 'Resurrect a non-hero unit from your discard.',
  muster: 'Find any copies in your deck and play them all.',
  scorch: "Destroy the strongest unit(s) on the field.",
  commanders_horn: 'Doubles every unit\'s strength in the row.',
  decoy: 'Swap with a non-hero unit on the field.',
  clear_weather: 'Removes all weather effects.',
  frost: 'Sets all non-hero close-combat units to 1.',
  fog: 'Sets all non-hero ranged units to 1.',
  rain: 'Sets all non-hero siege units to 1.',
  none: 'No special ability.',
};

Object.assign(window, { MatchScreen });
