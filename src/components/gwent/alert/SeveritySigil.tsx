import React from "react";

export type AlertSeverity = "info" | "warn" | "error" | "confirm" | "success" | "crown";

interface SeveritySigilProps {
  readonly severity: AlertSeverity;
  readonly variant?: "mark" | "seal";
  readonly size?: number;
}

const severityGlyph = (severity: AlertSeverity) => {
  switch (severity) {
    case "info":
      return (
        <>
          <circle cx="9" cy="9" r="7.5" />
          <circle cx="9" cy="5" r="0.9" fill="currentColor" stroke="none" />
          <path d="M9 8 L9 13" />
        </>
      );
    case "warn":
      return (
        <>
          <path d="M9 2 L16.5 15.5 L1.5 15.5 Z" />
          <path d="M9 7 L9 11" />
          <circle cx="9" cy="13" r="0.9" fill="currentColor" stroke="none" />
        </>
      );
    case "error":
      return (
        <>
          <circle cx="9" cy="9" r="7.5" />
          <path d="M5.5 5.5 L12.5 12.5 M12.5 5.5 L5.5 12.5" />
        </>
      );
    case "confirm":
      return (
        <>
          <circle cx="9" cy="9" r="7.5" />
          <path d="M6.5 7 Q6.5 4.5 9 4.5 Q11.5 4.5 11.5 7 Q11.5 8.5 9 9.5 L9 11" />
          <circle cx="9" cy="13" r="0.9" fill="currentColor" stroke="none" />
        </>
      );
    case "success":
      return <path d="M3 9.5 L7 13 L15 5" />;
    case "crown":
      return <path d="M2 7 L4 11 L6 6 L9 11 L12 6 L14 11 L16 7 L15 13 L3 13 Z" fill="currentColor" />;
  }
};

export const SeveritySigil: React.FC<SeveritySigilProps> = ({ severity, variant = "mark", size = variant === "seal" ? 44 : 18 }) => {
  if (variant === "seal") {
    return (
      <svg className="authentic-alert__seal-sigil" width={size} height={size} viewBox="0 0 44 44" aria-hidden="true">
        <path
          d="M22 3 C30 4 38 8 40 16 C42 24 39 32 33 38 C27 42 17 42 11 38 C5 33 2 24 4 16 C7 7 14 3 22 3 Z"
          className="authentic-alert__seal-wax"
        />
        <ellipse cx="14" cy="11" rx="6" ry="3" className="authentic-alert__seal-highlight" />
        <g transform="translate(13 13)">
          <svg width="18" height="18" viewBox="0 0 18 18" className="authentic-alert__seal-mark">
            {severityGlyph(severity)}
          </svg>
        </g>
      </svg>
    );
  }

  return (
    <svg className="authentic-alert__mark" width={size} height={size} viewBox="0 0 18 18" aria-hidden="true">
      {severityGlyph(severity)}
    </svg>
  );
};

export default SeveritySigil;
