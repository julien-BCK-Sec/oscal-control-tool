import { normalizeFrameworkControlId } from "./ids";
import { CSP_SRG_V1R7_PDF_SHA256 } from "./sources";
import type { AppendixDNote } from "./types";

type RawAppendixD = {
  source?: { pdfSha256?: string; section?: string };
  notes?: Array<{
    originId?: string;
    parameterValues?: string;
    impactNote?: string;
    indicatesDspav?: boolean;
  }>;
};

export function parseAppendixDExtract(raw: unknown): AppendixDNote[] {
  if (!raw || typeof raw !== "object") {
    throw new Error("Appendix D extract is not an object.");
  }
  const doc = raw as RawAppendixD;
  if (doc.source?.pdfSha256 !== CSP_SRG_V1R7_PDF_SHA256) {
    throw new Error("Appendix D extract does not match CSP SRG V1R7 PDF SHA-256.");
  }
  if (!Array.isArray(doc.notes)) {
    throw new Error("Appendix D extract is missing notes[].");
  }
  return doc.notes.map((note, index) => {
    const originId = note.originId?.trim() ?? "";
    const id = normalizeFrameworkControlId(originId);
    if (!id) {
      throw new Error(`Appendix D note ${index} has unusable originId ${originId}`);
    }
    return {
      id,
      originId,
      parameterValues: note.parameterValues?.trim() ?? "",
      impactNote: note.impactNote?.trim() ?? "",
      indicatesDspav: Boolean(note.indicatesDspav),
    };
  });
}
