"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import type { EvidenceVersion } from "@/data/evidence";
import { listEvidenceVersionsAction } from "@/app/actions/evidence";
import {
  FormField,
  FormHint,
  FormLabel,
} from "@/components/design-system/form/FormField";
import { Stack } from "@/components/design-system/layout/primitives";

export type EvidenceVersionPanelProps = {
  projectId: string;
  evidenceId: string;
  currentVersionId: string | null;
  canUpload: boolean;
  onUploaded?: () => void;
};

function formatBytes(size: number): string {
  if (size < 1024) {
    return `${size} B`;
  }
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KiB`;
  }
  return `${(size / (1024 * 1024)).toFixed(1)} MiB`;
}

export function EvidenceVersionPanel({
  projectId,
  evidenceId,
  currentVersionId,
  canUpload,
  onUploaded,
}: EvidenceVersionPanelProps) {
  const [versions, setVersions] = useState<EvidenceVersion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);

  const reload = useCallback(() => {
    startTransition(() => {
      void (async () => {
        const listed = await listEvidenceVersionsAction(projectId, evidenceId);
        setVersions(listed);
      })();
    });
  }, [projectId, evidenceId]);

  useEffect(() => {
    reload();
  }, [reload]);

  function handleUpload(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) {
      return;
    }
    setError(null);
    setUploading(true);
    void (async () => {
      try {
        const body = new FormData();
        body.append("file", file);
        const response = await fetch(
          `/api/projects/${encodeURIComponent(projectId)}/evidence/${encodeURIComponent(evidenceId)}/versions`,
          {
            method: "POST",
            body,
            credentials: "same-origin",
          },
        );
        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as {
            error?: string;
          } | null;
          setError(payload?.error ?? `Upload failed (${response.status}).`);
          return;
        }
        reload();
        onUploaded?.();
      } catch {
        setError("Upload failed.");
      } finally {
        setUploading(false);
      }
    })();
  }

  return (
    <section aria-labelledby="evidence-versions-heading">
      <h4
        id="evidence-versions-heading"
        className="text-xs font-medium text-text-muted"
      >
        File versions
      </h4>
      <p className="mt-1 text-xs text-text-muted">
        Uploaded artifacts are immutable. Replacing a file creates a new
        version and updates the current pointer.
      </p>

      {error ? (
        <p className="mt-2 text-xs text-danger" role="alert">
          {error}
        </p>
      ) : null}

      {canUpload ? (
        <FormField className="mt-3">
          <FormLabel htmlFor={`evidence-upload-${evidenceId}`}>
            {versions.length === 0 ? "Upload file" : "Upload replacement"}
          </FormLabel>
          <input
            id={`evidence-upload-${evidenceId}`}
            type="file"
            className="field mt-1"
            disabled={pending || uploading}
            onChange={(event) => {
              handleUpload(event.target.files);
              event.target.value = "";
            }}
          />
          <FormHint>
            Maximum size is configured server-side (default 25 MiB).
          </FormHint>
        </FormField>
      ) : null}

      <Stack gap="sm" className="mt-3">
        {versions.length === 0 ? (
          <p className="text-sm text-text-muted">No file uploaded yet.</p>
        ) : (
          <ul className="space-y-2">
            {versions.map((version) => {
              const isCurrent = version.id === currentVersionId;
              const downloadHref = `/api/projects/${encodeURIComponent(projectId)}/evidence/${encodeURIComponent(evidenceId)}/versions/${encodeURIComponent(version.id)}/download`;
              return (
                <li
                  key={version.id}
                  className="rounded-sm border border-border bg-surface-muted px-3 py-2"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        Version {version.versionNumber}
                        {isCurrent ? (
                          <span className="ml-2 text-xs font-normal text-text-muted">
                            (current)
                          </span>
                        ) : null}
                      </p>
                      <p className="mt-0.5 break-all text-xs text-text-secondary">
                        {version.originalFilename}
                      </p>
                      <p className="mt-0.5 text-xs text-text-muted">
                        {version.mimeType} · {formatBytes(version.sizeBytes)} ·
                        SHA-256 {version.sha256.slice(0, 12)}…
                      </p>
                      <p className="mt-0.5 text-xs text-text-muted">
                        Uploaded {new Date(version.uploadedAt).toLocaleString()}
                      </p>
                    </div>
                    <a className="btn btn-sm" href={downloadHref}>
                      Download
                    </a>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Stack>
    </section>
  );
}
