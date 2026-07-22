import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "default" | "primary" | "danger";
export type ButtonSize = "sm" | "md";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
};

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  default: "btn",
  primary: "btn btn-primary",
  danger: "btn btn-danger",
};

/**
 * Thin wrapper over shared `.btn` CSS primitives.
 */
export function Button({
  variant = "default",
  size = "md",
  className = "",
  type = "button",
  children,
  ...rest
}: ButtonProps) {
  const sizeClass = size === "sm" ? "btn-sm" : "";
  return (
    <button
      type={type}
      className={`${VARIANT_CLASS[variant]} ${sizeClass} ${className}`.trim()}
      {...rest}
    >
      {children}
    </button>
  );
}
