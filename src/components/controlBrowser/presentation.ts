/**
 * Presentation-only helpers for the Control Browser.
 * Does not change framework IDs, storage keys, or OSCAL export.
 */

import type { FrameworkControl } from "@/data/framework";

/** Internal id `ac-2.1` → display `AC-2 (1)`; `ac-2` → `AC-2`. */
export function formatControlIdDisplay(controlId: string): string {
  const match = /^([a-z]+)-(\d+)(?:\.(\d+))?$/i.exec(controlId.trim());
  if (!match) {
    return controlId.toUpperCase();
  }

  const family = match[1].toUpperCase();
  const baseNumber = match[2];
  const enhancementNumber = match[3];

  if (enhancementNumber) {
    return `${family}-${baseNumber} (${enhancementNumber})`;
  }

  return `${family}-${baseNumber}`;
}

/** Enhancement number for nested list labels, e.g. `ac-2.1` → `1`. */
export function enhancementNumber(controlId: string): string | null {
  const match = /^[a-z]+-\d+\.(\d+)$/i.exec(controlId.trim());
  return match ? match[1] : null;
}

export function isEnhancementId(controlId: string): boolean {
  return controlId.includes(".");
}

export function parentControlId(controlId: string): string | null {
  if (!isEnhancementId(controlId)) {
    return null;
  }
  const match = /^([a-z]+-\d+)\.\d+$/i.exec(controlId.trim());
  return match ? match[1].toLowerCase() : null;
}

export type ControlTreeNode = {
  control: FrameworkControl;
  enhancements: FrameworkControl[];
};

export type FamilyTreeGroup = {
  family: string;
  nodes: ControlTreeNode[];
};

/**
 * Build family → parent → enhancement tree in framework order.
 * Enhancements whose parent is not in the list appear as top-level nodes.
 */
export function buildControlTree(
  controls: readonly FrameworkControl[],
): FamilyTreeGroup[] {
  const byId = new Map(controls.map((control) => [control.id, control]));
  const enhancementsByParent = new Map<string, FrameworkControl[]>();
  const topLevel: FrameworkControl[] = [];

  for (const control of controls) {
    const parentId = parentControlId(control.id);
    if (parentId && byId.has(parentId)) {
      const list = enhancementsByParent.get(parentId) ?? [];
      list.push(control);
      enhancementsByParent.set(parentId, list);
    } else {
      topLevel.push(control);
    }
  }

  const familyOrder: string[] = [];
  const nodesByFamily = new Map<string, ControlTreeNode[]>();

  for (const control of topLevel) {
    if (isEnhancementId(control.id) && parentControlId(control.id)) {
      // Orphan enhancement shown as its own node (no nested children).
      const family = control.family;
      if (!nodesByFamily.has(family)) {
        familyOrder.push(family);
        nodesByFamily.set(family, []);
      }
      nodesByFamily.get(family)!.push({ control, enhancements: [] });
      continue;
    }

    const family = control.family;
    if (!nodesByFamily.has(family)) {
      familyOrder.push(family);
      nodesByFamily.set(family, []);
    }
    nodesByFamily.get(family)!.push({
      control,
      enhancements: enhancementsByParent.get(control.id) ?? [],
    });
  }

  return familyOrder.map((family) => ({
    family,
    nodes: nodesByFamily.get(family) ?? [],
  }));
}

function normalizeSearch(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Compact form of a display id for search, e.g. `ac-2 (1)` / `ac-2(1)`. */
function searchableIdForms(controlId: string): string[] {
  const display = formatControlIdDisplay(controlId).toLowerCase();
  return [
    controlId.toLowerCase(),
    display,
    display.replace(/\s+/g, ""),
    display.replace(/[()]/g, ""),
  ];
}

function controlMatchesQuery(
  control: FrameworkControl,
  query: string,
): boolean {
  if (!query) {
    return true;
  }

  const title = control.title.toLowerCase();
  if (title.includes(query)) {
    return true;
  }

  return searchableIdForms(control.id).some((form) => form.includes(query));
}

/**
 * Filter the tree by control ID / title.
 * A parent match includes that parent and all of its enhancements.
 * An enhancement-only match includes the parent (for context) and matching children.
 */
export function filterControlTree(
  tree: FamilyTreeGroup[],
  rawQuery: string,
): FamilyTreeGroup[] {
  const query = normalizeSearch(rawQuery);
  if (!query) {
    return tree;
  }

  const families: FamilyTreeGroup[] = [];

  for (const group of tree) {
    if (group.family.toLowerCase().includes(query)) {
      families.push(group);
      continue;
    }

    const nodes: ControlTreeNode[] = [];

    for (const node of group.nodes) {
      const parentMatches = controlMatchesQuery(node.control, query);
      const matchingEnhancements = node.enhancements.filter((enhancement) =>
        controlMatchesQuery(enhancement, query),
      );

      if (parentMatches) {
        nodes.push({
          control: node.control,
          enhancements: node.enhancements,
        });
      } else if (matchingEnhancements.length > 0) {
        nodes.push({
          control: node.control,
          enhancements: matchingEnhancements,
        });
      }
    }

    if (nodes.length > 0) {
      families.push({ family: group.family, nodes });
    }
  }

  return families;
}

/** Parent control IDs that have at least one nested enhancement. */
export function parentIdsWithEnhancements(
  tree: FamilyTreeGroup[],
): string[] {
  const ids: string[] = [];
  for (const group of tree) {
    for (const node of group.nodes) {
      if (node.enhancements.length > 0) {
        ids.push(node.control.id);
      }
    }
  }
  return ids;
}
