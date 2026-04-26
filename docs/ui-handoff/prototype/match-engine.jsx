// match-engine.jsx — pure functions: scoring, ability resolution, AI move.
// Exports to window.

function rowScoreV2(units, weatherActive, horned) {
  const base = units.reduce((sum, u) => {
    if (u.type !== 'unit' && u.type !== 'hero') return sum;
    const s = u.type === 'hero' ? u.strength : (weatherActive ? 1 : (u._buff ?? u.strength));
    return sum + s;
  }, 0);
  // tight bond multiplier
  const groups = {};
  units.forEach(u => { if (u.ability === 'tight_bond' && u.type === 'unit') groups[u.id] = (groups[u.id] || 0) + 1; });
  let tbBonus = 0;
  Object.entries(groups).forEach(([id, n]) => {
    if (n < 2) return;
    const u = units.find(x => x.id === id);
    const eff = weatherActive ? 1 : u.strength;
    tbBonus += eff * n * (n - 1);
  });
  let total = base + tbBonus;
  // morale boost (each MB unit gives +1 to non-self units)
  const mbCount = units.filter(u => u.ability === 'morale_boost' && u.type === 'unit').length;
  if (mbCount > 0) total += mbCount * Math.max(0, units.filter(u => u.type === 'unit' || u.type === 'hero').length - 1);
  if (horned) total *= 2;
  return total;
}

function totalScoreV2(state, side) {
  const rows = state.rows[side];
  let t = 0;
  ['close', 'ranged', 'siege'].forEach(r => {
    t += rowScoreV2(rows[r], state.weather[r], state.hornedRow === `${side}.${r}`);
  });
  return t;
}

// Returns {state, animations: [{type, fromUid, toZone}], pendingPrompt}
function playCard(state, side, card, target) {
  const next = JSON.parse(JSON.stringify(state));
  const animations = [];
  let pendingPrompt = null;

  // remove from hand
  next[side].hand = next[side].hand.filter(h => h.uid !== card.uid);

  if (card.type === 'unit' || card.type === 'hero') {
    const row = target.row;
    if (card.ability === 'spy') {
      // place on opponent's matching row
      const opp = side === 'me' ? 'opp' : 'me';
      next.rows[opp][row] = [...next.rows[opp][row], card];
      // draw 2
      for (let i = 0; i < 2 && next[side].deck.length > 0; i++) {
        next[side].hand.push(next[side].deck.shift());
      }
    } else {
      next.rows[side][row] = [...next.rows[side][row], card];
      if (card.ability === 'medic') {
        // queue medic prompt: pick from discard
        const eligible = next[side].discard.filter(c => c.type === 'unit' && c.ability !== 'medic');
        if (eligible.length > 0) {
          pendingPrompt = { type: 'medic', side, card };
        }
      }
    }
  } else if (card.type === 'weather') {
    if (card.ability === 'frost') next.weather.close = true;
    if (card.ability === 'fog') next.weather.ranged = true;
    if (card.ability === 'rain') next.weather.siege = true;
    if (card.ability === 'clear_weather') next.weather = { close: false, ranged: false, siege: false };
    next.weatherCards = [...(next.weatherCards || []), card];
  } else if (card.type === 'special') {
    if (card.ability === 'commanders_horn') {
      next.hornedRow = `${side}.${target.row}`;
      next[side].discard.push(card);
    } else if (card.ability === 'scorch') {
      // find max strength unit across both sides (non-hero only, base strength)
      const all = [];
      ['me', 'opp'].forEach(s => ['close', 'ranged', 'siege'].forEach(r => {
        next.rows[s][r].forEach(u => { if (u.type === 'unit') all.push({s, r, u}); });
      }));
      const max = Math.max(0, ...all.map(x => x.u.strength));
      const killed = all.filter(x => x.u.strength === max);
      killed.forEach(x => {
        next.rows[x.s][x.r] = next.rows[x.s][x.r].filter(u => u.uid !== x.u.uid);
        next[x.s].discard.push(x.u);
        animations.push({ type: 'death', fromUid: x.u.uid, side: x.s });
      });
      next[side].discard.push(card);
    } else if (card.ability === 'decoy') {
      // handled via prompt (pick a unit on your side to swap)
      pendingPrompt = { type: 'decoy', side, card };
      // put decoy back temporarily — will resolve in promptResolve
      next[side].hand.push(card); // keep it until they pick
      // remove what we already removed at top
      next[side].hand = next[side].hand.filter((c, i, arr) => arr.findIndex(x => x.uid === c.uid) === i);
    }
  }

  return { state: next, animations, pendingPrompt };
}

function resolveMedic(state, side, card, picked) {
  const next = JSON.parse(JSON.stringify(state));
  // remove from discard
  next[side].discard = next[side].discard.filter(c => c.uid !== picked.uid);
  // place on its native row
  const row = picked.row || 'close';
  next.rows[side][row] = [...next.rows[side][row], picked];
  return next;
}

function resolveDecoy(state, side, decoyCard, targetUnit) {
  const next = JSON.parse(JSON.stringify(state));
  // find target on board
  let foundRow = null;
  ['close', 'ranged', 'siege'].forEach(r => {
    if (next.rows[side][r].some(u => u.uid === targetUnit.uid)) foundRow = r;
  });
  if (!foundRow) return next;
  next.rows[side][foundRow] = next.rows[side][foundRow].filter(u => u.uid !== targetUnit.uid);
  next.rows[side][foundRow].push(decoyCard);
  next[side].hand = next[side].hand.filter(c => c.uid !== decoyCard.uid);
  next[side].hand.push(targetUnit);
  return next;
}

// Simple opponent AI: pick highest-strength unit, play to its row.
function aiPickMove(state) {
  const opp = state.opp;
  if (opp.hand.length === 0) return { type: 'pass' };
  // 30% chance to pass if behind by < 5
  const meScore = totalScoreV2(state, 'me');
  const oppScore = totalScoreV2(state, 'opp');
  if (oppScore > meScore + 8 && Math.random() < 0.5) return { type: 'pass' };
  // Otherwise play strongest unit
  const units = opp.hand.filter(c => c.type === 'unit' || c.type === 'hero');
  if (units.length === 0) return { type: 'pass' };
  units.sort((a, b) => b.strength - a.strength);
  const pick = units[0];
  return { type: 'play', card: pick, target: { row: pick.row || 'close' } };
}

Object.assign(window, { rowScoreV2, totalScoreV2, playCard, resolveMedic, resolveDecoy, aiPickMove });
