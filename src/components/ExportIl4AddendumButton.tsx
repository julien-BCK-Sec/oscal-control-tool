"use client";

import { useState } from "react";
import { HelpLink } from "@/components/help/HelpLink";
import { Button } from "@/components/design-system/button/Button";
import { IL4_ADDENDUM_UNSUPPORTED_FRAMEWORK_MESSAGE } from "@/il4-addendum/support";

export type ExportIl4AddendumButtonProps = {
  projectId: string;
  compact?: boolean;
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
 * Download the Control Freak DoD IL4 SSP Addendum from saved server state.
 * Shown only for DoD Cloud Impact Level 4 projects.
 */
export function ExportIl4AddendumButton({
  projectId,
  compact = false,
}: ExportIl4AddendumButtonProps) {
  const [exportError, setExportError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleExport() {
    setExportError(null);
    setBusy(true);
    try {
      const response = await fetch(
        `/api/projects/${encodeURIComponent(projectId)}/exports/il4-addendum.docx`,
        { method: "GET", credentials: "same-origin" },
      );
      if (response.status === 401) {
        setExportError("Sign in to export the IL4 Addendum.");
        return;
      }
      if (response.status === 409) {
        setExportError(IL4_ADDENDUM_UNSUPPORTED_FRAMEWORK_MESSAGE);
        return;
      }
      if (!response.ok) {
        setExportError("Unable to export the IL4 Addendum.");
        return;
      }
      const blob = await response.blob();
      const filename =
        filenameFromDisposition(response.headers.get("Content-Disposition")) ??
        "il4-ssp-addendum.docx";
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(objectUrl);
    } catch {
      setExportError("Unable to export the IL4 Addendum.");
    } finally {
      setBusy(false);
    }
  }

  const button = (
    <Button
      type="button"
      size={compact ? "sm" : "md"}
      disabled={busy}
      onClick={() => void handleExport()}
    >
      {busy ? "Exporting…" : "IL4 Addendum (Word)"}
    </Button>
  );

  if (compact) {
    return (
      <div className="flex flex-col items-stretch gap-1 sm:items-end">
        {button}
        {exportError ? (
          <p role="alert" className="max-w-xs text-left text-xs leading-relaxed text-danger sm:text-right">
            {exportError}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex max-w-md flex-col items-stretch gap-2 sm:items-end">
      {button}
      <p className="text-left text-xs leading-relaxed text-text-secondary sm:text-right">
        Downloads a Control Freak IL4 SSP Addendum for the last saved project.
        This is a delta document, not the generic SSP and not an official DoD
        template.{" "}
        <HelpLink slug="dod-cloud-il4" hash="il4-addendum-word">
          Learn more
        </HelpLink>
      </p>
      {exportError ? (
        <p role="alert" className="text-left text-xs leading-relaxed text-danger sm:text-right">
          {exportError}
        </p>
      ) : null}
    </div>
  );
}
