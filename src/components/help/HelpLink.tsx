import Link from "next/link";
import type { ReactNode } from "react";

export type HelpLinkProps = {
  /** Slug of the target user-guide page, e.g. "evidence-coverage". */
  slug: string;
  children: ReactNode;
  className?: string;
};

/**
 * Small contextual link into the in-app Help guide. Opens in a new tab so a
 * user mid-edit (e.g. an implementation narrative) never loses unsaved work
 * by navigating away.
 */
export function HelpLink({ slug, children, className = "" }: HelpLinkProps) {
  return (
    <Link
      href={`/help/${slug}`}
      target="_blank"
      rel="noopener noreferrer"
      className={`text-accent underline underline-offset-2 hover:text-accent-hover ${className}`}
    >
      {children}
    </Link>
  );
}
