// shared.jsx — faction data, card catalog snippet, SVG placeholder card.
// Loaded as <script type="text/babel" src="shared.jsx"></script>.
// Exports to window so other files can import.

const FACTIONS = {
  northern_realms: { id: 'northern_realms', name: 'Northern Realms',  short: 'NR', color: '#2a4a7a', accent: '#7aa6d8', glyph: 'crown' },
  nilfgaard:        { id: 'nilfgaard',        name: 'Nilfgaard',         short: 'NG', color: '#1a1a1a', accent: '#c9a050', glyph: 'sun' },
  monsters:         { id: 'monsters',         name: 'Monsters',          short: 'MN', color: '#5a2030', accent: '#c47080', glyph: 'fang' },
  scoiatael:        { id: 'scoiatael',        name: "Scoia'tael",        short: 'ST', color: '#4a6a30', accent: '#a8c870', glyph: 'leaf' },
  skellige:         { id: 'skellige',         name: 'Skellige',          short: 'SK', color: '#6a5030', accent: '#d8b06a', glyph: 'horn' },
  neutral:          { id: 'neutral',          name: 'Neutral',           short: 'N',  color: '#5a5a5a', accent: '#bababa', glyph: 'star' },
};

// Sample card library — short, focused on what mockups need
const CARDS = [
  // Northern Realms
  { id: 'nr_dijkstra', name: 'Dijkstra', faction: 'northern_realms', strength: 4, row: 'close', type: 'unit', ability: 'spy' },
  { id: 'nr_thaler',   name: 'Thaler',   faction: 'northern_realms', strength: 1, row: 'siege', type: 'unit', ability: 'spy' },
  { id: 'nr_yarpen',   name: 'Yarpen Zigrin', faction: 'northern_realms', strength: 2, row: 'close', type: 'unit', ability: 'tight_bond' },
  { id: 'nr_blue_iii', name: 'Blue Stripes Commando', faction: 'northern_realms', strength: 4, row: 'close', type: 'unit', ability: 'tight_bond' },
  { id: 'nr_cat',      name: 'Catapult', faction: 'northern_realms', strength: 8, row: 'siege', type: 'unit', ability: 'tight_bond' },
  { id: 'nr_trebuchet',name: 'Siege Tower', faction: 'northern_realms', strength: 6, row: 'siege', type: 'unit', ability: 'morale_boost' },
  { id: 'nr_ballista', name: 'Ballista', faction: 'northern_realms', strength: 6, row: 'siege', type: 'unit', ability: 'none' },
  { id: 'nr_poor',     name: 'Poor F. Inf.', faction: 'northern_realms', strength: 1, row: 'close', type: 'unit', ability: 'muster' },
  // Monsters
  { id: 'mn_ge',  name: 'Ge’els',   faction: 'monsters', strength: 10, row: 'ranged', type: 'hero', ability: 'none' },
  { id: 'mn_imp', name: 'Imp',      faction: 'monsters', strength: 4,  row: 'close',  type: 'unit', ability: 'muster' },
  { id: 'mn_nek', name: 'Nekker',   faction: 'monsters', strength: 2,  row: 'close',  type: 'unit', ability: 'muster' },
  { id: 'mn_cock',name: 'Cockatrice', faction: 'monsters', strength: 6, row: 'ranged', type: 'unit', ability: 'none' },
  // Nilfgaard
  { id: 'ng_yenn', name: 'Yennefer', faction: 'nilfgaard', strength: 7, row: 'ranged', type: 'hero', ability: 'medic' },
  { id: 'ng_med',  name: 'Field Medic', faction: 'nilfgaard', strength: 5, row: 'close', type: 'unit', ability: 'medic' },
  // Scoiatael
  { id: 'st_leaf', name: 'Vrihedd Sapper', faction: 'scoiatael', strength: 4, row: 'siege', type: 'unit', ability: 'morale_boost' },
  { id: 'st_dol',  name: 'Dol Blathanna Archer', faction: 'scoiatael', strength: 6, row: 'ranged', type: 'unit', ability: 'none' },
  // Specials / Weather
  { id: 'sp_scorch', name: 'Scorch',         faction: 'neutral', strength: 0, row: null, type: 'special', ability: 'scorch' },
  { id: 'sp_horn',   name: "Commander's Horn", faction: 'neutral', strength: 0, row: null, type: 'special', ability: 'commanders_horn' },
  { id: 'sp_decoy',  name: 'Decoy',          faction: 'neutral', strength: 0, row: null, type: 'special', ability: 'decoy' },
  { id: 'sp_frost',  name: 'Biting Frost',   faction: 'neutral', strength: 0, row: null, type: 'weather', ability: 'frost' },
  { id: 'sp_fog',    name: 'Impenetrable Fog', faction: 'neutral', strength: 0, row: null, type: 'weather', ability: 'fog' },
  { id: 'sp_rain',   name: 'Torrential Rain', faction: 'neutral', strength: 0, row: null, type: 'weather', ability: 'rain' },
  { id: 'sp_clear',  name: 'Clear Weather',  faction: 'neutral', strength: 0, row: null, type: 'weather', ability: 'clear_weather' },
];

