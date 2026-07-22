/**
 * Placeholder for future evidence attachments — no behavior yet.
 */
export function EvidencePlaceholderCard() {
  return (
    <section
      aria-labelledby="control-evidence-heading"
      className="max-w-[var(--layout-content-max)] py-1"
    >
      <h3
        id="control-evidence-heading"
        className="text-xs font-medium text-text-muted"
      >
        Evidence
      </h3>
      <p className="mt-1 text-xs text-text-muted">
        Evidence and supporting artifacts will appear here in a future release.
      </p>
    </section>
  );
}
