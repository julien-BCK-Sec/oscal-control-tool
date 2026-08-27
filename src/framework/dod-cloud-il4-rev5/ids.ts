/**
 * Canonical Control Freak runtime IDs:
 *   AC-2     -> ac-2
 *   AC-2(7)  -> ac-2.7
 *   GRR-1    -> grr-1
 */

const NIST_ID =
  /^([A-Za-z]{2,4})-(\d+)(?:\((\d+)\))?$/;
const GRR_ID = /^GRR-(\d+)$/i;

export function normalizeFrameworkControlId(raw: string): string | undefined {
  const trimmed = raw.trim();
  const grr = GRR_ID.exec(trimmed);
  if (grr) {
    return `grr-${Number(grr[1])}`;
  }
  const nist = NIST_ID.exec(trimmed.replace(/\s+/g, ""));
  if (!nist) {
    return undefined;
  }
  const family = nist[1].toLowerCase();
  const base = `${family}-${Number(nist[2])}`;
  if (nist[3] !== undefined) {
    return `${base}.${Number(nist[3])}`;
  }
  return base;
}

export function isGrrId(id: string): boolean {
  return /^grr-(?:[1-9]|10)$/.test(id);
}

export function isNistEnhancementId(id: string): boolean {
  return !isGrrId(id) && id.includes(".");
}

export function isNistBaseId(id: string): boolean {
  return !isGrrId(id) && !id.includes(".");
}
