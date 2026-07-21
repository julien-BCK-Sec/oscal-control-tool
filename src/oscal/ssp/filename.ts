/**
 * Build a download filename from the system name.
 * Falls back to a stable default when the name is empty or sanitizes to nothing.
 */
export function buildSspExportFilename(systemName: string): string {
  const slug = systemName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return `${slug.length > 0 ? slug : "system-security-plan"}-ssp.json`;
}
