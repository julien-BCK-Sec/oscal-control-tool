export const WORKSPACE_TAB_IDS = [
  "controls",
  "details",
  "history",
] as const;

export type WorkspaceTabId = (typeof WORKSPACE_TAB_IDS)[number];

export const DEFAULT_WORKSPACE_TAB: WorkspaceTabId = "controls";

export type WorkspaceTabDefinition = {
  id: WorkspaceTabId;
  label: string;
  panelId: string;
  tabId: string;
};

export const WORKSPACE_TABS: readonly WorkspaceTabDefinition[] = [
  {
    id: "controls",
    label: "Controls",
    panelId: "workspace-panel-controls",
    tabId: "workspace-tab-controls",
  },
  {
    id: "details",
    label: "Project details",
    panelId: "workspace-panel-details",
    tabId: "workspace-tab-details",
  },
  {
    id: "history",
    label: "Version history",
    panelId: "workspace-panel-history",
    tabId: "workspace-tab-history",
  },
] as const;

export function isWorkspaceTabId(value: string): value is WorkspaceTabId {
  return (WORKSPACE_TAB_IDS as readonly string[]).includes(value);
}

export function workspaceTabDefinition(
  id: WorkspaceTabId,
): WorkspaceTabDefinition {
  const found = WORKSPACE_TABS.find((tab) => tab.id === id);
  if (!found) {
    throw new Error(`Unknown workspace tab: ${id}`);
  }
  return found;
}

/** Which panel content is active for a given tab selection. */
export function isWorkspacePanelActive(
  activeTab: WorkspaceTabId,
  panel: WorkspaceTabId,
): boolean {
  return activeTab === panel;
}
