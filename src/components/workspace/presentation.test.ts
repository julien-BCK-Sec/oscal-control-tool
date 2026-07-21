import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DEFAULT_WORKSPACE_TAB,
  WORKSPACE_TABS,
  isWorkspacePanelActive,
  isWorkspaceTabId,
  workspaceTabDefinition,
} from "@/components/workspace/presentation";

describe("workspace tabs", () => {
  it("defaults to Controls", () => {
    assert.equal(DEFAULT_WORKSPACE_TAB, "controls");
    assert.equal(WORKSPACE_TABS[0]?.id, "controls");
    assert.equal(workspaceTabDefinition("controls").label, "Controls");
  });

  it("includes project details and version history tabs", () => {
    assert.deepEqual(
      WORKSPACE_TABS.map((tab) => tab.id),
      ["controls", "details", "history"],
    );
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
    assert.equal(isWorkspaceTabId("controls"), true);
    assert.equal(isWorkspaceTabId("details"), true);
    assert.equal(isWorkspaceTabId("history"), true);
    assert.equal(isWorkspaceTabId("settings"), false);
  });

  it("shows only the selected panel as active", () => {
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
