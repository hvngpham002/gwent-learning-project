import React from "react";

import AuthenticButton, { type AuthenticButtonSize, type AuthenticButtonVariant } from "../AuthenticButton";
import SeveritySigil, { type AlertSeverity } from "./SeveritySigil";
import "./alert.css";

export type { AlertSeverity };
export type AlertVariant = "seal" | "ledger";
export type AlertActionKind = Extract<AuthenticButtonVariant, "primary" | "secondary" | "ghost" | "destructive">;

export interface AlertAction {
  readonly label: string;
  readonly onClick: () => void;
  readonly kind?: AlertActionKind;
  readonly size?: AuthenticButtonSize;
  readonly disabled?: boolean;
  readonly testId?: string;
}

export interface AlertProps {
  readonly severity: AlertSeverity;
  readonly variant?: AlertVariant;
  readonly eyebrow?: string;
  readonly title: string;
  readonly body?: React.ReactNode;
  readonly actions?: readonly AlertAction[];
  readonly dismissible?: boolean;
  readonly onDismiss?: () => void;
  readonly testId?: string;
  readonly className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  severity,
  variant = "ledger",
  eyebrow,
  title,
  body,
  actions = [],
  dismissible = false,
  onDismiss,
  testId,
  className = "",
}) => {
  const titleId = `${testId ?? "authentic-alert"}-title`;
  return (
    <section
      className={`authentic-alert authentic-alert--${variant} authentic-alert--${severity}${className ? ` ${className}` : ""}`}
      data-testid={testId ?? "authentic-alert"}
      data-severity={severity}
      data-variant={variant}
      aria-labelledby={titleId}
    >
      {variant === "seal" ? (
        <div className="authentic-alert__seal-header">
          <SeveritySigil severity={severity} variant="seal" />
          <div className="authentic-alert__header-copy">
            {eyebrow ? <span className="authentic-alert__eyebrow">{eyebrow}</span> : null}
            <h2 id={titleId}>{title}</h2>
          </div>
        </div>
      ) : (
        <>
          <div className="authentic-alert__stripe" aria-hidden="true" />
          <div className="authentic-alert__ledger-corners" aria-hidden="true" />
          <div className="authentic-alert__ledger-header">
            <SeveritySigil severity={severity} />
            {eyebrow ? <span className="authentic-alert__eyebrow">{eyebrow}</span> : null}
            <span className="authentic-alert__header-rule" aria-hidden="true" />
          </div>
          <h2 id={titleId}>{title}</h2>
        </>
      )}

      {body ? <div className="authentic-alert__body">{body}</div> : null}

      {(dismissible && onDismiss) || actions.length > 0 ? (
        <div className="authentic-alert__actions">
          {dismissible && onDismiss ? (
            <AuthenticButton
              type="button"
              variant="ghost"
              className="authentic-alert__button authentic-alert__button--ghost"
              onClick={onDismiss}
            >
              dismiss
            </AuthenticButton>
          ) : null}
          {actions.map((action) => {
            const kind = action.kind ?? "ghost";
            return (
              <AuthenticButton
                key={action.label}
                type="button"
                variant={kind}
                size={action.size}
                className={`authentic-alert__button authentic-alert__button--${kind}`}
                disabled={action.disabled}
                data-testid={action.testId}
                onClick={action.onClick}
              >
                {action.label}
              </AuthenticButton>
            );
          })}
        </div>
      ) : null}
    </section>
  );
};

export default Alert;
