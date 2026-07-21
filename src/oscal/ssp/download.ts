/**
 * Trigger a browser download of pretty-printed JSON.
 * Client-only; no-ops when document is unavailable.
 */
export function downloadJsonFile(
  filename: string,
  value: unknown,
): void {
  if (typeof document === "undefined") {
    return;
  }

  const json = `${JSON.stringify(value, null, 2)}\n`;
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
