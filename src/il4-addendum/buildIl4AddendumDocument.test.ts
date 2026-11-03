import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { EvidenceWithControlIds } from "@/data/evidence";
import { dodCloudIl4FrameworkProvider, frameworkRegistry } from "@/data/framework";
import { createProjectMetadata } from "@/data/project";
import { DOD_CLOUD_IL4_FRAMEWORK_ID } from "@/framework/dod-cloud-il4-rev5/identities";
import { NIST_MODERATE_FRAMEWORK_ID } from "@/framework/nist-sp-800-53-rev5/identities";
import type { StoredProject } from "@/persistence/types";
import { DEMO_IL4_PARAMETER_RECORDS } from "@/seed/demo/parameter-records";
import { placeholderFor } from "@/ssp";
import {
  buildIl4AddendumDocument,
  buildIl4AddendumDocxFilename,
  Il4AddendumUnsupportedFrameworkError,
} from "./index";
import type { Il4AddendumDocument, Il4DetailedEntry } from "./types";
import type { SspGenerationInput } from "@/ssp";

const GENERATED_AT = "2026-09-28T15:00:00.000Z";

function storedProject(patch: Partial<StoredProject> = {}): StoredProject {
  return {
    id: patch.id ?? "project-il4",
    name: patch.name ?? "Snow Goose",
    organizationId: patch.organizationId ?? "org-1",
    frameworkId: patch.frameworkId ?? DOD_CLOUD_IL4_FRAMEWORK_ID,
    schemaVersion: patch.schemaVersion ?? 3,
    revision: patch.revision ?? 4,
    createdAt: patch.createdAt ?? GENERATED_AT,
    updatedAt: patch.updatedAt ?? GENERATED_AT,
    metadata: patch.metadata ?? createProjectMetadata(),
    implementations: patch.implementations ?? {},
    parameterRecords: patch.parameterRecords ?? {},
  };
}

function inputFor(
  patch: Partial<StoredProject> = {},
  extras: Partial<
    Pick<SspGenerationInput, "controlRecordsByControlId" | "evidenceByControlId">
  > = {},
): SspGenerationInput {
  const project = storedProject(patch);
  return {
    project,
    framework: frameworkRegistry.require(project.frameworkId).getFramework(),
    descriptor: frameworkRegistry.requireDescriptor(project.frameworkId),
    controlRecordsByControlId: extras.controlRecordsByControlId ?? new Map(),
    evidenceByControlId: extras.evidenceByControlId ?? new Map(),
    generatedAt: GENERATED_AT,
  };
}

function nistEntries(document: Il4AddendumDocument): Il4DetailedEntry[] {
  return document.nistFamilies.flatMap((family) => [...family.entries]);
}

function entryById(document: Il4AddendumDocument, id: string): Il4DetailedEntry | undefined {
  return [...document.grrs, ...nistEntries(document)].find((entry) => entry.item.id === id);
}

