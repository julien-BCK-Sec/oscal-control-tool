import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { FrameworkControl } from "@/data/framework";
import {
  buildControlTree,
  filterControlTree,
  formatControlIdDisplay,
  parentControlId,
} from "./presentation";

function control(
  partial: Pick<FrameworkControl, "id" | "title" | "family">,
): FrameworkControl {
  return {
    ...partial,
    statement: "statement",
    source: "test",
    sourceVersion: "1",
  };
}

describe("formatControlIdDisplay", () => {
  it("formats base and enhancement NIST notation", () => {
    assert.equal(formatControlIdDisplay("ac-2"), "AC-2");
    assert.equal(formatControlIdDisplay("ac-2.1"), "AC-2 (1)");
    assert.equal(formatControlIdDisplay("ac-2.13"), "AC-2 (13)");
    assert.equal(formatControlIdDisplay("cm-6"), "CM-6");
  });
});

describe("buildControlTree and filterControlTree", () => {
  const controls = [
    control({ id: "ac-1", title: "Policy and Procedures", family: "Access Control" }),
    control({ id: "ac-2", title: "Account Management", family: "Access Control" }),
    control({
      id: "ac-2.1",
      title: "Automated System Account Management",
      family: "Access Control",
    }),
    control({
      id: "ac-2.2",
      title: "Automated Temporary and Emergency Account Management",
      family: "Access Control",
    }),
    control({ id: "au-2", title: "Event Logging", family: "Audit and Accountability" }),
    control({ id: "au-6", title: "Audit Record Review", family: "Audit and Accountability" }),
  ];

  it("nests enhancements under parents and groups by family", () => {
    const tree = buildControlTree(controls);
    assert.deepEqual(
      tree.map((group) => group.family),
      ["Access Control", "Audit and Accountability"],
    );
    const ac2 = tree[0].nodes.find((node) => node.control.id === "ac-2");
    assert.ok(ac2);
    assert.deepEqual(
      ac2.enhancements.map((enhancement) => enhancement.id),
      ["ac-2.1", "ac-2.2"],
    );
    assert.equal(parentControlId("ac-2.1"), "ac-2");
  });

  it("finds controls by title fragment and by AC-2 style id search", () => {
    const tree = buildControlTree(controls);
    const byTitle = filterControlTree(tree, "audit");
    assert.equal(byTitle.length, 1);
    assert.equal(byTitle[0].family, "Audit and Accountability");
    assert.deepEqual(
      byTitle[0].nodes.map((node) => node.control.id),
      ["au-2", "au-6"],
    );

    const byId = filterControlTree(tree, "AC-2");
    assert.equal(byId.length, 1);
    assert.equal(byId[0].nodes.length, 1);
    assert.equal(byId[0].nodes[0].control.id, "ac-2");
    assert.deepEqual(
      byId[0].nodes[0].enhancements.map((enhancement) => enhancement.id),
      ["ac-2.1", "ac-2.2"],
    );
  });
});
