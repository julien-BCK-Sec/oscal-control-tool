"use client";

import { useState, useSyncExternalStore } from "react";
import { importLegacyProjectAction } from "@/app/actions/projects";
import {
  buildImportedProjectName,
  readLegacyLocalStorageFromWindow,
  writeMigrationMarker,
} from "@/persistence/legacy-migration";

export type LegacyMigrationBannerProps = {
  onImported: (projectId: string) => void;
};

function subscribeToLegacyStorage(onStoreChange: () => void): () => void {
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

function getLegacyImportOffer(): boolean {
  return readLegacyLocalStorageFromWindow(window.localStorage).shouldOfferImport;
}

function getLegacyImportOfferServer(): boolean {
  return false;
}

export function LegacyMigrationBanner({
  onImported,
}: LegacyMigrationBannerProps) {
  const detected = useSyncExternalStore(
    subscribeToLegacyStorage,
    getLegacyImportOffer,
    getLegacyImportOfferServer,
  );
  const [completedMessage, setCompletedMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [importedAway, setImportedAway] = useState(false);

  const offer = detected && !importedAway;

  if (!offer && !completedMessage && !errorMessage) {
    return null;
  }

  async function handleImport() {
    setBusy(true);
    setErrorMessage(null);
    try {
      const result = readLegacyLocalStorageFromWindow(window.localStorage);
      if (!result.shouldOfferImport) {
        setImportedAway(true);
        setCompletedMessage(
          "Nothing to import, or this browser copy was already imported.",
        );
        return;
      }

      const project = await importLegacyProjectAction({
        name: buildImportedProjectName(result.data.metadata),
        metadata: result.data.metadata,
        implementations: result.data.implementations,
      });

      writeMigrationMarker(window.localStorage, {
        projectId: project.id,
        importedAt: new Date().toISOString(),
      });

      const stillThere =
        window.localStorage.getItem(
          "oscal-control-tool.project-metadata.v1",
        ) !== null ||
        window.localStorage.getItem(
          "oscal-control-tool.implementations.v1",
        ) !== null;

      setImportedAway(true);
      setCompletedMessage(
        stillThere
          ? `Imported as “${project.name}”. Browser localStorage copy was kept as a fallback.`
          : `Imported as “${project.name}”.`,
      );
      onImported(project.id);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? `Import failed: ${error.message}. Browser data was not changed.`
          : "Import failed. Browser data was not changed.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <aside
      className="rounded border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-950"
      role="region"
      aria-label="Browser data import"
    >
      {offer ? (
        <>
          <p className="font-medium">Browser project found</p>
          <p className="mt-1 text-sky-900/90">
            This browser has localStorage data from an earlier version. Import it
            into the database as a project. The browser copy will not be deleted.
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={() => void handleImport()}
            className="mt-3 rounded border border-sky-800 bg-white px-3 py-1.5 text-sm font-medium text-sky-950 hover:bg-sky-100 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
          >
            {busy ? "Importing…" : "Import browser project"}
          </button>
        </>
      ) : null}
      {completedMessage ? (
        <p className={offer ? "mt-2" : undefined} role="status">
          {completedMessage}
        </p>
      ) : null}
      {errorMessage ? (
        <p className="mt-2 text-red-800" role="alert">
          {errorMessage}
        </p>
      ) : null}
    </aside>
  );
}
