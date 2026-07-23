import Link from "next/link";
import type { ReactNode } from "react";
import { Brand } from "@/components/design-system/brand/Brand";

export type ProductHeaderProps = {
  /** Optional trailing actions (notifications, account menu, etc.). */
  actions?: ReactNode;
  /** Compact context line under / beside brand. */
  context?: ReactNode;
  href?: string;
};

/**
 * Top product chrome with responsive Control Freak branding.
 * Lockup on wide screens; CF mark on narrow layouts.
 */
export function ProductHeader({
  actions,
  context,
  href = "/projects",
}: ProductHeaderProps) {
  return (
    <header className="shrink-0 border-b border-border bg-surface">
      <div className="flex h-[var(--product-header-height)] items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-4">
          <Link
            href={href}
            className="inline-flex shrink-0 items-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
            aria-label="Control Freak home"
          >
            <span className="hidden sm:inline-flex">
              <Brand variant="lockup" appearance="auto" size="sm" priority />
            </span>
            <span className="inline-flex sm:hidden">
              <Brand variant="mark" appearance="auto" size="sm" priority />
            </span>
          </Link>
          {context ? (
            <div className="min-w-0 truncate border-l border-border pl-4 text-sm text-text-secondary">
              {context}
            </div>
          ) : null}
        </div>
        {actions ? (
          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        ) : null}
      </div>
    </header>
  );
}

export type AppShellProps = {
  header?: ReactNode;
  children: ReactNode;
  className?: string;
};

/**
 * Full-height application shell: optional product header + scrollable body.
 */
export function AppShell({ header, children, className = "" }: AppShellProps) {
  return (
    <div
      className={`flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-background text-foreground ${className}`}
    >
      {header}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
    </div>
  );
}

export type PageContentProps = {
  children: ReactNode;
  className?: string;
  /** Constrain width for list/settings pages. */
  narrow?: boolean;
};

export function PageContent({
  children,
  className = "",
  narrow = false,
}: PageContentProps) {
  return (
    <div
      className={`mx-auto flex w-full flex-1 flex-col gap-6 overflow-y-auto overflow-x-hidden px-4 py-6 sm:px-8 ${
        narrow ? "max-w-[var(--layout-page-max)]" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}
