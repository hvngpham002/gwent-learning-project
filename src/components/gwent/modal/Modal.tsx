import React, { useCallback, useEffect, useRef, type ReactNode } from "react";

import AuthenticButton, { type AuthenticButtonProps } from "../AuthenticButton";

type SealKind = "confirm" | "check" | "crown";
type ButtonVariant = "ghost" | "primary" | "destructive";

interface MarkProps {
  readonly kind: SealKind;
  readonly size?: number;
  readonly color?: string;
}

const Mark: React.FC<MarkProps> = ({ kind, size = 18, color = "currentColor" }) => {
  if (kind === "confirm") {
    return (
      <svg width={size} height={size} viewBox="0 0 18 18" aria-hidden="true">
        <circle cx="9" cy="9" r="7.5" fill="none" stroke={color} strokeWidth="1.2" />
        <path
          d="M6.5 7 Q6.5 4.5 9 4.5 Q11.5 4.5 11.5 7 Q11.5 8.5 9 9.5 L9 11"
          stroke={color}
          strokeWidth="1.4"
          fill="none"
          strokeLinecap="round"
        />
        <circle cx="9" cy="13" r="0.9" fill={color} />
      </svg>
    );
  }

  if (kind === "check") {
    return (
      <svg width={size} height={size} viewBox="0 0 18 18" aria-hidden="true">
        <path
          d="M3 9.5 L7 13 L15 5"
          stroke={color}
          strokeWidth="1.6"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg width={size} height={size} viewBox="0 0 18 18" aria-hidden="true">
      <path
        d="M2 7 L4 11 L6 6 L9 11 L12 6 L14 11 L16 7 L15 13 L3 13 Z"
        fill={color}
        stroke={color}
        strokeWidth="0.6"
        strokeLinejoin="round"
      />
    </svg>
  );
};

const SEAL_COLORS: Record<SealKind, { readonly ring: string; readonly wax: string; readonly glyph: string }> = {
  confirm: { ring: "#4a3f2e", wax: "#6e5d44", glyph: "#e8dfc4" },
  check: { ring: "#4a5a30", wax: "#6a7a40", glyph: "#e8efc4" },
  crown: { ring: "#7a5a20", wax: "#b88a3a", glyph: "#3a2a08" },
};

const WaxSeal: React.FC<{ readonly kind: SealKind; readonly size?: number }> = ({ kind, size = 48 }) => {
  const colors = SEAL_COLORS[kind];
  const gradientId = React.useId();

  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <defs>
        <radialGradient id={gradientId} cx="0.4" cy="0.35">
          <stop offset="0%" stopColor={colors.wax} />
          <stop offset="60%" stopColor={colors.wax} />
          <stop offset="100%" stopColor={colors.ring} />
        </radialGradient>
      </defs>
      <path
        d="M24 4 C 33 5 41 9 43 18 C 45 27 42 35 36 41 C 30 45 18 45 12 41 C 6 36 3 27 5 18 C 8 8 16 4 24 4 Z"
        fill={`url(#${gradientId})`}
        stroke={colors.ring}
        strokeWidth="0.9"
        opacity="0.96"
      />
      <ellipse cx="15" cy="13" rx="6" ry="3" fill="#fff" opacity="0.18" />
      <g transform="translate(15,15)" opacity="0.97">
        <Mark kind={kind} size={18} color={colors.glyph} />
      </g>
    </svg>
  );
};

const Corners: React.FC<{ readonly color?: string }> = ({ color = "rgba(31,26,18,0.55)" }) => {
  const positions: readonly React.CSSProperties[] = [
    { top: -1, left: -1, transform: "none" },
    { top: -1, right: -1, transform: "scaleX(-1)" },
    { bottom: -1, left: -1, transform: "scaleY(-1)" },
    { bottom: -1, right: -1, transform: "scale(-1,-1)" },
  ];

  return (
    <>
      {positions.map((position, index) => (
        <svg
          key={index}
          width="18"
          height="18"
          viewBox="0 0 18 18"
          aria-hidden="true"
          style={{ position: "absolute", pointerEvents: "none", ...position }}
        >
          <path d="M0 0 L18 0 M0 0 L0 18 M3 3 L14 3 M3 3 L3 14" stroke={color} strokeWidth="0.9" fill="none" />
          <circle cx="3" cy="3" r="1.1" fill={color} />
        </svg>
      ))}
    </>
  );
};

interface ModalButtonProps extends Omit<AuthenticButtonProps, "variant"> {
  readonly variant?: ButtonVariant;
}

