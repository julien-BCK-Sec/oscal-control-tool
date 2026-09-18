import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  describeKeyboardEventTarget,
  isNativeInteractiveTarget,
  isTextEntryKeyboardTarget,
  preserveNativeControlKeys,
  workspaceShortcutYieldsToTarget,
} from "./keyboard-target";

describe("workspace keyboard target boundary", () => {
  it("lets Space reach textarea, input, select, checkbox, and button targets", () => {
    const space = { key: " ", metaKey: false, ctrlKey: false, altKey: false };
    const targets = [
      { tagName: "TEXTAREA" },
      { tagName: "INPUT", type: "text" },
      { tagName: "INPUT", type: "search" },
      { tagName: "SELECT" },
      { tagName: "INPUT", type: "checkbox" },
      { tagName: "INPUT", type: "radio" },
      { tagName: "BUTTON" },
    ];
    for (const target of targets) {
      assert.equal(
        workspaceShortcutYieldsToTarget({ ...space, target }),
        true,
        `Space must reach ${target.tagName} ${target.type ?? ""}`.trim(),
      );
    }
  });

  it("does not treat Space as text-entry inside a non-interactive target", () => {
    assert.equal(
      workspaceShortcutYieldsToTarget({
        key: " ",
        metaKey: false,
        ctrlKey: false,
        altKey: false,
        target: { tagName: "DIV" },
      }),
      false,
    );
    assert.equal(
      workspaceShortcutYieldsToTarget({
        key: " ",
        metaKey: false,
        ctrlKey: false,
        altKey: false,
        target: null,
      }),
      false,
    );
  });

  it("keeps workspace undo available even when a textarea is focused", () => {
    assert.equal(
      workspaceShortcutYieldsToTarget({
        key: "z",
        metaKey: true,
        ctrlKey: false,
        altKey: false,
        target: { tagName: "TEXTAREA" },
      }),
      false,
    );
  });

  it("classifies text-entry versus activation controls", () => {
    assert.equal(isTextEntryKeyboardTarget({ tagName: "TEXTAREA" }), true);
    assert.equal(
      isTextEntryKeyboardTarget({ tagName: "INPUT", type: "text" }),
      true,
    );
    assert.equal(
      isTextEntryKeyboardTarget({ tagName: "INPUT", type: "checkbox" }),
      false,
    );
    assert.equal(isNativeInteractiveTarget({ tagName: "INPUT", type: "checkbox" }), true);
    assert.equal(isNativeInteractiveTarget({ tagName: "BUTTON" }), true);
  });

  it("stops unmodified keys from bubbling out of native controls", () => {
    let stopped = false;
    preserveNativeControlKeys({
      metaKey: false,
      ctrlKey: false,
      altKey: false,
      stopPropagation: () => {
        stopped = true;
      },
    });
    assert.equal(stopped, true);
    stopped = false;
    preserveNativeControlKeys({
      metaKey: true,
      ctrlKey: false,
      altKey: false,
      stopPropagation: () => {
        stopped = true;
      },
    });
    assert.equal(stopped, false);
  });

  it("describes DOM-like event targets without requiring a browser", () => {
    const described = describeKeyboardEventTarget({
      tagName: "TEXTAREA",
      isContentEditable: false,
      getAttribute: () => null,
    } as unknown as EventTarget);
    assert.deepEqual(described, {
      tagName: "TEXTAREA",
      type: null,
      isContentEditable: false,
    });
  });
});
