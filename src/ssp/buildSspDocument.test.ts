import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { ControlRecord } from "@/data/control-record";
import type { EvidenceWithControlIds } from "@/data/evidence";
import {
  cmmcLevel2FrameworkProvider,
  dodCloudIl4FrameworkProvider,
  frameworkRegistry,
  nistModerateFrameworkProvider,
} from "@/data/framework";
import { createProjectMetadata } from "@/data/project";
import { CMMC_LEVEL_2_FRAMEWORK_ID } from "@/framework/cmmc-level-2-nist-sp-800-171-r2/identities";
import {
  DOD_CLOUD_IL4_FRAMEWORK_ID,
  IL4_GRR_COUNT,
  IL4_TOTAL_COUNT,
} from "@/framework/dod-cloud-il4-rev5/identities";
import { NIST_MODERATE_FRAMEWORK_ID } from "@/framework/nist-sp-800-53-rev5/identities";
import type { StoredProject } from "@/persistence/types";
import { buildSspDocument } from "./buildSspDocument";
import { deriveOverallImpact } from "./categorization";
import { buildSspDocxFilename } from "./filename";
import {
  completenessText,
  EMPTY_COLLECTION_COPY,
  placeholderFor,
} from "./placeholders";
import type { SspGenerationInput } from "./types";
import { CF_SSP_DOCUMENT_TYPE, CF_SSP_LAYOUT_ID, CF_SSP_LAYOUT_VERSION } from "./types";

const GENERATED_AT = "2026-09-16T12:00:00.000Z";

function storedProject(
  patch: Partial<StoredProject> & { frameworkId: string },
): StoredProject {
  return {
    id: patch.id ?? "project-1",
    name: patch.name ?? "Test Project",
    organizationId: patch.organizationId ?? "org-1",
    frameworkId: patch.frameworkId,
    schemaVersion: patch.schemaVersion ?? 2,
    revision: patch.revision ?? 7,
    createdAt: patch.createdAt ?? GENERATED_AT,
    updatedAt: patch.updatedAt ?? GENERATED_AT,
    metadata: patch.metadata ?? createProjectMetadata(),
    implementations: patch.implementations ?? {},
    parameterRecords: patch.parameterRecords ?? {},
  };
}

function inputFor(
  frameworkId: string,
  patch: Partial<StoredProject> = {},
  extras: Partial<
    Pick<SspGenerationInput, "controlRecordsByControlId" | "evidenceByControlId">
  > = {},
): SspGenerationInput {
  const framework = frameworkRegistry.require(frameworkId).getFramework();
  const descriptor = frameworkRegistry.requireDescriptor(frameworkId);
  return {
    project: storedProject({ frameworkId, ...patch }),
    framework,
    descriptor,
    controlRecordsByControlId: extras.controlRecordsByControlId ?? new Map(),
    evidenceByControlId: extras.evidenceByControlId ?? new Map(),
    generatedAt: GENERATED_AT,
  };
}

function itemById(input: SspGenerationInput, id: string) {
  const document = buildSspDocument(input);
  for (const family of document.families) {
    const found = family.items.find((item) => item.id === id);
    if (found) {
      return found;
    }
  }
  return undefined;
}

describe("buildSspDocxFilename", () => {
  it("sanitizes the system name and appends the SSP suffix", () => {
    assert.equal(
      buildSspDocxFilename("Snow Goose Cloud IL4"),
      "snow-goose-cloud-il4-system-security-plan.docx",
    );
  });

  it("falls back when the name sanitizes to empty", () => {
    assert.equal(buildSspDocxFilename("***"), "system-security-plan.docx");
    assert.equal(buildSspDocxFilename("   "), "system-security-plan.docx");
  });
});

describe("deriveOverallImpact", () => {
  it("uses the FIPS 200 high-water mark", () => {
    assert.equal(deriveOverallImpact("low", "low", "low").level, "low");
    assert.equal(deriveOverallImpact("low", "moderate", "low").level, "moderate");
    assert.equal(deriveOverallImpact("high", "moderate", "low").level, "high");
    assert.equal(deriveOverallImpact("low", "moderate", "low").label, "Moderate");
  });
});