describe("buildIl4AddendumDocument", () => {
  it("builds the delta view from canonical synthesis", () => {
    const document = buildIl4AddendumDocument(inputFor());
    assert.equal(document.identity.documentTitle, "DoD IL4 System Security Plan Addendum");
    assert.equal(document.identity.layoutId, "cf-il4-addendum-docx");
    assert.equal(document.identity.layoutVersion, "1.0");
    assert.equal(document.identity.generator, "Control Freak");
    assert.equal(document.identity.frameworkId, DOD_CLOUD_IL4_FRAMEWORK_ID);
    assert.equal(document.population.totalFrameworkItems, 345);
    assert.equal(document.population.detailedItemCount, 32);
    assert.equal(document.population.detailedGrrCount, 10);
    assert.equal(document.population.detailedNistCount, 22);
    assert.equal(document.population.membershipNoteCount, 1);
    assert.equal(document.population.notReprintedCount, 312);
    assert.match(document.populationExplanation, /not out of scope/);
    assert.match(document.coverDisclaimer, /not an official DoD/);
    assert.match(document.omissionsStatement, /CNSSI 1253/);
    assert.equal(document.sources.length >= 4, true);
    assert.ok(document.sources.some((source) => /800-53/i.test(source.title)));
    assert.ok(document.sources.some((source) => /FedRAMP/i.test(source.title)));
    assert.ok(document.sources.some((source) => /Addendum Controls/i.test(source.title)));
    assert.ok(document.sources.some((source) => /SRG/i.test(source.title)));
    assert.equal(
      document.sources.some((source) => source.sha256.startsWith("4c511a6b")),
      false,
    );
  });

  it("prints GRR-1 through GRR-10 from canonical text", () => {
    const framework = dodCloudIl4FrameworkProvider.getFramework();
    const document = buildIl4AddendumDocument(inputFor({
      implementations: {
        "grr-1": {
          status: "in-progress",
          narrative: "CAC authentication is documented for operators.",
        },
      },
    }));
    assert.deepEqual(
      document.grrs.map((entry) => entry.item.id),
      ["grr-1", "grr-2", "grr-3", "grr-4", "grr-5", "grr-6", "grr-7", "grr-8", "grr-9", "grr-10"],
    );
    for (const entry of document.grrs) {
      const control = framework.controls.find((item) => item.id === entry.item.id);
      assert.ok(control);
      assert.equal(entry.item.title, control.title);
      assert.equal(entry.item.sourceStatement, control.statement);
      assert.equal(entry.item.displayId, control.originId);
      assert.doesNotMatch(entry.item.displayId, /GR-15|GR-10/);
      assert.equal(entry.group, "grr");
    }
    const grr1 = entryById(document, "grr-1");
    assert.equal(grr1?.item.implementationDocumentationStatus.label, "In progress");
    assert.equal(
      grr1?.item.implementationNarrative.kind === "documented"
        ? grr1.item.implementationNarrative.text
        : "",
      "CAC authentication is documented for operators.",
    );
  });

  it("keeps the required parameter cases visible and unresolved where the model is unresolved", () => {
    const document = buildIl4AddendumDocument(inputFor());
    const nistIds = nistEntries(document).map((entry) => entry.item.id);
    assert.equal(nistIds.includes("sc-18"), false);
    assert.equal(nistIds.includes("ac-1"), false);
    assert.equal(document.membershipNotes.length, 1);
    assert.equal(document.membershipNotes[0]?.id, "sc-18");
    assert.match(document.membershipNotes[0]?.explanation ?? "", /inclusion-only/);
    assert.match(document.membershipNotes[0]?.explanation ?? "", /FedRAMP Moderate/);

    const ac7 = entryById(document, "ac-7");
    assert.ok(ac7);
    assert.ok(ac7.item.notices.some((notice) => notice.kind === "authoritative-value-required"));
    assert.ok(
      ac7.item.parameterResolutions.some(
        (resolution) => resolution.unresolvedReason === "authoritative-value-required",
      ),
    );
    assert.match(ac7.item.resolvedStatement, /Unresolved ODP:/);

    const ia51 = entryById(document, "ia-5.1");
    assert.ok(ia51);
    assert.ok(ia51.item.notices.some((notice) => notice.kind === "source-conflict"));
    assert.match(
      ia51.item.notices.find((notice) => notice.kind === "source-conflict")?.explanation ?? "",
      /has not chosen a winner/,
    );
    const iaSources = new Set(ia51.item.frameworkAssignments.map((block) => block.sourceLabel));
    assert.ok(iaSources.has("FedRAMP Moderate"));
    assert.ok(iaSources.has("DoD IL4"));

    const sc46 = entryById(document, "sc-46");
    assert.ok(sc46);
    assert.equal(sc46.inFedrampModerate, false);
    assert.match(
      sc46.item.notices.find((notice) => notice.kind === "conditional-applicability")?.title ?? "",
      /Cross Domain Solution/,
    );
    assert.notEqual(sc46.item.implementationDocumentationStatus.value, "not-applicable");

    const au51 = entryById(document, "au-5.1");
    assert.ok(au51);
    assert.equal(au51.group, "nist-not-in-fedramp-moderate");
    assert.equal(au51.inFedrampModerate, false);
    assert.equal(au51.tableD1AdjustmentKind, "may-use-fedramp");
    assert.equal(au51.effectiveAssignmentSource, "dod-ssp-addendum-v1.2");
    assert.match(au51.effectiveAssignmentProvenanceNote ?? "", /DoD Rev\. 5 SSP Addendum/);
    assert.match(au51.baselineRelationship, /Not present in the FedRAMP Moderate baseline/);
    assert.ok(
      au51.item.frameworkAssignments.some(
        (block) => block.classificationLabel === "DoD permits FedRAMP value",
      ),
    );

    for (const id of ["ma-5.1", "pe-15", "sa-9.3"] as const) {
      const entry = entryById(document, id);
      assert.ok(entry, id);
      const notice = entry.item.notices.find(
        (item) => item.kind === "authoritative-value-required",
      );
      assert.ok(notice, id);
      assert.match(notice.explanation, /has not guessed a value/);
      assert.doesNotMatch(entry.item.resolvedStatement, /DSPAV/i);
      if (entry.item.parameterResolutions.length > 0) {
        assert.ok(
          entry.item.parameterResolutions.some(
            (resolution) => resolution.unresolvedReason === "authoritative-value-required",
          ),
          id,
        );
      }
    }

    const withDemoParameters = buildIl4AddendumDocument(
      inputFor({ parameterRecords: DEMO_IL4_PARAMETER_RECORDS }),
    );
    const demoAc7 = entryById(withDemoParameters, "ac-7");
    assert.ok(demoAc7);
    assert.ok(
      demoAc7.item.notices.some((notice) => notice.kind === "authoritative-value-required"),
    );
    assert.match(demoAc7.item.resolvedStatement, /Unresolved ODP:/);
    const demoIa = entryById(withDemoParameters, "ia-5.1");
    assert.ok(demoIa?.item.notices.some((notice) => notice.kind === "source-conflict"));
    assert.match(
      demoIa?.item.notices.find((notice) => notice.kind === "source-conflict")?.explanation ?? "",
      /has not chosen a winner/,
    );

    for (const id of ["ma-6", "ps-4"] as const) {
      const entry = entryById(document, id);
      assert.ok(entry, id);
      assert.equal(entry.tableD1AdjustmentKind, "may-use-fedramp");
      assert.equal(entry.effectiveAssignmentSource, "fedramp-moderate-baseline");
      assert.match(entry.effectiveAssignmentProvenanceNote ?? "", /does not mean DoD authored/);
      assert.ok(
        entry.item.frameworkAssignments.some(
          (block) =>
            block.sourceLabel === "FedRAMP Moderate" &&
            block.classificationLabel === "DoD permits FedRAMP value",
        ),
      );
    }
  });

  it("uses placeholders for missing system data and does not treat an empty collection as none", () => {
    const document = buildIl4AddendumDocument(inputFor());
    assert.equal(document.identity.systemName.kind, "not-documented");
    assert.equal(
      document.boundaryAndEnvironment.authorizationBoundary.kind,
      "not-documented",
    );
    assert.equal(document.interconnections.collection, "not-documented");
    assert.equal(document.roles.collection, "not-documented");
    assert.equal(document.informationTypes.collection, "not-documented");
    assert.doesNotMatch(document.populationExplanation, /\bNone\b|\bNot applicable\b/);
  });

  it("renders authored system characteristics", () => {
    const document = buildIl4AddendumDocument(
      inputFor({
        metadata: createProjectMetadata({
          systemName: "Snow Goose Cloud Impact Level 4",
          systemNameShort: "Snow Goose",
          organizationName: "Canadian Goose Defence System",
          systemDescription: "Fictional Goose cloud offering.",
          authorizationBoundary: "The Goose cloud boundary.",
          environmentOfOperation: "Commercial cloud, fictional.",
          operationalStatus: "operational",
          dodCloudImpactLevel: { level: "il4", notes: "Asserted for documentation." },
        }),
      }),
    );
    assert.equal(
      document.identity.systemName.kind === "documented"
        ? document.identity.systemName.text
        : "",
      "Snow Goose Cloud Impact Level 4",
    );
    assert.equal(
      document.boundaryAndEnvironment.authorizationBoundary.kind === "documented"
        ? document.boundaryAndEnvironment.authorizationBoundary.text
        : "",
      "The Goose cloud boundary.",
    );
    assert.match(
      document.categorization.dodCloudImpactLevel.kind === "documented"
        ? document.categorization.dodCloudImpactLevel.text
        : "",
      /IL4|Impact Level 4/i,
    );
    assert.equal(placeholderFor("System name"), "[Not yet documented: System name]");
  });

  it("carries evidence metadata without an assessment claim", () => {
    const evidence: EvidenceWithControlIds = {
      id: "ev-1",
      projectId: "project-il4",
      title: "Snow Goose Cloud DoD PKI authentication note",
      description: "Demo note.",
      owner: "Priya Sharma",
      evidenceType: "document",
      status: "active",
      collectionDate: "2026-05-01",
      reviewDueDate: null,
      currentVersionId: null,
      createdAt: GENERATED_AT,
      updatedAt: GENERATED_AT,
      controlIds: ["grr-1"],
    };
    const document = buildIl4AddendumDocument(
      inputFor({}, { evidenceByControlId: new Map([["grr-1", [evidence]]]) }),
    );
    const grr1 = entryById(document, "grr-1");
    assert.equal(grr1?.item.evidenceReferences.length, 1);
    assert.equal(grr1?.item.evidenceReferences[0]?.title, evidence.title);
    assert.equal(grr1?.item.evidenceReferences[0]?.collectionDate, "2026-05-01");
    assert.match(grr1?.item.evidenceReferences[0]?.evidenceTypeLabel ?? "", /document/i);
    const serialized = JSON.stringify(grr1?.item.evidenceReferences);
    assert.doesNotMatch(serialized, /proves implementation|independently assessed|establishes compliance/i);
  });

  it("rejects a non-IL4 framework", () => {
    assert.throws(
      () => buildIl4AddendumDocument(inputFor({ frameworkId: NIST_MODERATE_FRAMEWORK_ID })),
      Il4AddendumUnsupportedFrameworkError,
    );
  });

  it("builds a safe addendum filename", () => {
    assert.equal(
      buildIl4AddendumDocxFilename("Snow Goose Cloud Impact Level 4"),
      "snow-goose-cloud-impact-level-4-il4-ssp-addendum.docx",
    );
    assert.equal(buildIl4AddendumDocxFilename("   "), "il4-ssp-addendum.docx");
    assert.doesNotMatch(
      buildIl4AddendumDocxFilename("Snow Goose"),
      /approved|authorized|certified|official/i,
    );
  });
});
