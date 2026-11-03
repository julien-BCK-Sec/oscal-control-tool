/**
 * Load the pinned IL4 Table D-1 extract.
 * Adjustment kind lives on this source. The framework read model stores the
 * cross-check text, not the kind enum.
 */

import appendixDExtract from "../../../vendor/dod/cloud-il4-rev5/extracts/appendix-d-il4-parameter-notes.json";
import { parseAppendixDExtract } from "./parse-appendix-d";
import type { AppendixDNote } from "./types";

let cached: readonly AppendixDNote[] | null = null;

export function loadPinnedIl4TableD1Notes(): readonly AppendixDNote[] {
  if (cached) {
    return cached;
  }
  cached = parseAppendixDExtract(appendixDExtract);
  return cached;
}