describe("buildSspDocument system characteristics", () => {
  it("maps empty metadata to not-documented placeholders", () => {
    const document = buildSspDocument(inputFor(NIST_MODERATE_FRAMEWORK_ID));
    assert.equal(document.identity.documentType, CF_SSP_DOCUMENT_TYPE);
    assert.equal(document.identity.layoutId, CF_SSP_LAYOUT_ID);
    assert.equal(document.identity.layoutVersion, CF_SSP_LAYOUT_VERSION);
    assert.equal(document.identity.generatedAt, GENERATED_AT);
    assert.equal(document.identity.projectRevision, 7);
    assert.equal(document.identity.projectSchemaVersion, 2);
    assert.equal(document.identity.systemName.kind, "not-documented");
    assert.equal(
      completenessText(document.identity.systemName),
      placeholderFor("System name"),
    );
    assert.equal(document.identity.sspOrganization.kind, "not-documented");
    assert.equal(document.systemOverview.overview.kind, "not-documented");
    assert.equal(
      document.boundaryAndEnvironment.authorizationBoundary.kind,
      "not-documented",
    );
    assert.equal(
      document.boundaryAndEnvironment.environmentOfOperation.kind,
      "not-documented",
    );
    assert.equal(document.roles.collection, "not-documented");
    assert.equal(document.informationTypes.collection, "not-documented");
    assert.equal(document.interconnections.collection, "not-documented");
    assert.match(EMPTY_COLLECTION_COPY.interconnections, /not been documented/);
    assert.match(EMPTY_COLLECTION_COPY.interconnections, /not a claim that none exist/);
    assert.equal(document.categorization.confidentiality.kind, "not-documented");
    assert.equal(document.categorization.derivedOverallImpact, null);
    assert.equal(document.categorization.dodCloudImpactLevel.kind, "not-documented");
  });

  it("does not treat empty collections as none-exist assertions", () => {
    const document = buildSspDocument(inputFor(NIST_MODERATE_FRAMEWORK_ID));
    assert.deepEqual(document.roles.rows, []);
    assert.deepEqual(document.interconnections.rows, []);
    assert.equal(document.interconnections.collection, "not-documented");
  });

  it("keeps incomplete roles from being accountable", () => {
    const document = buildSspDocument(
      inputFor(NIST_MODERATE_FRAMEWORK_ID, {
        metadata: createProjectMetadata({
          systemRoles: [
            {
              id: "role-1",
              role: "system-owner",
              name: "",
              title: "Director",
            },
            {
              id: "role-2",
              role: "other",
              name: "Pat",
            },
          ],
        }),
      }),
    );
    assert.equal(document.roles.collection, "documented");
    assert.equal(document.roles.rows[0]?.isCompleteAccountableRole, false);
    assert.equal(document.roles.rows[0]?.name.kind, "not-documented");
    assert.equal(document.roles.rows[1]?.isCompleteAccountableRole, false);
    assert.equal(document.roles.rows[1]?.roleLabel, "Other");
  });

  it("derives overall FIPS impact only when all three system CIA values are authored", () => {
    const partial = buildSspDocument(
      inputFor(NIST_MODERATE_FRAMEWORK_ID, {
        metadata: createProjectMetadata({
          securityCategorization: { confidentiality: "moderate" },
        }),
      }),
    );
    assert.equal(partial.categorization.derivedOverallImpact, null);
    assert.equal(partial.categorization.confidentiality.kind, "documented");
    assert.equal(partial.categorization.integrity.kind, "not-documented");

    const complete = buildSspDocument(
      inputFor(NIST_MODERATE_FRAMEWORK_ID, {
        metadata: createProjectMetadata({
          securityCategorization: {
            confidentiality: "low",
            integrity: "moderate",
            availability: "low",
            rationale: "Mission analysis",
          },
        }),
      }),
    );
    assert.equal(complete.categorization.derivedOverallImpact?.level, "moderate");
    assert.equal(complete.categorization.derivedOverallImpact?.label, "Moderate");
    assert.match(
      complete.categorization.derivedOverallImpact?.derivationNote ?? "",
      /not inferred from information types or framework selection/,
    );
  });

  it("does not populate categorization from framework selection or information types", () => {
    const il4 = buildSspDocument(
      inputFor(DOD_CLOUD_IL4_FRAMEWORK_ID, {
        metadata: createProjectMetadata({
          informationTypes: [
            {
              id: "it-1",
              title: "CUI",
              confidentialityImpact: "moderate",
              integrityImpact: "moderate",
              availabilityImpact: "moderate",
            },
          ],
        }),
      }),
    );
    assert.equal(il4.identity.documentedAgainst.frameworkId, DOD_CLOUD_IL4_FRAMEWORK_ID);
    assert.equal(il4.categorization.confidentiality.kind, "not-documented");
    assert.equal(il4.categorization.dodCloudImpactLevel.kind, "not-documented");
    assert.equal(il4.categorization.derivedOverallImpact, null);
    assert.equal(il4.informationTypes.collection, "documented");
    assert.equal(il4.informationTypes.rows[0]?.confidentiality.kind, "documented");
  });

  it("maps authored system characteristics without mixing tenant or overview fields", () => {
    const document = buildSspDocument(
      inputFor(NIST_MODERATE_FRAMEWORK_ID, {
        metadata: createProjectMetadata({
          systemName: "Goose Platform",
          systemNameShort: "GP",
          systemIdentifier: "GP-1",
          organizationName: "Canadian Goose Defence System",
          systemDescription: "Protect migratory flocks.",
          authorizationBoundary: "The cloud VPC.",
          environmentOfOperation: "AWS us-east-1.",
          operationalStatus: "operational",
          dodCloudImpactLevel: { level: "il4", notes: "Target environment" },
        }),
      }),
    );
    assert.equal(completenessText(document.identity.systemName), "Goose Platform");
    assert.equal(
      completenessText(document.identity.sspOrganization),
      "Canadian Goose Defence System",
    );
    assert.equal(
      completenessText(document.systemOverview.overview),
      "Protect migratory flocks.",
    );
    assert.equal(
      completenessText(document.boundaryAndEnvironment.authorizationBoundary),
      "The cloud VPC.",
    );
    assert.equal(
      completenessText(document.boundaryAndEnvironment.environmentOfOperation),
      "AWS us-east-1.",
    );
    assert.notEqual(
      completenessText(document.systemOverview.overview),
      completenessText(document.boundaryAndEnvironment.authorizationBoundary),
    );
    assert.equal(document.systemOverview.operationalStatus.kind, "documented");
    assert.equal(
      completenessText(document.categorization.dodCloudImpactLevel),
      "IL4. Target environment",
    );
  });
});

