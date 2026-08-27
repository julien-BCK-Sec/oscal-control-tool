import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { FrameworkControl } from "@/data/framework";
import { dodCloudIl4FrameworkProvider } from "@/data/framework";
import { DOD_GRR_FAMILY } from "@/framework/dod-cloud-il4-rev5/identities";
import {
  buildControlTree,
  filterControlTree,
  formatControlIdDisplay,
  isEnhancementId,
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
    assert.equal(formatControlIdDisplay("AC.L2-3.1.1"), "AC.L2-3.1.1");
  });

  it("treats only 800-53 enhancement syntax as nested enhancements", () => {
    assert.equal(isEnhancementId("ac-2.1"), true);
    assert.equal(isEnhancementId("ac-2"), false);
    assert.equal(isEnhancementId("AC.L2-3.1.1"), false);
    assert.equal(isEnhancementId("3.1.1"), false);
    assert.equal(isEnhancementId("grr-1"), false);
    assert.equal(isEnhancementId("grr-10"), false);
    assert.equal(parentControlId("grr-1"), null);
    assert.equal(parentControlId("grr-10"), null);
    assert.equal(parentControlId("AC.L2-3.1.1"), null);
    assert.equal(formatControlIdDisplay("grr-1"), "GRR-1");
    assert.equal(formatControlIdDisplay("grr-10"), "GRR-10");
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

  it("keeps CMMC requirement IDs as peers and finds them by origin ID", () => {
    const tree = buildControlTree([
      control({
        id: "AC.L2-3.1.1",
        title: "Limit system access to authorized users",
        family: "Access Control",
      }),
      {
        ...control({
          id: "AC.L2-3.1.2",
          title: "Limit system access to the types of transactions",
          family: "Access Control",
        }),
        originId: "3.1.2",
      },
    ]);
    assert.equal(tree.length, 1);
    assert.equal(tree[0]?.nodes.length, 2);
    assert.deepEqual(
      tree[0]?.nodes.map((node) => node.enhancements.length),
      [0, 0],
    );
    const byOrigin = filterControlTree(tree, "3.1.2");
    assert.equal(byOrigin[0]?.nodes[0]?.control.id, "AC.L2-3.1.2");
  });

  it("keeps IL4 GRRs as a top-level family without enhancement nesting", () => {
    const controls = dodCloudIl4FrameworkProvider.getFramework().controls;
    const tree = buildControlTree(controls);
    assert.equal(controls.length, 345);
    const grrFamily = tree.find((group) => group.family === DOD_GRR_FAMILY);
    assert.ok(grrFamily);
    assert.equal(grrFamily.nodes.length, 10);
    assert.ok(grrFamily.nodes.every((node) => node.enhancements.length === 0));
    assert.deepEqual(
      grrFamily.nodes.map((node) => node.control.id),
      [
        "grr-1",
        "grr-2",
        "grr-3",
        "grr-4",
        "grr-5",
        "grr-6",
        "grr-7",
        "grr-8",
        "grr-9",
        "grr-10",
      ],
    );
    const byGrr = filterControlTree(tree, "grr-1");
    assert.equal(byGrr[0]?.family, DOD_GRR_FAMILY);
    assert.equal(byGrr[0]?.nodes[0]?.control.id, "grr-1");
    const byPki = filterControlTree(tree, "DoD PKI");
    assert.ok(
      byPki.some((group) =>
        group.nodes.some((node) => node.control.id === "grr-1"),
      ),
    );
    const sc46 = tree
      .flatMap((group) => group.nodes)
      .find((node) => node.control.id === "sc-46");
    assert.ok(sc46);
    const nistFamily = tree.find((group) => group.family === "Access Control");
    assert.ok(nistFamily);
    const ac2 = nistFamily.nodes.find((node) => node.control.id === "ac-2");
    assert.ok(ac2);
    assert.ok(ac2.enhancements.length > 0);
  });
});
