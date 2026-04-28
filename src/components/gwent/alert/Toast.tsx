import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import AuthenticButton from "../AuthenticButton";
import SeveritySigil, { type AlertSeverity } from "./SeveritySigil";
import "./alert.css";

export interface ToastProps {
  readonly severity?: AlertSeverity;
  readonly message: React.ReactNode;
  readonly open: boolean;
  readonly onDismiss: () => void;
  readonly autoDismissMs?: number;
  readonly testId?: string;
}

export const Toast: React.FC<ToastProps> = ({
  severity = "success",
  message,
  open,
  onDismiss,
  autoDismissMs = 4000,
  testId = "authentic-toast",
}) => {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!open || hovered || focused) return;
    const timeout = window.setTimeout(onDismiss, autoDismissMs);
    return () => window.clearTimeout(timeout);
  }, [autoDismissMs, focused, hovered, onDismiss, open]);

  if (!open) return null;

  return createPortal(
    <div
      className={`gwent-authentic authentic-toast authentic-toast--${severity}`}
      data-testid={testId}
      role="status"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    >
      <SeveritySigil severity={severity} />
      <span>{message}</span>
      <AuthenticButton
        type="button"
        variant="ghost"
        icon
        aria-label="dismiss notification"
        onClick={onDismiss}
      >
        x
      </AuthenticButton>
    </div>,
    document.body,
  );
};

export default Toast;
