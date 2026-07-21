import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DEFAULT_WORKSPACE_TAB,
  WORKSPACE_TABS,
  isWorkspacePanelActive,
  isWorkspaceTabId,
  parseWorkspaceViewParam,
  workspaceTabDefinition,
} from "@/components/workspace/presentation";

describe("workspace tabs", () => {
  it("defaults to Overview", () => {
    assert.equal(DEFAULT_WORKSPACE_TAB, "overview");
    assert.equal(WORKSPACE_TABS[0]?.id, "overview");
    assert.equal(workspaceTabDefinition("overview").label, "Overview");
  });

  it("includes overview, controls, project details, and version history", () => {
    assert.deepEqual(
      WORKSPACE_TABS.map((tab) => tab.id),
      ["overview", "controls", "details", "history"],
    );
    assert.equal(workspaceTabDefinition("controls").label, "Controls");
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
