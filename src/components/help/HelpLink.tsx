import Link from "next/link";
import type { ReactNode } from "react";

export type HelpLinkProps = {
  /** Slug of the target user-guide page, e.g. "evidence-coverage". */
  slug: string;
  /** Optional heading id on that page, without the leading #. */
  hash?: string;
  children: ReactNode;
  className?: string;
};

/**
 * Contextual link into the in-app Help guide. Same-tab navigation so Help
 * remains part of the application and the browser Back button returns to
 * the previous screen.
 */
export function HelpLink({
  slug,
  hash,
  children,
  className = "",
}: HelpLinkProps) {
  const href = hash ? `/help/${slug}#${hash}` : `/help/${slug}`;
  return (
    <Link
      href={href}
      className={`text-accent underline underline-offset-2 hover:text-accent-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring ${className}`}
    >
      {children}
    </Link>
  );
}
