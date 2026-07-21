import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  EditorHistory,
  autosaveStatusLabel,
  workingCopiesEqual,
} from "./history";

const base = {
  name: "P",
  metadata: {
    systemName: "P",
    organizationName: "",
    systemDescription: "",
  },
  implementations: {
    "ac-1": { status: "not-started" as const, narrative: "" },
  },
};

describe("EditorHistory", () => {
  it("undoes and redoes working copies", () => {
    const history = new EditorHistory(base);
    history.push({
      ...base,
      implementations: {
        "ac-1": { status: "implemented", narrative: "one" },
      },
    });
    history.push({
      ...base,
      implementations: {
        "ac-1": { status: "implemented", narrative: "two" },
      },
    });

    const undone = history.undo();
    assert.ok(undone);
    assert.equal(undone.implementations["ac-1"]?.narrative, "one");
    const redone = history.redo();
    assert.ok(redone);
    assert.equal(redone.implementations["ac-1"]?.narrative, "two");
  });

  it("bounds history length", () => {
    const history = new EditorHistory(base, 3);
    for (let i = 0; i < 10; i++) {
      history.push({
        ...base,
        implementations: {
          "ac-1": { status: "implemented", narrative: `n${i}` },
        },
      });
    }
    let steps = 0;
    while (history.undo()) {
      steps += 1;
    }
    assert.ok(steps <= 3);
  });

  it("skips no-op pushes", () => {
    const history = new EditorHistory(base);
    history.push(base);
    assert.equal(history.canUndo(), false);
  });
});

describe("autosave labels", () => {
  it("maps statuses", () => {
    assert.equal(autosaveStatusLabel("dirty"), "Unsaved changes");
    assert.equal(autosaveStatusLabel("saving"), "Saving…");
    assert.equal(autosaveStatusLabel("conflict"), "Conflict");
  });

  it("compares working copies", () => {
    assert.equal(workingCopiesEqual(base, { ...base }), true);
    assert.equal(
      workingCopiesEqual(base, {
        ...base,
        metadata: { ...base.metadata, systemName: "Other" },
      }),
      false,
    );
  });
});