const ROW_LABEL = { close: 'Close', ranged: 'Ranged', siege: 'Siege' };
const ROW_GLYPH = {
  close:  'M3 14 L9 4 L15 14 Z',           // sword tip
  ranged: 'M3 9 Q9 3 15 9 Q9 15 3 9 Z',     // bow curve
  siege:  'M3 13 L3 8 L9 4 L15 8 L15 13 Z', // catapult silhouette
};
const ABILITY_GLYPH = {
  spy:           '◐',
  medic:         '✚',
  tight_bond:    '∞',
  morale_boost:  '↑',
  muster:        '⌬',
  scorch:        '✦',
  commanders_horn: '◊',
  decoy:         '⇄',
  frost:         '❄',
  fog:           '☁',
  rain:          '☂',
  clear_weather: '☼',
  none:          '',
};

// ────────────────────────────────────────────────────────────
// SvgCardArt — generative faction-tinted silhouette portrait.
// Deterministic per cardId. No human/character recreation.
// ────────────────────────────────────────────────────────────
function hash(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return h;
}
function SvgCardArt({ cardId, faction, type, w = 90, h = 120, theme = 'a' }) {
  const f = FACTIONS[faction] || FACTIONS.neutral;
  const seed = hash(cardId || faction);
  // Pick one of a few abstract silhouettes by hash
  const variant = seed % 5;
  // Geometric shapes only — no character art
  const tone = theme === 'b' ? 0.35 : theme === 'c' ? 0.18 : 0.55;
  const bgA = f.color;
  const bgB = `color-mix(in oklab, ${f.color} 60%, #000)`;
  const sil = f.accent;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height="100%" preserveAspectRatio="xMidYMid slice"
         style={{ display: 'block' }}>
      <defs>
        <linearGradient id={`g-${cardId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"  stopColor={bgA} stopOpacity={tone + 0.2}/>
          <stop offset="100%" stopColor={bgB} stopOpacity={tone + 0.4}/>
        </linearGradient>
        <pattern id={`p-${cardId}`} patternUnits="userSpaceOnUse" width="6" height="6">
          <path d="M0 6 L6 0" stroke={sil} strokeOpacity="0.10" strokeWidth="0.6"/>
        </pattern>
      </defs>
      <rect width={w} height={h} fill={`url(#g-${cardId})`}/>
      <rect width={w} height={h} fill={`url(#p-${cardId})`}/>
      {/* horizon line */}
      <rect x="0" y={h*0.78} width={w} height={h*0.22} fill="#000" fillOpacity="0.18"/>
      {/* Variant silhouettes — pure geometry */}
      {variant === 0 && (
        <g fill={sil} fillOpacity="0.85">
          <polygon points={`${w/2-12},${h*0.78} ${w/2+12},${h*0.78} ${w/2+6},${h*0.32} ${w/2-6},${h*0.32}`}/>
          <circle cx={w/2} cy={h*0.28} r="7"/>
        </g>
      )}
      {variant === 1 && (
        <g fill={sil} fillOpacity="0.8">
          <rect x={w/2-14} y={h*0.40} width="28" height={h*0.38} />
          <polygon points={`${w/2-18},${h*0.40} ${w/2+18},${h*0.40} ${w/2},${h*0.20}`}/>
        </g>
      )}
      {variant === 2 && (
        <g fill={sil} fillOpacity="0.8">
          <circle cx={w/2} cy={h*0.50} r={Math.min(w,h)*0.18}/>
          <rect x={w*0.15} y={h*0.65} width={w*0.7} height="2"/>
        </g>
      )}
      {variant === 3 && (
        <g fill={sil} fillOpacity="0.85">
          <polygon points={`${w*0.15},${h*0.78} ${w*0.85},${h*0.78} ${w/2},${h*0.30}`}/>
        </g>
      )}
      {variant === 4 && (
        <g fill={sil} fillOpacity="0.85">
          <rect x={w*0.20} y={h*0.40} width={w*0.16} height={h*0.38}/>
          <rect x={w*0.42} y={h*0.32} width={w*0.16} height={h*0.46}/>
          <rect x={w*0.64} y={h*0.45} width={w*0.16} height={h*0.33}/>
        </g>
      )}
      {/* hero stamp */}
      {type === 'hero' && (
        <circle cx={w*0.85} cy={h*0.12} r="6" fill="none" stroke="#f6e6b0" strokeWidth="1.2"/>
      )}
    </svg>
  );
}

// ────────────────────────────────────────────────────────────
// GameCard — card with portrait + frame, sized by `size` prop.
// theme: 'a' parchment | 'b' neon | 'c' lab
// ────────────────────────────────────────────────────────────
function GameCard({ card, size = 'md', theme = 'a', selected = false, dimmed = false, label, onClick, style }) {
  const dims = {
    xs: { w: 44,  h: 62 },
    sm: { w: 60,  h: 86 },
    md: { w: 80,  h: 112 },
    lg: { w: 110, h: 154 },
    xl: { w: 180, h: 252 },
  }[size] || { w: 80, h: 112 };

  const f = FACTIONS[card.faction] || FACTIONS.neutral;
  const isSpecial = card.type === 'special' || card.type === 'weather';
  const strengthColor = card.type === 'hero' ? '#f6e6b0'
    : card.ability && card.ability !== 'none' ? '#f0e2a8' : '#fff';
  const strengthBg = card.type === 'hero' ? '#7a1818' : '#1a1a1a';

  // Frame styling per direction
  const frame = theme === 'a' ? {
    border: '1px solid #2a1f10',
    boxShadow: '0 0 0 1px rgba(255,235,180,0.25) inset, 0 2px 4px rgba(40,25,10,0.45)',
    background: '#1a140c',
    radius: 4,
  } : theme === 'b' ? {
    border: '1px solid rgba(255,255,255,0.12)',
    boxShadow: selected ? '0 0 0 2px var(--accent, #00e0a4), 0 0 24px rgba(0,224,164,0.35)' : '0 4px 12px rgba(0,0,0,0.5)',
    background: '#0d1118',
    radius: 8,
  } : {
    border: '1px solid rgba(0,0,0,0.6)',
    boxShadow: 'none',
    background: '#fff',
    radius: 2,
  };

  return (
    <div
      onClick={onClick}
      title={`${card.name} · ${f.name} · ${card.strength || (isSpecial ? 'Special' : 0)}`}
      style={{
        width: dims.w, height: dims.h,
        position: 'relative',
        borderRadius: frame.radius,
        border: frame.border,
        boxShadow: selected && theme !== 'b' ? `0 0 0 2px var(--accent), ${frame.boxShadow}` : frame.boxShadow,
        background: frame.background,
        opacity: dimmed ? 0.45 : 1,
        cursor: onClick ? 'pointer' : 'default',
        overflow: 'hidden',
        transition: 'transform .15s, box-shadow .15s',
        transform: selected ? 'translateY(-6px)' : 'none',
        flex: '0 0 auto',
        ...style,
      }}>
      {/* Art */}
      <div style={{ position: 'absolute', inset: theme === 'a' ? 3 : 2, borderRadius: Math.max(0, frame.radius-2), overflow: 'hidden' }}>
        <SvgCardArt cardId={card.id} faction={card.faction} type={card.type} theme={theme} w={dims.w} h={dims.h}/>
      </div>

      {/* Strength badge (top-left) — units/heroes only */}
      {!isSpecial && (
        <div style={{
          position: 'absolute', top: 2, left: 2,
          width: dims.w * 0.26, height: dims.w * 0.26,
          minWidth: 16, minHeight: 16,
          borderRadius: '50%',
          background: strengthBg,
          color: strengthColor,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: theme === 'c' ? 'var(--font-mono)' : 'var(--font-display)',
          fontWeight: 700,
          fontSize: dims.w * 0.18,
          border: '1px solid rgba(255,235,180,0.55)',
          textShadow: '0 1px 0 rgba(0,0,0,0.6)',
        }}>{card.strength}</div>
      )}

      {/* Special card banner */}
      {isSpecial && (
        <div style={{
          position: 'absolute', top: 2, left: 2, right: 2,
          padding: '2px 4px', textAlign: 'center',
          fontSize: Math.max(8, dims.w * 0.10),
          fontFamily: 'var(--font-display)',
          letterSpacing: '0.06em', textTransform: 'uppercase',
          color: '#f0e2a8', background: 'rgba(0,0,0,0.55)',
          borderRadius: 2,
        }}>{card.type === 'weather' ? 'Weather' : 'Special'}</div>
      )}

      {/* Ability glyph badge (bottom-right) */}
      {card.ability && card.ability !== 'none' && (
        <div style={{
          position: 'absolute', bottom: 2, right: 2,
          width: dims.w * 0.22, height: dims.w * 0.22,
          minWidth: 14, minHeight: 14,
          borderRadius: '50%',
          background: 'rgba(0,0,0,0.7)',
          color: '#f6e6b0',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: dims.w * 0.16,
          border: '1px solid rgba(246,230,176,0.4)',
        }}>{ABILITY_GLYPH[card.ability] || '·'}</div>
      )}

      {/* Name plate */}
      {dims.h >= 86 && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          padding: dims.w >= 80 ? '4px 6px 5px' : '3px 4px 4px',
          background: 'linear-gradient(to top, rgba(0,0,0,0.85), rgba(0,0,0,0.55) 60%, transparent)',
          color: '#f0e2c0',
          fontFamily: 'var(--font-display)',
          fontSize: Math.max(8, dims.w * 0.10),
          lineHeight: 1.1,
          textAlign: 'center',
          letterSpacing: '0.02em',
          textTransform: theme === 'b' ? 'uppercase' : 'none',
          textShadow: '0 1px 2px rgba(0,0,0,0.9)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{label || card.name}</div>
      )}

      {/* Faction stripe */}
      <div style={{
        position: 'absolute', top: 0, right: 0, width: 3, bottom: 0,
        background: f.color, opacity: theme === 'c' ? 0.85 : 0.7,
      }}/>
    </div>
  );
}

