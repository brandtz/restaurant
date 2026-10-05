import type { ButtonHTMLAttributes, ReactNode } from "react";
import styles from "./components.module.css";

export type ActionButtonVariant = "primary" | "secondary" | "destructive";

export function ActionButton({
  children,
  className,
  compact = false,
  pending = false,
  type = "button",
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  compact?: boolean;
  pending?: boolean;
  variant?: ActionButtonVariant;
}) {
  const variantClass = {
    primary: styles.actionPrimary,
    secondary: styles.actionSecondary,
    destructive: styles.actionDestructive,
  }[variant];

  return (
    <button
      {...props}
      aria-busy={pending || undefined}
      className={[
        styles.actionButton,
        variantClass,
        compact ? styles.actionCompact : "",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
      disabled={pending || props.disabled}
      type={type}
    >
      {children}
    </button>
  );
}
