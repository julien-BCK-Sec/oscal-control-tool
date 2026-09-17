import type { FrameworkControl } from "@/data/framework";
import type { SspItemKind } from "./types";

/** Internal id `ac-2.1` → display `AC-2 (1)`; CMMC and GRR ids stay uppercase. */
export function formatSspItemDisplayId(controlId: string): string {
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

export function isNistEnhancementId(controlId: string): boolean {
  return /^[a-z]+-\d+\.\d+$/i.test(controlId.trim());
}

export function parentControlId(controlId: string): string | null {
  if (!isNistEnhancementId(controlId)) {
    return null;
  }
  const match = /^([a-z]+-\d+)\.\d+$/i.exec(controlId.trim());
  return match ? match[1].toLowerCase() : null;
}

export function sspItemKind(
  control: FrameworkControl,
  itemSingular: string,
): SspItemKind {
  if (control.itemKind === "other") {
    return "grr";
  }
  if (itemSingular === "requirement") {
    return "requirement";
  }
  if (control.itemKind === "enhancement" || isNistEnhancementId(control.id)) {
    return "enhancement";
  }
  return "control";
}

export type SspTreeNode = {
  control: FrameworkControl;
  enhancements: FrameworkControl[];
};

export type SspFamilyTreeGroup = {
  family: string;
  nodes: SspTreeNode[];
};

/**
 * Family → parent → enhancement tree in framework order.
 * Same grouping rules as the Control Browser tree.
 */
export function buildSspControlTree(
  controls: readonly FrameworkControl[],
): SspFamilyTreeGroup[] {
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
  const nodesByFamily = new Map<string, SspTreeNode[]>();

  for (const control of topLevel) {
    const family = control.family;
    if (!nodesByFamily.has(family)) {
      familyOrder.push(family);
      nodesByFamily.set(family, []);
    }
    if (isNistEnhancementId(control.id) && parentControlId(control.id)) {
      nodesByFamily.get(family)!.push({ control, enhancements: [] });
      continue;
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
