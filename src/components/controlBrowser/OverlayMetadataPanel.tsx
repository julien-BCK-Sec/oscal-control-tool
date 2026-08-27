import type { OverlayPresentation } from "@/components/controlBrowser/overlayPresentation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/design-system/card/Card";
import { StatusBadge } from "@/components/design-system/badge/StatusBadge";
import { FormHint } from "@/components/design-system/form/FormField";
import { Stack } from "@/components/design-system/layout/primitives";
import { HelpLink } from "@/components/help/HelpLink";

export type OverlayMetadataPanelProps = {
  presentation: OverlayPresentation;
};

function noticeBadgeLabel(
  kind: OverlayPresentation["notices"][number]["kind"],
): string {
  if (kind === "authoritative-value-required") {
    return "DoD assignment required";
  }
  if (kind === "source-conflict") {
    return "Needs review";
  }
  return "Conditional";
}

function noticeBadgeVariant(
  kind: OverlayPresentation["notices"][number]["kind"],
): "info" | "warning" | "attention" {
  if (kind === "authoritative-value-required") {
    return "attention";
  }
  if (kind === "source-conflict") {
    return "warning";
  }
  return "info";
}

/**
 * Overlay assignments, supplements, and interpretation notices.
 * Separate from the normative catalog statement. Never color-only.
 */
export function OverlayMetadataPanel({
  presentation,
}: OverlayMetadataPanelProps) {
  return (
    <Stack gap="md">
      {presentation.notices.map((notice) => (
        <section
          key={notice.kind}
          aria-labelledby={`overlay-notice-${notice.kind}`}
          className="rounded-md border border-border bg-surface-secondary/50 px-4 py-3"
        >
          <div className="flex flex-wrap items-start gap-2">
            <h3
              id={`overlay-notice-${notice.kind}`}
              className="text-sm font-semibold tracking-tight text-foreground"
            >
              {notice.title}
            </h3>
            <StatusBadge
              label={noticeBadgeLabel(notice.kind)}
              variant={noticeBadgeVariant(notice.kind)}
              size="sm"
            />
          </div>
          <FormHint className="mt-1.5" role="status">
            {notice.explanation}
          </FormHint>
        </section>
      ))}

      {presentation.layers.map((layer) => {
        const headingId = `overlay-layer-${layer.heading.replace(/\s+/g, "-").toLowerCase()}`;
        return (
          <Card
            key={layer.heading}
            variant="surface"
            aria-labelledby={headingId}
          >
            <CardHeader>
              <CardTitle id={headingId}>{layer.heading}</CardTitle>
            </CardHeader>
            <CardContent>
              <Stack gap="sm">
                {layer.assignments.map((block, index) => (
                  <div key={`assignment-${index}`}>
                    <h4 className="text-xs font-medium text-text-secondary">
                      Assignment values
                    </h4>
                    <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-text-secondary">
                      {block.text}
                    </p>
                    <p className="mt-1 text-xs text-text-muted">
                      Source: {block.sourceLabel}
                    </p>
                  </div>
                ))}
                {layer.additionalGuidance.map((block, index) => (
                  <div key={`guidance-${index}`}>
                    <h4 className="text-xs font-medium text-text-secondary">
                      Additional requirements / guidance
                    </h4>
                    <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-text-secondary">
                      {block.text}
                    </p>
                    <p className="mt-1 text-xs text-text-muted">
                      Source: {block.sourceLabel}
                    </p>
                  </div>
                ))}
                {layer.supplements.map((block, index) => (
                  <div key={`supplement-${index}`}>
                    <h4 className="text-xs font-medium text-text-secondary">
                      Supplemental requirements
                    </h4>
                    <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-text-secondary">
                      {block.text}
                    </p>
                    <p className="mt-1 text-xs text-text-muted">
                      Source: {block.sourceLabel}
                    </p>
                  </div>
                ))}
                {layer.applicability ? (
                  <div>
                    <h4 className="text-xs font-medium text-text-secondary">
                      Applicability
                    </h4>
                    <p className="mt-1 text-sm leading-relaxed text-text-secondary">
                      Conditional: {layer.applicability.label}.
                    </p>
                    {layer.applicability.notes ? (
                      <FormHint className="mt-1">
                        {layer.applicability.notes}
                      </FormHint>
                    ) : null}
                  </div>
                ) : null}
              </Stack>
            </CardContent>
          </Card>
        );
      })}

      <p className="text-xs">
        <HelpLink
          slug="dod-cloud-il4"
          hash="how-nist-fedramp-and-dod-layers-appear"
        >
          How Control Freak presents overlay requirements
        </HelpLink>
      </p>
    </Stack>
  );
}