export const ModalButton = React.forwardRef<HTMLButtonElement, ModalButtonProps>(function ModalButton(
  { variant = "ghost", className = "", ...rest },
  ref,
) {
  return (
    <AuthenticButton
      ref={ref}
      variant={variant}
      className={`authentic-modal__button${className ? ` ${className}` : ""}`}
      {...rest}
    />
  );
});

export interface ModalProps {
  readonly open: boolean;
  readonly kind: SealKind;
  readonly eyebrow: string;
  readonly title: ReactNode;
  readonly body: ReactNode;
  readonly actions: ReactNode;
  readonly onCancel: () => void;
  readonly onConfirm?: () => void;
  readonly width?: number;
  readonly scrimOpacity?: number;
  readonly id?: string;
  readonly testId?: string;
}

export const Modal: React.FC<ModalProps> = ({
  open,
  kind,
  eyebrow,
  title,
  body,
  actions,
  onCancel,
  onConfirm,
  width = 520,
  scrimOpacity = 0.55,
  id,
  testId,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const lastFocused = useRef<HTMLElement | null>(null);
  const generatedTitleId = React.useId();
  const titleId = id ?? generatedTitleId;
  const bodyId = `${titleId}-body`;
  const accent = kind === "confirm" ? "#4a3f2e" : kind === "check" ? "#4a5a30" : "#b88a3a";

  const onKey = useCallback(
    (event: KeyboardEvent) => {
      if (!open) {
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        onCancel();
        return;
      }

      if (event.key === "Enter" && onConfirm) {
        const target = event.target as HTMLElement;
        if (target.tagName !== "TEXTAREA" && target.tagName !== "INPUT" && target.tagName !== "BUTTON") {
          event.preventDefault();
          onConfirm();
        }
        return;
      }

      if (event.key === "Tab" && cardRef.current) {
        const focusables = cardRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (focusables.length === 0) {
          return;
        }
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement as HTMLElement | null;
        if (event.shiftKey && active === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && active === last) {
          event.preventDefault();
          first.focus();
        }
      }
    },
    [open, onCancel, onConfirm],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    lastFocused.current = document.activeElement as HTMLElement | null;
    window.requestAnimationFrame(() => {
      const buttons = cardRef.current?.querySelectorAll<HTMLButtonElement>("button");
      buttons?.[buttons.length - 1]?.focus();
    });
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      lastFocused.current?.focus?.();
    };
  }, [open, onKey]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="gwent-authentic authentic-modal-shell"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={bodyId}
      data-testid={testId}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "grid",
        placeItems: "center",
        background: "transparent",
      }}
    >
      <div
        onClick={onCancel}
        style={{
          position: "absolute",
          inset: 0,
          background: `rgba(20, 14, 6, ${scrimOpacity})`,
          backdropFilter: "blur(1.5px)",
          WebkitBackdropFilter: "blur(1.5px)",
        }}
      />
      <div
        ref={cardRef}
        style={{
          position: "relative",
          width,
          maxWidth: "calc(100vw - 32px)",
          background: "var(--bg-paper, #e8dfc4)",
          border: "1px solid rgba(31,26,18,0.55)",
          borderRadius: 4,
          boxShadow:
            "0 1px 0 rgba(255,255,255,0.5) inset, 0 22px 50px rgba(0,0,0,0.55), 0 6px 18px rgba(40,28,12,0.45)",
          backgroundImage:
            "radial-gradient(ellipse at top right, rgba(255,255,255,0.20), transparent 55%), radial-gradient(ellipse at bottom left, rgba(110,80,40,0.10), transparent 55%)",
          padding: "22px 26px",
        }}
      >
        <Corners />
        <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
          <div style={{ flex: "0 0 auto", marginTop: 2 }}>
            <WaxSeal kind={kind} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontFamily: 'var(--font-body, "EB Garamond", Georgia, serif)',
                fontSize: 12,
                fontWeight: 600,
                color: accent,
                textTransform: "none",
                letterSpacing: 0,
              }}
            >
              {eyebrow}
            </div>
            <h2
              id={titleId}
              style={{
                fontFamily: 'var(--font-display, "EB Garamond", Georgia, serif)',
                fontStyle: "normal",
                fontWeight: 700,
                fontSize: 26,
                color: "#1f1a12",
                lineHeight: 1.1,
                margin: "4px 0 0",
              }}
            >
              {title}
            </h2>
            <p
              id={bodyId}
              style={{
                fontFamily: 'var(--font-body, "EB Garamond", Georgia, serif)',
                fontStyle: "normal",
                fontSize: 14,
                color: "#4a3f2e",
                lineHeight: 1.55,
                margin: "10px 0 0",
              }}
            >
              {body}
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
          {actions}
        </div>
      </div>
    </div>
  );
};
