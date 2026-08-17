"use client";

import type { ProjectEvidenceSummary } from "@/data/evidence";
import type { EvidenceAttentionFilter } from "@/components/workspace/presentation";

export type EvidenceOverviewCardsProps = {
  summary: ProjectEvidenceSummary | null;
  loading?: boolean;
  onSelectAttention: (filter: EvidenceAttentionFilter) => void;
};

type CardSpec = {
  id: EvidenceAttentionFilter;
  label: string;
  value: number;
  empty: string;
  hint: string;
};

export function EvidenceOverviewCards({
  summary,
  loading = false,
  onSelectAttention,
}: EvidenceOverviewCardsProps) {
  const cards: CardSpec[] = [
    {
      id: "missing",
      label: "Required controls missing evidence",
      value: summary?.requiredMissingEvidence ?? 0,
      empty: "No controls are missing required Evidence.",
      hint: "Required controls with no active Evidence",
    },
    {
      id: "due_soon",
      label: "Evidence due soon",
      value: summary?.dueSoonEvidence ?? 0,
      empty: "No Evidence is due in the next 30 days.",
      hint: "Review due date within 30 days",
    },
    {
      id: "overdue",
      label: "Evidence overdue",
      value: summary?.overdueEvidence ?? 0,
      empty: "No Evidence is overdue.",
      hint: "Review due date has passed",
    },
    {
      id: "unlinked",
      label: "Unlinked evidence",
      value: summary?.unlinkedEvidence ?? 0,
      empty: "This project has no unlinked Evidence.",
      hint: "Active or draft Evidence with no controls",
    },
  ];

  return (
    <section aria-labelledby="evidence-coverage-heading">
      <h3
        id="evidence-coverage-heading"
        className="text-sm font-semibold text-foreground"
      >
        Evidence coverage
      </h3>
      <p className="mt-0.5 text-xs text-text-muted">
        Evidence coverage is not a compliance score. Counts describe linked
        active Evidence against each control&apos;s Evidence requirement.
      </p>
      {summary ? (
        <p className="mt-2 text-sm text-text-secondary">
          Required controls with Evidence: {summary.requiredWithEvidence} of{" "}
          {summary.requiredControls}
        </p>
      ) : (
        <p className="mt-2 text-sm text-text-muted">
          {loading ? "Loading Evidence coverage…" : "Evidence coverage unavailable."}
        </p>
      )}
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {cards.map((card) => {
          const hasItems = card.value > 0;
          return (
            <li key={card.id}>
              <button
                type="button"
                onClick={() => onSelectAttention(card.id)}
                className="flex h-full w-full flex-col items-start rounded-sm border border-border bg-surface px-3 py-2.5 text-left hover:bg-surface-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-focus-ring"
              >
                <span className="text-xs text-text-muted">{card.label}</span>
                <span className="mt-1 text-lg font-semibold tabular-nums text-foreground">
                  {loading && !summary ? "—" : card.value}
                </span>
                <span className="mt-1 text-xs text-text-secondary">
                  {hasItems ? card.hint : card.empty}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