describe("buildSspDocument NIST", () => {
  it("includes selected baseline items with enhancements nested after parents", () => {
    const document = buildSspDocument(inputFor(NIST_MODERATE_FRAMEWORK_ID));
    const moderate = nistModerateFrameworkProvider.getFramework();
    assert.equal(document.counts.totalItems, moderate.controls.length);
    assert.equal(document.identity.documentedAgainst.itemSingular, "control");
    const acFamily = document.families.find((group) => group.family.includes("Access"));
    assert.ok(acFamily);
    const ac2Index = acFamily.items.findIndex((item) => item.id === "ac-2");
    const ac21Index = acFamily.items.findIndex((item) => item.id === "ac-2.1");
    assert.ok(ac2Index >= 0);
    assert.ok(ac21Index > ac2Index);
    const ac21 = acFamily.items[ac21Index];
    assert.equal(ac21?.itemKind, "enhancement");
    assert.equal(ac21?.displayId, "AC-2 (1)");
    assert.equal(ac21?.parentId, "ac-2");
  });

  it("humanizes ODPs without substituting assignments into the source statement", () => {
    const ac1 = itemById(inputFor(NIST_MODERATE_FRAMEWORK_ID), "ac-1");
    assert.ok(ac1);
    assert.match(ac1.sourceStatement, /Unresolved ODP:/);
    assert.doesNotMatch(ac1.sourceStatement, /\{\{\s*insert:\s*param/);
    assert.ok(ac1.unresolvedParameters.length > 0);
    assert.equal(ac1.frameworkAssignments.length, 0);
  });

  it("maps implementation documentation status and optional owner label", () => {
    const record: ControlRecord = {
      id: "cr-1",
      projectId: "project-1",
      controlId: "ac-1",
      owner: "Alex Owner",
      coOwner: "",
      businessUnit: "",
      implementationStatus: "approved",
      reviewDueDate: null,
      evidenceRequirement: "required",
      reviewStatus: "approved",
      createdAt: GENERATED_AT,
      updatedAt: GENERATED_AT,
    };
    const ac1 = itemById(
      inputFor(
        NIST_MODERATE_FRAMEWORK_ID,
        {
          implementations: {
            "ac-1": {
              status: "in-progress",
              narrative: "We are writing the policy.",
            },
          },
        },
        { controlRecordsByControlId: new Map([["ac-1", record]]) },
      ),
      "ac-1",
    );
    assert.ok(ac1);
    assert.equal(ac1.implementationDocumentationStatus.value, "in-progress");
    assert.equal(ac1.implementationDocumentationStatus.label, "In progress");
    assert.equal(ac1.implementationNarrative.kind, "documented");
    assert.equal(ac1.implementationOwnerLabel, "Alex Owner");
    assert.doesNotMatch(JSON.stringify(ac1), /"approved"/);
  });

  it("defaults missing implementations to not started and not documented narrative", () => {
    const ac1 = itemById(inputFor(NIST_MODERATE_FRAMEWORK_ID), "ac-1");
    assert.ok(ac1);
    assert.equal(ac1.implementationDocumentationStatus.value, "not-started");
    assert.equal(ac1.implementationDocumentationStatus.label, "Not started");
    assert.equal(ac1.implementationNarrative.kind, "not-documented");
    assert.equal(ac1.implementationOwnerLabel, null);
  });
});

describe("buildSspDocument CMMC", () => {
  it("uses requirement terminology and canonical origin references", () => {
    const document = buildSspDocument(inputFor(CMMC_LEVEL_2_FRAMEWORK_ID));
    const cmmc = cmmcLevel2FrameworkProvider.getFramework();
    assert.equal(document.counts.totalItems, cmmc.controls.length);
    assert.equal(document.identity.documentedAgainst.itemSingular, "requirement");
    assert.equal(document.identity.documentedAgainst.itemPlural, "requirements");
    const first = document.families[0]?.items[0];
    assert.ok(first);
    assert.equal(first.itemKind, "requirement");
    assert.match(first.id, /^[A-Z]{2}\.L2-/);
    assert.ok(first.originId);
    assert.match(first.originId, /^3\.\d+\.\d+$/);
    assert.equal(first.frameworkAssignments.length, 0);
    assert.doesNotMatch(first.itemKind, /control/);
  });
});

describe("buildSspDocument IL4 overlay semantics", () => {
  const il4Input = () => inputFor(DOD_CLOUD_IL4_FRAMEWORK_ID);

  it("includes the full 345-item population and 10 GRRs", () => {
    const document = buildSspDocument(il4Input());
    const il4 = dodCloudIl4FrameworkProvider.getFramework();
    assert.equal(il4.controls.length, IL4_TOTAL_COUNT);
    assert.equal(document.counts.totalItems, 345);
    const grrs = document.families
      .flatMap((group) => group.items)
      .filter((item) => item.itemKind === "grr");
    assert.equal(grrs.length, IL4_GRR_COUNT);
  });

  it("represents FedRAMP inherited assignments separately from the source statement", () => {
    const ac1 = itemById(il4Input(), "ac-1");
    assert.ok(ac1);
    assert.match(ac1.sourceStatement, /Unresolved ODP:/);
    assert.doesNotMatch(ac1.sourceStatement, /at least every 3 years/i);
    assert.ok(
      ac1.frameworkAssignments.some((block) =>
        /at least every 3 years/i.test(block.text),
      ),
    );
    assert.equal(
      ac1.frameworkAssignments[0]?.classificationLabel,
      "FedRAMP base, inherited for IL4",
    );
  });

  it("represents DoD IL4 adjustments without inlining per-ODP resolution", () => {
    const sa95 = itemById(il4Input(), "sa-9.5");
    assert.ok(sa95);
    assert.ok(
      sa95.frameworkAssignments.some(
        (block) => block.classificationLabel === "DoD IL4 adjustment",
      ),
    );
    assert.match(sa95.sourceStatement, /Unresolved ODP:|the organization|organization-defined/i);
  });

  it("labels DoD-permitted FedRAMP values with Addendum provenance for AU-5(1)", () => {
    const au51 = itemById(il4Input(), "au-5.1");
    assert.ok(au51);
    assert.equal(au51.itemKind, "enhancement");
    assert.equal(au51.displayId, "AU-5 (1)");
    assert.ok(
      au51.frameworkAssignments.some(
        (block) =>
          block.classificationLabel === "DoD permits FedRAMP value" &&
          block.sourceLabel === "DoD IL4",
      ),
    );
  });

  it("represents satisfied-by-overlay as a control-level assignment", () => {
    const sc24 = itemById(il4Input(), "sc-24");
    assert.ok(sc24);
    assert.ok(
      sc24.frameworkAssignments.some(
        (block) =>
          block.classificationLabel === "DoD IL4 adjustment" &&
          /Table D-1 required a DSPAV/.test(block.supportingText ?? ""),
      ),
    );
    assert.doesNotMatch(sc24.sourceStatement, /known secure state/);
  });

  it("keeps authoritative-value-required unresolved and does not invent DSPAV values", () => {
    const ac7 = itemById(il4Input(), "ac-7");
    assert.ok(ac7);
    const notice = ac7.notices.find(
      (entry) => entry.kind === "authoritative-value-required",
    );
    assert.ok(notice);
    assert.match(notice.explanation, /has not guessed a value/);
    assert.doesNotMatch(ac7.sourceStatement, /DSPAV/i);
  });

  it("preserves both sides of a source conflict and chooses no winner", () => {
    const ia51 = itemById(il4Input(), "ia-5.1");
    assert.ok(ia51);
    const conflict = ia51.notices.find((entry) => entry.kind === "source-conflict");
    assert.ok(conflict);
    assert.match(conflict.explanation, /has not chosen a winner/);
    const sources = new Set(ia51.frameworkAssignments.map((block) => block.sourceLabel));
    assert.ok(sources.has("FedRAMP Moderate"));
    assert.ok(sources.has("DoD IL4"));
  });

  it("keeps SC-46 conditional and included", () => {
    const sc46 = itemById(il4Input(), "sc-46");
    assert.ok(sc46);
    const notice = sc46.notices.find(
      (entry) => entry.kind === "conditional-applicability",
    );
    assert.ok(notice);
    assert.match(notice.title, /Cross Domain Solution \(CDS\)/);
    assert.equal(
      sc46.implementationDocumentationStatus.value,
      "not-started",
    );
  });

  it("represents GRR-1 as a general readiness requirement", () => {
    const grr1 = itemById(il4Input(), "grr-1");
    assert.ok(grr1);
    assert.equal(grr1.itemKind, "grr");
    assert.equal(grr1.displayId, "GRR-1");
    assert.equal(grr1.originId, null);
    assert.equal(grr1.parentId, null);
    assert.match(grr1.family, /General Readiness/);
    assert.match(grr1.sourceStatement, /DoD PKI/i);
    assert.equal(grr1.originId, null);
  });
});

describe("buildSspDocument Evidence", () => {
  it("includes non-archived linked Evidence metadata and excludes archived", () => {
    const active: EvidenceWithControlIds = {
      id: "ev-2",
      projectId: "project-1",
      title: "Access policy",
      description: "",
      owner: "secret-owner",
      evidenceType: "policy",
      status: "active",
      collectionDate: "2026-01-02",
      reviewDueDate: "2026-02-01",
      currentVersionId: "ver-1",
      createdAt: GENERATED_AT,
      updatedAt: GENERATED_AT,
      controlIds: ["ac-1"],
    };
    const draft: EvidenceWithControlIds = {
      ...active,
      id: "ev-1",
      title: "Draft screenshot",
      evidenceType: "screenshot",
      status: "draft",
      collectionDate: null,
    };
    const archived: EvidenceWithControlIds = {
      ...active,
      id: "ev-3",
      title: "Old log",
      evidenceType: "log",
      status: "archived",
    };
    const ac1 = itemById(
      inputFor(
        NIST_MODERATE_FRAMEWORK_ID,
        {},
        {
          evidenceByControlId: new Map([
            ["ac-1", [active, archived, draft]],
          ]),
        },
      ),
      "ac-1",
    );
    assert.ok(ac1);
    assert.deepEqual(
      ac1.evidenceReferences.map((row) => row.title),
      ["Access policy", "Draft screenshot"],
    );
    assert.equal(ac1.evidenceReferences[0]?.evidenceTypeLabel, "Policy");
    assert.equal(ac1.evidenceReferences[0]?.lifecycleStatusLabel, "Active");
    assert.equal(ac1.evidenceReferences[0]?.collectionDate, "2026-01-02");
    assert.equal(ac1.evidenceReferences[1]?.lifecycleStatusLabel, "Draft");
    const serialized = JSON.stringify(ac1.evidenceReferences);
    assert.doesNotMatch(serialized, /secret-owner/);
    assert.doesNotMatch(serialized, /ver-1/);
    assert.doesNotMatch(serialized, /ev-2/);
  });
});

describe("buildSspDocument parameter resolution", () => {
  it("preserves the source statement and synthesizes a partial resolved requirement", () => {
    const ac7 = itemById(
      inputFor(NIST_MODERATE_FRAMEWORK_ID, {
        parameterRecords: {
          "ac-07_odp.01": {
            controlId: "ac-7",
            parameterId: "ac-07_odp.01",
            intent: "organization-defined",
            body: { form: "assignment", values: ["5"] },
          },
          "ac-07_odp.02": {
            controlId: "ac-7",
            parameterId: "ac-07_odp.02",
            intent: "organization-defined",
            body: {
              form: "assignment",
              values: [
                "Immediately upon receipt of a validated termination event",
              ],
            },
          },
        },
      }),
      "ac-7",
    );
    assert.ok(ac7);
    assert.match(ac7.sourceStatement, /Unresolved ODP: ac-07_odp.01/);
    assert.match(ac7.resolvedStatement, /limit of 5 consecutive invalid logon/);
    assert.match(
      ac7.resolvedStatement,
      /Immediately upon receipt of a validated termination event/,
    );
    assert.match(ac7.resolvedStatement, /Unresolved ODP: ac-07_odp.03/);
    assert.ok(
      ac7.parameterResolutions.some(
        (row) => row.id === "ac-07_odp.01" && row.state === "project-resolved",
      ),
    );
    assert.ok(
      ac7.parameterResolutions.some(
        (row) => row.id === "ac-07_odp.03" && row.state === "unresolved",
      ),
    );
  });

  it("keeps documented deviations, DSPAV assertions, and conflict notes out of the resolved insert", () => {
    const nist = itemById(
      inputFor(NIST_MODERATE_FRAMEWORK_ID, {
        parameterRecords: {
          "ac-07_odp.01": {
            controlId: "ac-7",
            parameterId: "ac-07_odp.01",
            intent: "documented-deviation",
            body: { form: "assignment", values: ["5"] },
          },
        },
      }),
      "ac-7",
    );
    assert.ok(nist);
    assert.doesNotMatch(nist.resolvedStatement, /limit of 5 consecutive/);

    const dspav = itemById(
      inputFor(DOD_CLOUD_IL4_FRAMEWORK_ID, {
        parameterRecords: {
          "ma-05.01_odp": {
            controlId: "ma-5.1",
            parameterId: "ma-05.01_odp",
            intent: "dspav-assertion",
            body: { form: "assignment", values: ["escort-only"] },
            dspavSourceNote: "Restricted DSPAV",
          },
        },
      }),
      "ma-5.1",
    );
    assert.ok(dspav);
    assert.match(dspav.resolvedStatement, /Unresolved ODP:/);
    assert.doesNotMatch(dspav.resolvedStatement, /escort-only/);
    assert.ok(
      dspav.parameterAnnotations.some((row) => row.kind === "dspav-assertion"),
    );

    const conflict = itemById(
      inputFor(DOD_CLOUD_IL4_FRAMEWORK_ID, {
        parameterRecords: {
          "ia-05.01_odp.01": {
            controlId: "ia-5.1",
            parameterId: "ia-05.01_odp.01",
            intent: "conflict-proceeding",
            notes: "Proceeded using FedRAMP additional guidance.",
          },
        },
      }),
      "ia-5.1",
    );
    assert.ok(conflict);
    assert.ok(
      conflict.parameterAnnotations.some(
        (row) => row.kind === "conflict-proceeding",
      ),
    );
    assert.ok(conflict.notices.some((row) => row.kind === "source-conflict"));
  });

  it("does not inline IL4 control-level overlay prose into individual inserts", () => {
    const ac1 = itemById(inputFor(DOD_CLOUD_IL4_FRAMEWORK_ID), "ac-1");
    assert.ok(ac1);
    assert.match(ac1.sourceStatement, /Unresolved ODP:/);
    assert.doesNotMatch(ac1.resolvedStatement, /at least every 3 years/i);
    assert.ok(
      ac1.frameworkAssignments.some((block) =>
        /at least every 3 years/i.test(block.text),
      ),
    );
  });
});
