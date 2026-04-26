import React, { useEffect, useState } from "react";

import { getAbilityDisplay, getFactionDisplay } from "./displayMetadata";
import {
  type AuthenticCardSize,
  type AuthenticCardViewModel,
  dimensionsForSize,
  shouldRenderStrength,
} from "./cardViewModel";
import SvgCardArt from "./SvgCardArt";

interface AuthenticCardProps {
  readonly card: AuthenticCardViewModel;
  readonly size?: AuthenticCardSize;
  readonly selected?: boolean;
  readonly dimmed?: boolean;
  readonly onClick?: () => void;
  readonly testId?: string;
}

const AuthenticCard: React.FC<AuthenticCardProps> = ({
  card,
  size = "md",
  selected = false,
  dimmed = false,
  onClick,
  testId,
}) => {
  const dims = dimensionsForSize(size);
  const faction = getFactionDisplay(card.faction);
  const isSpecial = card.kind === "special";
  const isHero = card.kind === "hero";
  const showStrength = shouldRenderStrength(card);
  const primaryAbility = (card.abilities ?? []).find((id) => id !== "none");
  const ability = primaryAbility ? getAbilityDisplay(primaryAbility) : null;
  const factionName = faction.name;
  const ariaParts = [card.name, factionName, isSpecial ? "Special" : `Strength ${card.strength}`];
  if (ability && ability.glyph) {
    ariaParts.push(ability.name);
  }
  const ariaLabel = ariaParts.join(", ");

  const [imageFailed, setImageFailed] = useState(false);
  const renderArt = imageFailed || !card.image;
  const renderSyntheticOverlays = renderArt;
  const interactive = typeof onClick === "function";

  useEffect(() => {
    setImageFailed(false);
  }, [card.image]);

  const handleKey: React.KeyboardEventHandler<HTMLDivElement> = (event) => {
    if (!interactive) {
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onClick?.();
    }
  };

  return (
    <div
      role={interactive ? "button" : "img"}
      tabIndex={interactive ? 0 : -1}
      aria-label={ariaLabel}
      aria-pressed={interactive ? selected : undefined}
      onClick={interactive ? onClick : undefined}
      onKeyDown={interactive ? handleKey : undefined}
      data-testid={testId ?? "authentic-card"}
      data-faction={faction.id}
      data-kind={card.kind}
      data-selected={selected ? "true" : undefined}
      className={`authentic-card authentic-card--${size}${renderSyntheticOverlays ? " is-synthetic" : " is-source-face"}${selected ? " is-selected" : ""}${dimmed ? " is-dimmed" : ""}${interactive ? " is-interactive" : ""}`}
      style={{ width: dims.width, height: dims.height }}
    >
      <div className="authentic-card__art">
        {renderArt ? (
          <SvgCardArt
            sourceId={card.sourceId}
            faction={String(card.faction)}
            kind={String(card.kind)}
            width={dims.width}
            height={dims.height}
          />
        ) : (
          <img
            src={card.image ?? undefined}
            alt=""
            className="authentic-card__image"
            onError={() => setImageFailed(true)}
            draggable={false}
          />
        )}
      </div>

      {renderSyntheticOverlays && showStrength && (
        <div
          className={`authentic-card__strength${isHero ? " authentic-card__strength--hero" : ""}`}
          aria-hidden="true"
        >
          <span>{card.strength}</span>
        </div>
      )}

      {renderSyntheticOverlays && isSpecial && (
        <div className="authentic-card__banner" aria-hidden="true">
          {card.tags.includes("weather") ? "Weather" : "Special"}
        </div>
      )}

      {renderSyntheticOverlays && ability && ability.glyph && (
        <div className="authentic-card__ability" title={ability.name} aria-hidden="true">
          {ability.glyph}
        </div>
      )}

      {renderSyntheticOverlays && dims.height >= 86 && (
        <div className="authentic-card__nameplate">
          <span>{card.name}</span>
        </div>
      )}

      {renderSyntheticOverlays && (
        <div className="authentic-card__stripe" style={{ background: faction.color }} aria-hidden="true" />
      )}
    </div>
  );
};

export default AuthenticCard;
