import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DEFAULT_WORKSPACE_TAB,
  WORKSPACE_TABS,
  buildProjectEvidenceHref,
  firstSearchParam,
  isWorkspacePanelActive,
  isWorkspaceTabId,
  parseCommentQueryParam,
  parseControlQueryParam,
  parseEvidenceQueryParam,
  parseNonEmptyQueryParam,
  parseWorkspaceViewParam,
  workspaceTabDefinition,
  workspaceTabsForItemPlural,
} from "@/components/workspace/presentation";

describe("workspace tabs", () => {
  it("defaults to Overview", () => {
    assert.equal(DEFAULT_WORKSPACE_TAB, "overview");
    assert.equal(WORKSPACE_TABS[0]?.id, "overview");
    assert.equal(workspaceTabDefinition("overview").label, "Overview");
  });

  it("includes overview, controls, evidence, project details, and version history", () => {
    assert.deepEqual(
      WORKSPACE_TABS.map((tab) => tab.id),
      ["overview", "controls", "evidence", "details", "history"],
    );
    assert.equal(workspaceTabDefinition("controls").label, "Controls");
    assert.equal(
      workspaceTabsForItemPlural("requirements").find((tab) => tab.id === "controls")
        ?.label,
      "Requirements",
    );
    assert.equal(workspaceTabDefinition("evidence").label, "Evidence");
    assert.equal(
      workspaceTabDefinition("details").label,
      "Project details",
    );
    assert.equal(
      workspaceTabDefinition("history").label,
      "Version history",
    );
  });

  it("validates tab identifiers", () => {
    assert.equal(isWorkspaceTabId("overview"), true);
    assert.equal(isWorkspaceTabId("controls"), true);
    assert.equal(isWorkspaceTabId("evidence"), true);
    assert.equal(isWorkspaceTabId("details"), true);
    assert.equal(isWorkspaceTabId("history"), true);
    assert.equal(isWorkspaceTabId("settings"), false);
  });

  it("parses view query params and falls back to Overview", () => {
    assert.equal(parseWorkspaceViewParam("controls"), "controls");
    assert.equal(parseWorkspaceViewParam("overview"), "overview");
    assert.equal(parseWorkspaceViewParam("history"), "history");
    assert.equal(parseWorkspaceViewParam(undefined), "overview");
    assert.equal(parseWorkspaceViewParam("nope"), "overview");
  });

  it("parses control, comment, and evidence deep-link query params", () => {
    assert.equal(parseControlQueryParam("ac-2"), "ac-2");
    assert.equal(parseControlQueryParam("  ac-2.1 "), "ac-2.1");
    assert.equal(parseControlQueryParam(""), undefined);
    assert.equal(parseControlQueryParam(undefined), undefined);
    assert.equal(parseCommentQueryParam("comment-1"), "comment-1");
    assert.equal(parseCommentQueryParam("   "), undefined);
    assert.equal(parseEvidenceQueryParam("ev-1"), "ev-1");
    assert.equal(parseEvidenceQueryParam("  ev-1  "), "ev-1");
    assert.equal(parseEvidenceQueryParam(""), undefined);
    assert.equal(parseNonEmptyQueryParam(" AC.L2-3.1.1 "), "AC.L2-3.1.1");
    assert.equal(firstSearchParam(["a", "b"]), "a");
    assert.equal(firstSearchParam("solo"), "solo");
    assert.equal(firstSearchParam(undefined), undefined);
  });

  it("builds a project Evidence deep-link URL", () => {
    assert.equal(
      buildProjectEvidenceHref("project-1", "evidence-99"),
      "/projects/project-1?view=evidence&evidence=evidence-99",
    );
  });

  it("shows only the selected panel as active", () => {
    assert.equal(isWorkspacePanelActive("overview", "overview"), true);
    assert.equal(isWorkspacePanelActive("overview", "controls"), false);

    assert.equal(isWorkspacePanelActive("controls", "controls"), true);
    assert.equal(isWorkspacePanelActive("controls", "details"), false);
    assert.equal(isWorkspacePanelActive("controls", "history"), false);

    assert.equal(isWorkspacePanelActive("details", "details"), true);
    assert.equal(isWorkspacePanelActive("details", "controls"), false);
    assert.equal(isWorkspacePanelActive("details", "history"), false);

    assert.equal(isWorkspacePanelActive("history", "history"), true);
    assert.equal(isWorkspacePanelActive("history", "controls"), false);
    assert.equal(isWorkspacePanelActive("history", "details"), false);
  });
});
