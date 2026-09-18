/**
 * Workspace keyboard shortcuts must not steal keys that interactive
 * controls already handle, including Space in text entry.
 */

export type NativeKeyboardTarget = {
  tagName: string;
  type?: string | null;
  isContentEditable?: boolean;
};

function tagNameOf(target: NativeKeyboardTarget): string {
  return target.tagName.trim().toUpperCase();
}

export function isNativeInteractiveTarget(
  target: NativeKeyboardTarget | null | undefined,
): boolean {
  if (!target) {
    return false;
  }
  const tag = tagNameOf(target);
  if (
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    tag === "OPTION" ||
    tag === "BUTTON" ||
    tag === "SUMMARY"
  ) {
    return true;
  }
  if (tag === "INPUT") {
    return true;
  }
  if (target.isContentEditable) {
    return true;
  }
  return false;
}

export function isTextEntryKeyboardTarget(
  target: NativeKeyboardTarget | null | undefined,
): boolean {
  if (!target) {
    return false;
  }
  const tag = tagNameOf(target);
  if (tag === "TEXTAREA" || tag === "SELECT" || tag === "OPTION") {
    return true;
  }
  if (target.isContentEditable) {
    return true;
  }
  if (tag !== "INPUT") {
    return false;
  }
  const type = (target.type ?? "text").trim().toLowerCase();
  return (
    type === "" ||
    type === "text" ||
    type === "search" ||
    type === "email" ||
    type === "password" ||
    type === "url" ||
    type === "tel" ||
    type === "number" ||
    type === "date" ||
    type === "datetime-local" ||
    type === "month" ||
    type === "time" ||
    type === "week"
  );
}

export type WorkspaceKeyEventLike = {
  key: string;
  metaKey: boolean;
  ctrlKey: boolean;
  altKey: boolean;
  target: NativeKeyboardTarget | null;
};

/**
 * Ordinary typing and native control activation, including Space, must reach
 * the focused control. Modified workspace shortcuts such as undo remain
 * available.
 */
export function workspaceShortcutYieldsToTarget(
  event: WorkspaceKeyEventLike,
): boolean {
  const isUndo =
    (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z";
  if (isUndo) {
    return false;
  }
  if (event.metaKey || event.ctrlKey || event.altKey) {
    return false;
  }
  return isNativeInteractiveTarget(event.target);
}

export function describeKeyboardEventTarget(
  target: EventTarget | null,
): NativeKeyboardTarget | null {
  if (!target || typeof target !== "object") {
    return null;
  }
  const element = target as {
    tagName?: unknown;
    isContentEditable?: unknown;
    getAttribute?: (name: string) => string | null;
  };
  if (typeof element.tagName !== "string") {
    return null;
  }
  return {
    tagName: element.tagName,
    type:
      typeof element.getAttribute === "function"
        ? element.getAttribute("type")
        : null,
    isContentEditable: element.isContentEditable === true,
  };
}

export function preserveNativeControlKeys(event: {
  metaKey: boolean;
  ctrlKey: boolean;
  altKey: boolean;
  stopPropagation: () => void;
}): void {
  if (event.metaKey || event.ctrlKey || event.altKey) {
    return;
  }
  event.stopPropagation();
}
