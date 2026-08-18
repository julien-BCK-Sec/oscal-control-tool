import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import {
  HELP_BACK_TO_PROJECTS_HREF,
  HELP_BACK_TO_PROJECTS_LABEL,
} from "./navigation";

describe("Help return navigation", () => {
  it("sends users back to the projects list, not a Help dead end", () => {
    assert.equal(HELP_BACK_TO_PROJECTS_HREF, "/projects");
    assert.equal(HELP_BACK_TO_PROJECTS_LABEL, "Back to projects");
    assert.doesNotMatch(HELP_BACK_TO_PROJECTS_HREF, /^\/help/);
  });

  it("wires the Help header logo and back link to the projects list", () => {
    const source = readFileSync(
      path.join(process.cwd(), "src/app/help/layout.tsx"),
      "utf8",
    );
    assert.match(source, /href=\{HELP_BACK_TO_PROJECTS_HREF\}/);
    assert.match(source, /HELP_BACK_TO_PROJECTS_LABEL/);
  });

  it("keeps contextual Help links as same-tab in-app navigation", () => {
    const source = readFileSync(
      path.join(process.cwd(), "src/components/help/HelpLink.tsx"),
      "utf8",
    );
    assert.doesNotMatch(source, /target="_blank"/);
  });
});
