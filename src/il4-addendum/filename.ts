/**
 * Filesystem-safe IL4 SSP Addendum filename.
 * The suffix does not claim approval, authorization, certification, or official status.
 */
export function buildIl4AddendumDocxFilename(systemName: string): string {
  const slug = systemName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  if (!slug) {
    return "il4-ssp-addendum.docx";
  }
  return `${slug}-il4-ssp-addendum.docx`;
}
