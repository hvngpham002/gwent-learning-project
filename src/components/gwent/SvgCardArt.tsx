import React, { useId } from "react";

import { getFactionDisplay } from "./displayMetadata";

interface SvgCardArtProps {
  readonly sourceId: string;
  readonly faction: string;
  readonly kind: string;
  readonly width: number;
  readonly height: number;
}

const fnv1aHash = (input: string): number => {
  let hash = 2166136261 >>> 0;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return hash;
};

const SvgCardArt: React.FC<SvgCardArtProps> = ({ sourceId, faction, kind, width, height }) => {
  const display = getFactionDisplay(faction);
  const instanceId = useId().replace(/[^a-zA-Z0-9_-]/g, "-");
  const seed = fnv1aHash(sourceId || faction || "unknown");
  const variant = seed % 5;
  const safeId = (sourceId || `${faction}-${kind}`).replace(/[^a-zA-Z0-9_-]/g, "-");
  const gradientId = `authentic-card-gradient-${safeId}-${instanceId}`;
  const patternId = `authentic-card-pattern-${safeId}-${instanceId}`;

  return (
    <svg
      role="presentation"
      aria-hidden="true"
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid slice"
      style={{ display: "block" }}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={display.color} stopOpacity={0.78} />
          <stop offset="100%" stopColor="#1a140c" stopOpacity={0.85} />
        </linearGradient>
        <pattern id={patternId} patternUnits="userSpaceOnUse" width="6" height="6">
          <path d="M0 6 L6 0" stroke={display.accent} strokeOpacity="0.18" strokeWidth="0.6" />
        </pattern>
      </defs>
      <rect width={width} height={height} fill={`url(#${gradientId})`} />
      <rect width={width} height={height} fill={`url(#${patternId})`} />
      <rect x={0} y={height * 0.78} width={width} height={height * 0.22} fill="#000" fillOpacity="0.18" />
      {variant === 0 && (
        <g fill={display.accent} fillOpacity="0.85">
          <polygon
            points={`${width / 2 - 12},${height * 0.78} ${width / 2 + 12},${height * 0.78} ${width / 2 + 6},${height * 0.32} ${width / 2 - 6},${height * 0.32}`}
          />
          <circle cx={width / 2} cy={height * 0.28} r={Math.max(4, width * 0.08)} />
        </g>
      )}
      {variant === 1 && (
        <g fill={display.accent} fillOpacity="0.8">
          <rect x={width / 2 - 14} y={height * 0.4} width={28} height={height * 0.38} />
          <polygon
            points={`${width / 2 - 18},${height * 0.4} ${width / 2 + 18},${height * 0.4} ${width / 2},${height * 0.2}`}
          />
        </g>
      )}
      {variant === 2 && (
        <g fill={display.accent} fillOpacity="0.8">
          <circle cx={width / 2} cy={height * 0.5} r={Math.min(width, height) * 0.18} />
          <rect x={width * 0.15} y={height * 0.65} width={width * 0.7} height={2} />
        </g>
      )}
      {variant === 3 && (
        <g fill={display.accent} fillOpacity="0.85">
          <polygon
            points={`${width * 0.15},${height * 0.78} ${width * 0.85},${height * 0.78} ${width / 2},${height * 0.3}`}
          />
        </g>
      )}
      {variant === 4 && (
        <g fill={display.accent} fillOpacity="0.85">
          <rect x={width * 0.2} y={height * 0.4} width={width * 0.16} height={height * 0.38} />
          <rect x={width * 0.42} y={height * 0.32} width={width * 0.16} height={height * 0.46} />
          <rect x={width * 0.64} y={height * 0.45} width={width * 0.16} height={height * 0.33} />
        </g>
      )}
      {kind === "hero" && (
        <circle
          cx={width * 0.85}
          cy={height * 0.12}
          r={Math.max(4, width * 0.06)}
          fill="none"
          stroke="#f6e6b0"
          strokeWidth={1.2}
        />
      )}
    </svg>
  );
};

export default SvgCardArt;
