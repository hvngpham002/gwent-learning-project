import React from "react";

import { getFactionDisplay } from "./displayMetadata";
import { type AuthenticCardSize, dimensionsForSize } from "./cardViewModel";

interface AuthenticCardBackProps {
  readonly size?: AuthenticCardSize;
  readonly faction?: string;
  readonly testId?: string;
  readonly label?: string;
}

const AuthenticCardBack: React.FC<AuthenticCardBackProps> = ({
  size = "md",
  faction = "neutral",
  testId,
  label,
}) => {
  const dims = dimensionsForSize(size);
  const display = getFactionDisplay(faction);
  const ariaLabel = label ?? `Hidden card, ${display.name} sleeve`;

  return (
    <div
      role="img"
      aria-label={ariaLabel}
      data-testid={testId ?? "authentic-card-back"}
      data-faction={display.id}
      className={`authentic-card-back authentic-card-back--${size}`}
      style={{ width: dims.width, height: dims.height }}
    >
      <span className="authentic-card-back__sigil" aria-hidden="true">
        {display.short}
      </span>
    </div>
  );
};

export default AuthenticCardBack;