// Card back — never reveals identity
function CardBack({ size = 'md', theme = 'a', faction = 'neutral', style }) {
  const dims = { xs:{w:44,h:62}, sm:{w:60,h:86}, md:{w:80,h:112}, lg:{w:110,h:154} }[size] || { w: 80, h: 112 };
  const f = FACTIONS[faction] || FACTIONS.neutral;
  const radius = theme === 'a' ? 4 : theme === 'b' ? 8 : 2;
  return (
    <div style={{
      width: dims.w, height: dims.h, borderRadius: radius,
      background: theme === 'a'
        ? `repeating-linear-gradient(45deg, #2a1810 0 6px, #1a0e08 6px 12px)`
        : theme === 'b'
        ? `repeating-linear-gradient(135deg, #0a0d12 0 8px, #161c26 8px 16px)`
        : `repeating-linear-gradient(0deg, #2a2a2a 0 4px, #1a1a1a 4px 8px)`,
      border: '1px solid rgba(0,0,0,0.6)',
      boxShadow: theme === 'b' ? '0 4px 12px rgba(0,0,0,0.5)' : '0 1px 2px rgba(0,0,0,0.4)',
      position: 'relative', flex: '0 0 auto', ...style,
    }}>
      <div style={{
        position: 'absolute', inset: 0, display: 'grid', placeItems: 'center',
        color: f.accent, opacity: 0.55,
        fontFamily: 'var(--font-display)', fontSize: dims.w * 0.32, fontWeight: 700,
      }}>{f.short}</div>
    </div>
  );
}

Object.assign(window, { FACTIONS, CARDS, ROW_LABEL, ROW_GLYPH, ABILITY_GLYPH, SvgCardArt, GameCard, CardBack });
