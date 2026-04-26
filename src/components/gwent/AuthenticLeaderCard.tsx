import React, { useEffect, useState } from "react";

import type { CatalogFaction } from "@/game/catalog";

import { dimensionsForSize } from "./cardViewModel";
import { getFactionDisplay } from "./displayMetadata";
import "./authentic-leader-card.css";

export interface AuthenticLeaderCardViewModel {
  readonly sourceId: string;
  readonly name: string;
  readonly faction: CatalogFaction | string;
  readonly abilityName: string;
  readonly image?: string | null;
}

interface AuthenticLeaderCardProps {
  readonly leader: AuthenticLeaderCardViewModel;
  readonly size?: "compact" | "pregame";
}

const dimensionsBySize = {
  compact: dimensionsForSize("xs"),
  pregame: dimensionsForSize("sm"),
} as const;

const AuthenticLeaderCard: React.FC<AuthenticLeaderCardProps> = ({ leader, size = "compact" }) => {
  const [imageFailed, setImageFailed] = useState(false);
  const faction = getFactionDisplay(leader.faction);
  const dimensions = dimensionsBySize[size];
  const showFallback = imageFailed || !leader.image;

  useEffect(() => {
    setImageFailed(false);
  }, [leader.image]);

  return (
    <figure
      className={`authentic-leader-card authentic-leader-card--${size}`}
      data-testid="authentic-leader-card"
      data-faction={faction.id}
      style={{ width: dimensions.width, minHeight: dimensions.height } as React.CSSProperties}
      aria-label={`${leader.name}, ${leader.abilityName}`}
    >
      <div className="authentic-leader-card__frame" style={{ height: dimensions.height }}>
        {showFallback ? (
          <div
            className="authentic-leader-card__fallback"
            data-testid="authentic-leader-card-fallback"
            style={{ borderColor: faction.color }}
          >
            <span>{faction.short}</span>
            <strong>{leader.name.split(":")[0]}</strong>
          </div>
        ) : (
          <img
            src={leader.image ?? undefined}
            alt=""
            className="authentic-leader-card__image"
            data-testid="authentic-leader-card-image"
            onError={() => setImageFailed(true)}
            draggable={false}
          />
        )}
      </div>
      {size === "pregame" ? (
        <figcaption>
          <strong>{leader.name}</strong>
          <span>{leader.abilityName}</span>
        </figcaption>
      ) : null}
    </figure>
  );
};

export default AuthenticLeaderCard;
