import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CONTROL_NAV_EDITOR_MIN,
  CONTROL_NAV_WIDTH_DEFAULT,
  CONTROL_NAV_WIDTH_KEYBOARD_STEP,
  CONTROL_NAV_WIDTH_MAX,
  CONTROL_NAV_WIDTH_MIN,
  CONTROL_NAV_WIDTH_STORAGE_KEY,
  clampControlNavWidth,
  nextControlNavWidthFromKey,
  parseStoredControlNavWidth,
  readStoredControlNavWidth,
  writeStoredControlNavWidth,
} from "./navWidth";

describe("clampControlNavWidth", () => {
  it("clamps to the configured min and max", () => {
    assert.equal(clampControlNavWidth(CONTROL_NAV_WIDTH_MIN), CONTROL_NAV_WIDTH_MIN);
    assert.equal(clampControlNavWidth(CONTROL_NAV_WIDTH_MAX), CONTROL_NAV_WIDTH_MAX);
    assert.equal(clampControlNavWidth(CONTROL_NAV_WIDTH_MIN - 80), CONTROL_NAV_WIDTH_MIN);
    assert.equal(clampControlNavWidth(CONTROL_NAV_WIDTH_MAX + 80), CONTROL_NAV_WIDTH_MAX);
    assert.equal(clampControlNavWidth(400), 400);
  });

  it("falls back to the default for non-finite values", () => {
    assert.equal(clampControlNavWidth(Number.NaN), CONTROL_NAV_WIDTH_DEFAULT);
    assert.equal(clampControlNavWidth(Number.POSITIVE_INFINITY), CONTROL_NAV_WIDTH_DEFAULT);
  });

  it("leaves room for the editor when a container width is provided", () => {
    const container = 800;
    const expectedMax = container - CONTROL_NAV_EDITOR_MIN;
    assert.equal(clampControlNavWidth(CONTROL_NAV_WIDTH_MAX, container), expectedMax);
    assert.equal(clampControlNavWidth(CONTROL_NAV_WIDTH_MIN - 10, container), CONTROL_NAV_WIDTH_MIN);
  });
});

describe("parseStoredControlNavWidth", () => {
  it("parses integers and ignores invalid stored values", () => {
    assert.equal(parseStoredControlNavWidth(null), CONTROL_NAV_WIDTH_DEFAULT);
    assert.equal(parseStoredControlNavWidth(""), CONTROL_NAV_WIDTH_DEFAULT);
    assert.equal(parseStoredControlNavWidth("nope"), CONTROL_NAV_WIDTH_DEFAULT);
    assert.equal(parseStoredControlNavWidth("400"), 400);
    assert.equal(parseStoredControlNavWidth("  412 "), 412);
    assert.equal(parseStoredControlNavWidth("80"), CONTROL_NAV_WIDTH_MIN);
    assert.equal(parseStoredControlNavWidth("9999"), CONTROL_NAV_WIDTH_MAX);
  });
});

describe("nextControlNavWidthFromKey", () => {
  it("moves by the keyboard step and snaps to bounds", () => {
    assert.equal(
      nextControlNavWidthFromKey("ArrowRight", 400),
      400 + CONTROL_NAV_WIDTH_KEYBOARD_STEP,
    );
    assert.equal(
      nextControlNavWidthFromKey("ArrowLeft", 400),
      400 - CONTROL_NAV_WIDTH_KEYBOARD_STEP,
    );
    assert.equal(
      nextControlNavWidthFromKey("Home", 400),
      CONTROL_NAV_WIDTH_MIN,
    );
    assert.equal(
      nextControlNavWidthFromKey("End", 400),
      CONTROL_NAV_WIDTH_MAX,
    );
    assert.equal(nextControlNavWidthFromKey("ArrowUp", 400), null);
  });
});

describe("control nav width storage", () => {
  it("reads and writes through a Storage-like object and fails closed", () => {
    const store = new Map<string, string>();
    const storage = {
      getItem(key: string) {
        return store.get(key) ?? null;
      },
      setItem(key: string, value: string) {
        store.set(key, value);
      },
    };

    assert.equal(readStoredControlNavWidth(storage), CONTROL_NAV_WIDTH_DEFAULT);
    writeStoredControlNavWidth(400, storage);
    assert.equal(store.get(CONTROL_NAV_WIDTH_STORAGE_KEY), "400");
    assert.equal(readStoredControlNavWidth(storage), 400);

    const throwing: Pick<Storage, "getItem" | "setItem"> = {
      getItem() {
        throw new Error("blocked");
      },
      setItem() {
        throw new Error("blocked");
      },
    };
    assert.equal(readStoredControlNavWidth(throwing), CONTROL_NAV_WIDTH_DEFAULT);
    writeStoredControlNavWidth(400, throwing);
    assert.equal(readStoredControlNavWidth(null), CONTROL_NAV_WIDTH_DEFAULT);
  });
});
