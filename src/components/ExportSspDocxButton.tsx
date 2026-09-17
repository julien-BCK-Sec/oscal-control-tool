"use client";

import { useState } from "react";
import { HelpLink } from "@/components/help/HelpLink";

export type ExportSspDocxButtonProps = {
  projectId: string;
};

function filenameFromDisposition(header: string | null): string | null {
  if (!header) {
    return null;
  }
  const utfMatch = /filename\*=UTF-8''([^;]+)/i.exec(header);
  if (utfMatch?.[1]) {
    try {
      return decodeURIComponent(utfMatch[1]);
    } catch {
      return utfMatch[1];
    }
  }
  const asciiMatch = /filename="([^"]+)"/i.exec(header);
  return asciiMatch?.[1] ?? null;
}

/**
 * Download the Control Freak human-readable SSP from saved server state.
 * Does not bundle the DOCX library in the browser.
 */
export function ExportSspDocxButton({ projectId }: ExportSspDocxButtonProps) {
  const [exportError, setExportError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleExport() {
    setExportError(null);
    setBusy(true);
    try {
      const response = await fetch(
        `/api/projects/${encodeURIComponent(projectId)}/exports/ssp.docx`,
        { method: "GET", credentials: "same-origin" },
      );
      if (response.status === 401) {
        setExportError("Sign in to export the System Security Plan.");
        return;
      }
      if (!response.ok) {
        setExportError("Unable to export the System Security Plan.");
        return;
      }
      const blob = await response.blob();
      const filename =
        filenameFromDisposition(response.headers.get("Content-Disposition")) ??
        "system-security-plan.docx";
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(objectUrl);
    } catch {
      setExportError("Unable to export the System Security Plan.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex max-w-md flex-col items-stretch gap-2 sm:items-end">
      <button
        type="button"
        className="btn"
        disabled={busy}
        onClick={() => void handleExport()}
      >
        {busy ? "Exporting…" : "Export human-readable SSP (Word)"}
      </button>
      <p className="text-left text-xs leading-relaxed text-text-secondary sm:text-right">
        Downloads the last saved project on the server. Missing information
        appears as placeholders. This is a Control Freak SSP, not OSCAL and
        not an official FedRAMP, DoD, or CMMC package.{" "}
        <HelpLink slug="human-readable-ssp">Learn more</HelpLink>
      </p>
      {exportError ? (
        <p role="alert" className="text-left text-xs leading-relaxed text-danger sm:text-right">
          {exportError}
        </p>
      ) : null}
    </div>
  );
}
