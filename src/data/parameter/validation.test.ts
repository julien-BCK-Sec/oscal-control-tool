import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseProjectParameterRecords } from "./validation";

describe("parseProjectParameterRecords", () => {
  it("treats missing records as empty and does not infer from narrative-like keys", () => {
    assert.deepEqual(parseProjectParameterRecords(undefined), {});
    assert.equal(parseProjectParameterRecords("5 failed attempts"), null);
    assert.equal(
      parseProjectParameterRecords({
        "ac-07_odp.01": {
          controlId: "ac-7",
          parameterId: "ac-07_odp.01",
          intent: "organization-defined",
          body: { form: "assignment", values: [""] },
        },
      }),
      null,
    );
  });

  it("parses flexible assignment strings and selection state", () => {
    const parsed = parseProjectParameterRecords({
      "ac-07_odp.02": {
        controlId: "ac-7",
        parameterId: "ac-07_odp.02",
        intent: "organization-defined",
        body: {
          form: "assignment",
          values: ["Immediately upon receipt of a validated termination event"],
        },
      },
      "ac-07_odp.03": {
        controlId: "ac-7",
        parameterId: "ac-07_odp.03",
        intent: "organization-defined",
        body: {
          form: "selection",
          howMany: "one-or-more",
          selectedChoiceKeys: ["0"],
          nested: {
            "ac-07_odp.04": {
              form: "assignment",
              values: ["account lock"],
            },
          },
        },
      },
    });
    assert.ok(parsed);
    assert.equal(
      parsed["ac-07_odp.02"]?.body?.form === "assignment"
        ? parsed["ac-07_odp.02"].body.values[0]
        : null,
      "Immediately upon receipt of a validated termination event",
    );
  });

  it("accepts a DSPAV assertion with optional source note", () => {
    const draft = parseProjectParameterRecords({
      "ac-07_odp.01": {
        controlId: "ac-7",
        parameterId: "ac-07_odp.01",
        intent: "dspav-assertion",
        body: { form: "assignment", values: ["3"] },
      },
    });
    assert.equal(draft?.["ac-07_odp.01"]?.intent, "dspav-assertion");
    const parsed = parseProjectParameterRecords({
      "ac-07_odp.01": {
        controlId: "ac-7",
        parameterId: "ac-07_odp.01",
        intent: "dspav-assertion",
        body: { form: "assignment", values: ["3"] },
        dspavSourceNote: "Restricted DSPAV obtained by the ISSO",
      },
    });
    assert.ok(parsed);
  });

  it("rejects key/parameterId mismatch and keeps unknown IDs as data", () => {
    assert.equal(
      parseProjectParameterRecords({
        wrong: {
          controlId: "ac-7",
          parameterId: "ac-07_odp.01",
          intent: "organization-defined",
        },
      }),
      null,
    );
    const orphan = parseProjectParameterRecords({
      "removed-odp": {
        controlId: "ac-99",
        parameterId: "removed-odp",
        intent: "organization-defined",
        body: { form: "assignment", values: ["kept"] },
      },
    });
    assert.equal(orphan?.["removed-odp"]?.body?.form, "assignment");
  });
});
