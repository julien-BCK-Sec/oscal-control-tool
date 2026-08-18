import type { Framework, FrameworkControl } from "@/data/framework/types";
import {
  CMMC_LEVEL_2_REQUIREMENT_COUNT,
  cmmcLevel2ControlId,
  familyForOriginId,
  NIST_SP800171_R2_FAMILIES,
} from "./families";
import type { CmmcLevel2Identity } from "./identities";
import { parseCsvRecords } from "./parse-csv";

export type CmmcLevel2DerivationResult =
  | {
      ok: true;
      framework: Framework;
    }
  | {
      ok: false;
      message: string;
    };

const ORIGIN_ID_PATTERN = /^3\.\d+\.\d+$/;

export function presentationTitleFromStatement(statement: string): string {
  const normalized = statement.trim().replace(/\s+/g, " ");
  if (!normalized) {
    return "";
  }
  const sentenceMatch = /^(.*?[.!?])(?:\s|$)/.exec(normalized);
  const sentence = sentenceMatch?.[1] ?? normalized;
  return sentence.replace(/[.!?]$/, "").trim() || normalized;
}

function cell(record: Record<string, string>, key: string): string {
  return (record[key] ?? "").trim();
}

/**
 * Derive the CMMC Level 2 application Framework from the pinned NIST
 * SP 800-171 Rev. 2 security-requirements CSV.
 *
 * Does not import discussion text or 800-171A assessment objectives.
 */
export function deriveCmmcLevel2Framework(
  csvText: string,
  identity: Pick<
    CmmcLevel2Identity,
    "id" | "title" | "source" | "sourceVersion"
  >,
): CmmcLevel2DerivationResult {
  const records = parseCsvRecords(csvText);
  if (records.length === 0) {
    return { ok: false, message: "NIST SP 800-171 R2 CSV has no requirement rows." };
  }

  const controls: FrameworkControl[] = [];
  const seenOriginIds = new Set<string>();
  const seenControlIds = new Set<string>();
  const problems: string[] = [];

  for (const [index, record] of records.entries()) {
    const originId = cell(record, "Identifier");
    const statement = cell(record, "Security Requirement").replace(/\s+/g, " ");
    if (!ORIGIN_ID_PATTERN.test(originId)) {
      problems.push(`row ${index + 2}: invalid Identifier ${originId || "(empty)"}`);
      continue;
    }
    if (!statement) {
      problems.push(`row ${index + 2}: missing Security Requirement for ${originId}`);
      continue;
    }
    const family = familyForOriginId(originId);
    if (!family) {
      problems.push(`row ${index + 2}: unknown family for ${originId}`);
      continue;
    }
    const csvFamily = cell(record, "Family");
    if (csvFamily && csvFamily.toLowerCase() !== family.title.toLowerCase()) {
      problems.push(
        `row ${index + 2}: CSV family "${csvFamily}" does not match ${family.title} for ${originId}`,
      );
      continue;
    }
    const controlId = cmmcLevel2ControlId(originId);
    if (!controlId) {
      problems.push(`row ${index + 2}: could not construct CMMC id for ${originId}`);
      continue;
    }
    if (seenOriginIds.has(originId) || seenControlIds.has(controlId)) {
      problems.push(`row ${index + 2}: duplicate identifier ${originId}`);
      continue;
    }
    seenOriginIds.add(originId);
    seenControlIds.add(controlId);

    const title = presentationTitleFromStatement(statement);
    if (!title) {
      problems.push(`row ${index + 2}: empty title for ${originId}`);
      continue;
    }

    controls.push({
      id: controlId,
      title,
      family: family.title,
      statement,
      source: identity.source,
      sourceVersion: identity.sourceVersion,
      originId,
    });
  }

  if (problems.length > 0) {
    return {
      ok: false,
      message: `NIST SP 800-171 R2 CSV derivation failed: ${problems.join("; ")}`,
    };
  }

  if (controls.length !== CMMC_LEVEL_2_REQUIREMENT_COUNT) {
    return {
      ok: false,
      message: `Expected ${CMMC_LEVEL_2_REQUIREMENT_COUNT} CMMC Level 2 requirements, derived ${controls.length}.`,
    };
  }

  for (const family of NIST_SP800171_R2_FAMILIES) {
    const count = controls.filter((control) => control.family === family.title).length;
    if (count !== family.requirementCount) {
      return {
        ok: false,
        message: `Family ${family.title} expected ${family.requirementCount} requirements, derived ${count}.`,
      };
    }
  }

  return {
    ok: true,
    framework: {
      id: identity.id,
      title: identity.title,
      source: identity.source,
      sourceVersion: identity.sourceVersion,
      controls,
    },
  };
}
