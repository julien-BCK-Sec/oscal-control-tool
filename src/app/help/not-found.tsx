import Link from "next/link";

export default function HelpNotFound() {
  return (
    <div
      id="help-main"
      className="mx-auto flex w-full max-w-[var(--layout-help-max)] flex-col gap-3"
    >
      <h1 className="text-xl font-semibold text-foreground">Topic not found</h1>
      <p className="text-sm text-text-secondary">
        That guide page doesn&rsquo;t exist, or the link may be out of date.
      </p>
      <Link
        href="/help"
        className="text-accent underline underline-offset-2 hover:text-accent-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
      >
        Back to the Help overview
      </Link>
    </div>
  );
}
