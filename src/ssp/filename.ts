/**
 * Filesystem-safe human-readable SSP filename.
 * Does not include dates or tenant names.
 */
export function buildSspDocxFilename(systemName: string): string {
  const slug = systemName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  if (!slug) {
    return "system-security-plan.docx";
  }
  return `${slug}-system-security-plan.docx`;
}
