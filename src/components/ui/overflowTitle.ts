/**
 * Helpers for truncated labels. Full text stays in the DOM for assistive
 * tech; these helpers decide when a visual tooltip is warranted.
 */

export function isTextOverflowing(metrics: {
  scrollWidth: number;
  clientWidth: number;
}): boolean {
  return metrics.scrollWidth > metrics.clientWidth + 1;
}

/** Native/visual tooltip copy only when the visible label is truncated. */
export function overflowTooltipText(
  text: string,
  truncated: boolean,
): string | undefined {
  if (!truncated) {
    return undefined;
  }
  const trimmed = text.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}
