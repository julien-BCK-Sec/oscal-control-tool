import type { ReactNode } from "react";

export type CardProps = {
  children: ReactNode;
  /** Emphasized surface (e.g. Review workflow). */
  prominent?: boolean;
  /** panel = soft sidebar card; surface = bordered content card. */
  variant?: "panel" | "surface";
  className?: string;
  as?: "section" | "div" | "article";
  "aria-labelledby"?: string;
};

export function Card({
  children,
  prominent = false,
  variant = "panel",
  className = "",
  as: Tag = "section",
  "aria-labelledby": ariaLabelledBy,
}: CardProps) {
  const base =
    variant === "surface"
      ? "rounded-md border border-border bg-surface p-4 shadow-[var(--shadow-subtle)]"
      : `ds-card ${prominent ? "ds-card-prominent" : ""}`;
  return (
    <Tag
      aria-labelledby={ariaLabelledBy}
      className={`${base} ${className}`}
    >
      {children}
    </Tag>
  );
}

export type CardHeaderProps = {
  children: ReactNode;
  className?: string;
};

export function CardHeader({ children, className = "" }: CardHeaderProps) {
  return <div className={`mb-2 ${className}`}>{children}</div>;
}

export type CardTitleProps = {
  id?: string;
  children: ReactNode;
  className?: string;
};

/** Sentence-case section title for property cards. */
export function CardTitle({ id, children, className = "" }: CardTitleProps) {
  return (
    <h3
      id={id}
      className={`text-sm font-semibold tracking-tight text-foreground ${className}`}
    >
      {children}
    </h3>
  );
}

export type CardDescriptionProps = {
  children: ReactNode;
  className?: string;
};

export function CardDescription({
  children,
  className = "",
}: CardDescriptionProps) {
  return (
    <p className={`mt-1 text-xs leading-relaxed text-text-secondary ${className}`}>
      {children}
    </p>
  );
}

export type CardContentProps = {
  children: ReactNode;
  className?: string;
};

export function CardContent({ children, className = "" }: CardContentProps) {
  return <div className={className}>{children}</div>;
}

export type CardFooterProps = {
  children: ReactNode;
  className?: string;
};

export function CardFooter({ children, className = "" }: CardFooterProps) {
  return <div className={`mt-3 flex flex-wrap gap-2 ${className}`}>{children}</div>;
}
