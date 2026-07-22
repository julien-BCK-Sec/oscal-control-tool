import type { LabelHTMLAttributes, ReactNode } from "react";

export type FormFieldProps = {
  children: ReactNode;
  className?: string;
};

export function FormField({ children, className = "" }: FormFieldProps) {
  return <div className={`min-w-0 ${className}`}>{children}</div>;
}

export type FormLabelProps = LabelHTMLAttributes<HTMLLabelElement> & {
  children: ReactNode;
};

export function FormLabel({
  children,
  className = "",
  ...rest
}: FormLabelProps) {
  return (
    <label className={`label ${className}`.trim()} {...rest}>
      {children}
    </label>
  );
}

export type FormHintProps = {
  children: ReactNode;
  tone?: "muted" | "warning" | "danger";
  className?: string;
  role?: "status" | "alert";
};

export function FormHint({
  children,
  tone = "muted",
  className = "",
  role,
}: FormHintProps) {
  const toneClass =
    tone === "warning"
      ? "text-warning"
      : tone === "danger"
        ? "text-danger"
        : "text-text-muted";
  return (
    <p className={`mt-1 text-xs ${toneClass} ${className}`} role={role}>
      {children}
    </p>
  );
}
