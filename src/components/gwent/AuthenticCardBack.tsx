import React, { useEffect, useMemo, useState } from "react";

import { getFactionDisplay } from "./displayMetadata";
import {
  type AuthenticCardBackVariant,
  type AuthenticCardSize,
  cardBackImageCandidates,
  dimensionsForSize,
} from "./cardViewModel";

interface AuthenticCardBackProps {
  readonly size?: AuthenticCardSize;
  readonly faction?: string;
  readonly variant?: AuthenticCardBackVariant;
  readonly imageCandidates?: readonly string[];
  readonly testId?: string;
  readonly label?: string;
}

const AuthenticCardBack: React.FC<AuthenticCardBackProps> = ({
  size = "md",
  faction = "neutral",
  variant = "deck",
  imageCandidates,
  testId,
  label,
}) => {
  const dims = dimensionsForSize(size);
  const display = getFactionDisplay(faction);
  const candidates = useMemo(
    () => imageCandidates ?? cardBackImageCandidates(faction, variant),
    [faction, imageCandidates, variant],
  );
  const [candidateIndex, setCandidateIndex] = useState(0);
  const imageSrc = candidates[candidateIndex];
  const ariaLabel = label ?? (variant === "discard" ? "Discard pile back" : `Hidden card, ${display.name} sleeve`);

  useEffect(() => {
    setCandidateIndex(0);
  }, [candidates]);

  const tryNextCandidate = () => {
    setCandidateIndex((index) => Math.min(index + 1, candidates.length));
  };
  const hasImage = Boolean(imageSrc);

  return (
    <div
      role="img"
      aria-label={ariaLabel}
      data-testid={testId ?? "authentic-card-back"}
      data-faction={display.id}
      data-variant={variant}
      className={`authentic-card-back authentic-card-back--${size}${hasImage ? " has-image" : " has-sigil"}`}
      style={{ width: dims.width, height: dims.height }}
    >
      {hasImage ? (
        <img
          src={imageSrc}
          alt=""
          className="authentic-card-back__image"
          draggable={false}
          onError={tryNextCandidate}
        />
      ) : (
        <>
          <span
            className="authentic-card-back__faction-field"
            style={{ background: display.color }}
            aria-hidden="true"
          />
          <span className="authentic-card-back__sigil" aria-hidden="true">
            {variant === "discard" ? "X" : display.short}
          </span>
        </>
      )}
    </div>
  );
};

export default AuthenticCardBack;
