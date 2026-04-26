import React, { useEffect, useState } from "react";

import { getAbilityDisplay, getFactionDisplay, getRowDisplay } from "./displayMetadata";
import {
  type AuthenticCardSize,
  type AuthenticCardViewModel,
  dimensionsForSize,
  shouldRenderStrength,
  sourceFaceBottomCropForSize,
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
  const sourceFaceBottomCrop = sourceFaceBottomCropForSize(size);
  const faction = getFactionDisplay(card.faction);
  const isSpecial = card.kind === "special";
  const isHero = card.kind === "hero";
  const showStrength = shouldRenderStrength(card);
  const [imageFailed, setImageFailed] = useState(false);
  const renderArt = imageFailed || !card.image;
  const interactive = typeof onClick === "function";
  const primaryAbility = (card.abilities ?? []).find((id) => id !== "none");
  const ability = primaryAbility ? getAbilityDisplay(primaryAbility) : null;
  const rowDisplays = card.rows.map((row) => getRowDisplay(row));
  const primaryRow = showStrength ? rowDisplays[0] : null;
  const rowTitle =
    rowDisplays.length > 1 ? rowDisplays.map((row) => row.name).join(" / ") : primaryRow?.name;
  const showRowBadge = renderArt && showStrength && Boolean(primaryRow);
  const factionName = faction.name;
  const ariaParts = [card.name, factionName, isSpecial ? "Special" : `Strength ${card.strength}`];
  if (ability && ability.glyph) {
    ariaParts.push(ability.name);
  }
  const ariaLabel = ariaParts.join(", ");

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
      className={`authentic-card authentic-card--${size}${renderArt ? " is-synthetic" : " is-source-face"}${selected ? " is-selected" : ""}${dimmed ? " is-dimmed" : ""}${interactive ? " is-interactive" : ""}`}
      style={{
        width: dims.width,
        height: dims.height,
        "--authentic-card-face-crop-bottom": `${sourceFaceBottomCrop}px`,
      } as React.CSSProperties}
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

      {showStrength && (
        <div
          className={`authentic-card__strength${isHero ? " authentic-card__strength--hero" : ""}`}
          aria-hidden="true"
        >
          <span>{card.strength}</span>
        </div>
      )}

      {renderArt && isSpecial && (
        <div className="authentic-card__banner" aria-hidden="true">
          {card.tags.includes("weather") ? "Weather" : "Special"}
        </div>
      )}

      {showRowBadge && primaryRow && (
        <div className="authentic-card__row" title={rowTitle} aria-hidden="true">
          {primaryRow.glyph}
        </div>
      )}

      {renderArt && ability && ability.glyph && (
        <div
          className={`authentic-card__ability${showRowBadge ? " is-after-row" : ""}`}
          title={ability.name}
          aria-hidden="true"
        >
          {ability.glyph}
        </div>
      )}

      {renderArt && dims.height >= 86 && (
        <div className="authentic-card__nameplate">
          <span>{card.name}</span>
        </div>
      )}

      {renderArt && (
        <div className="authentic-card__stripe" style={{ background: faction.color }} aria-hidden="true" />
      )}
    </div>
  );
};

export default AuthenticCard;
