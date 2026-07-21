import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  splitRequirementSegments,
} from "./requirementText";

describe("splitRequirementSegments", () => {
  it("highlights parameter placeholders without altering surrounding text", () => {
    const statement =
      "Use {{ insert: param, ac-01_odp.01 }} and keep the rest.";
    const segments = splitRequirementSegments(statement);
    assert.deepEqual(segments, [
      { kind: "text", value: "Use " },
      {
        kind: "param",
        value: "{{ insert: param, ac-01_odp.01 }}",
        name: "ac-01_odp.01",
      },
      { kind: "text", value: " and keep the rest." },
    ]);
  });

  it("returns plain text when there are no parameters", () => {
    assert.deepEqual(splitRequirementSegments("Plain requirement."), [
      { kind: "text", value: "Plain requirement." },
    ]);
  });
});
