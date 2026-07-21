import Ajv, { type ValidateFunction } from "ajv";
import addFormats from "ajv-formats";
import pinnedSspSchema from "../../../vendor/oscal/v1.2.2/schema/oscal_ssp_schema.json";
import { formatAjvErrors } from "./formatValidationErrors";
import type { OscalSspDocument } from "./types";
import type { SspSchemaValidationResult } from "./formatValidationErrors";

/**
 * Loads the pinned NIST OSCAL 1.2.2 SSP JSON Schema from the repository.
 * Never fetches schemas from the network at runtime.
 */
export function loadPinnedSspSchema(): object {
  return pinnedSspSchema as object;
}

let cachedValidate: ValidateFunction | undefined;

function getValidator(): ValidateFunction {
  if (cachedValidate) {
    return cachedValidate;
  }

  const ajv = new Ajv({
    allErrors: true,
    strict: false,
    validateFormats: true,
  });
  addFormats(ajv);
  cachedValidate = ajv.compile(loadPinnedSspSchema());
  return cachedValidate;
}

/**
 * Validate an SSP document against the pinned NIST OSCAL 1.2.2 SSP JSON Schema.
 * Structural validation only — not semantic/cross-document checks.
 */
export function validateOscalSspDocument(
  document: OscalSspDocument,
): SspSchemaValidationResult {
  const validate = getValidator();
  const valid = validate(document);

  if (valid) {
    return { ok: true };
  }

  const ajvErrors = validate.errors ?? [];
  const { message, issues } = formatAjvErrors(ajvErrors);
  return {
    ok: false,
    message,
    issues,
    ajvErrors: [...ajvErrors],
  };
}
