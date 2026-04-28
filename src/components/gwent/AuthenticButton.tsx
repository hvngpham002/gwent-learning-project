import React from "react";

export type AuthenticButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "destructive"
  | "tile"
  | "choice"
  | "field";

export type AuthenticButtonSize = "compact" | "flow";

export interface AuthenticButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: AuthenticButtonVariant;
  readonly size?: AuthenticButtonSize;
  readonly icon?: boolean;
  readonly selected?: boolean;
}

export const AuthenticButton = React.forwardRef<HTMLButtonElement, AuthenticButtonProps>(function AuthenticButton(
  { variant = "secondary", size, icon = false, selected = false, className = "", ...rest },
  ref,
) {
  const classes = [
    "authentic-button",
    `authentic-button--${variant}`,
    size ? `authentic-button--${size}` : "",
    icon ? "authentic-button--icon" : "",
    selected ? "is-selected" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <button ref={ref} className={classes} {...rest} />;
});

export default AuthenticButton;
