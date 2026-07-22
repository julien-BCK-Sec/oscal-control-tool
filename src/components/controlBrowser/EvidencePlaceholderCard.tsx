/**
 * Placeholder for future evidence attachments — no behavior yet.
 */
export function EvidencePlaceholderCard() {
  return (
    <section
      aria-labelledby="control-evidence-heading"
      className="rounded-md border border-dashed border-border px-4 py-4"
    >
      <h3
        id="control-evidence-heading"
        className="text-xs font-medium uppercase tracking-wide text-text-muted"
      >
        Evidence
      </h3>
      <p className="mt-1.5 text-sm text-text-muted">
        Evidence attachments will appear here in a future release.
      </p>
    </section>
  );
}
