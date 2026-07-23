export const WORKSPACE_TAB_IDS = [
  "overview",
  "controls",
  "details",
  "history",
] as const;

export type WorkspaceTabId = (typeof WORKSPACE_TAB_IDS)[number];

export const DEFAULT_WORKSPACE_TAB: WorkspaceTabId = "overview";

export type WorkspaceTabDefinition = {
  id: WorkspaceTabId;
  label: string;
  panelId: string;
  tabId: string;
};

export const WORKSPACE_TABS: readonly WorkspaceTabDefinition[] = [
  {
    id: "overview",
    label: "Overview",
    panelId: "workspace-panel-overview",
    tabId: "workspace-tab-overview",
  },
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

export function parseWorkspaceViewParam(
  value: string | null | undefined,
): WorkspaceTabId {
  if (typeof value === "string" && isWorkspaceTabId(value)) {
    return value;
  }
  return DEFAULT_WORKSPACE_TAB;
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

/** Focus request when navigating from Overview or a notification deep link. */
export type ControlsFocusRequest = {
  family?: string;
  controlId?: string;
  /** Scroll/highlight a discussion comment when practical. */
  commentId?: string;
};

/** Parse `control` query param for Controls deep links. */
export function parseControlQueryParam(
  value: string | null | undefined,
): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/** Parse `comment` query param for discussion deep links. */
export function parseCommentQueryParam(
  value: string | null | undefined,
): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}
