/**
 * Canonical demo Evidence records.
 *
 * Identity is the demo-seed marker in the description, not the title, so a
 * user rename does not create duplicates. Existing rows are never updated.
 */

import type { AppDatabase } from "@/persistence/postgres/client";
import { createPostgresEvidenceService } from "@/persistence/postgres/evidence-service";
import type { ActorIdentity } from "@/persistence/actor";
import type { EvidenceType } from "@/data/evidence";
import { CANONICAL_PROJECTS } from "./catalog";
import { demoSeedMarker, hasDemoSeedMarker } from "./markers";
import {
  DEMO_PEOPLE,
  DEMO_POLICIES,
  DEMO_PROCEDURES,
  DEMO_TERMS,
} from "./world";

export type DemoEvidenceSpec = {
  marker: string;
  title: string;
  description: string;
  owner: string;
  evidenceType: EvidenceType;
  status: "draft" | "active";
  collectionDate: string | null;
  reviewDueDate: string | null;
  controlIds: readonly string[];
};

const FLAGSHIP_EVIDENCE: readonly DemoEvidenceSpec[] = [
  {
    marker: "flagship:ac-policy",
    title: DEMO_POLICIES.accessControl,
    description:
      "Approved CGDS access control policy covering SGOP, FeatherAuth, and Emergency Coconut Reserve custody roles.",
    owner: DEMO_PEOPLE.margotChen.name,
    evidenceType: "policy",
    status: "active",
    collectionDate: "2026-01-15",
    reviewDueDate: "2026-12-15",
    controlIds: ["ac-1", "ac-2", "ac-3"],
  },
  {
    marker: "flagship:featherauth-review",
    title: "FeatherAuth quarterly account review export",
    description:
      "Privileged and standard account review for SGOC, NHOC, and Border Goose Squadron issued from FeatherAuth.",
    owner: DEMO_PEOPLE.priyaSharma.name,
    evidenceType: "log",
    status: "active",
    collectionDate: "2026-04-01",
    reviewDueDate: "2026-07-01",
    controlIds: ["ac-2", "ac-6", "ia-2"],
  },
  {
    marker: "flagship:nestwatch",
    title: "NestWatch monitoring coverage report",
    description:
      "Coverage and sensor health for Nest Perimeter telemetry at Honkwater Barracks and Border Post 17.",
    owner: DEMO_PEOPLE.caseyTremblay.name,
    evidenceType: "document",
    status: "active",
    collectionDate: "2026-03-20",
    reviewDueDate: "2026-09-20",
    controlIds: ["si-4", "au-2", "au-6"],
  },
  {
    marker: "flagship:honk-protocol",
    title: DEMO_POLICIES.incidentResponse,
    description: "Honk Protocol incident response plan used by the Rapid Honk Response Team.",
    owner: DEMO_PEOPLE.averyPatel.name,
    evidenceType: "policy",
    status: "active",
    collectionDate: "2025-11-02",
    reviewDueDate: "2026-11-02",
    controlIds: ["ir-4", "ir-6"],
  },
  {
    marker: "flagship:coconut-reconciliation",
    title: "Quarterly Coconut Reconciliation Q4 2025",
    description: `${DEMO_PROCEDURES.coconutReconciliation} close-out for the ${DEMO_TERMS.emergencyCoconutReserve}.`,
    owner: DEMO_PEOPLE.samOkonkwo.name,
    evidenceType: "attestation",
    status: "active",
    collectionDate: "2026-01-08",
    reviewDueDate: "2026-04-08",
    controlIds: ["cm-2", "cm-6"],
  },
  {
    marker: "flagship:readiness-aar",
    title: "Goose Readiness Exercise 2026 after-action report",
    description:
      "After-action items incorporated into the Migratory Continuity Plan following the named version milestone.",
    owner: DEMO_PEOPLE.morganEllis.name,
    evidenceType: "document",
    status: "active",
    collectionDate: "2026-02-18",
    reviewDueDate: "2026-08-18",
    controlIds: ["cp-2", "cp-9"],
  },
  {
    marker: "flagship:visitor-log",
    title: "Visitor escort log — Border Post 17",
    description: `${DEMO_PROCEDURES.visitorEscort} samples including the Controlled Bread Exception Process.`,
    owner: DEMO_PEOPLE.taylorReid.name,
    evidenceType: "log",
    status: "active",
    collectionDate: "2026-05-12",
    reviewDueDate: null,
    controlIds: ["pe-3"],
  },
  {
    marker: "flagship:at-roster",
    title: "Annual Honk Certification training roster",
    description:
      "Awareness completion for SGOC Mission Operators and NHOC watch officers. Includes the must-not-feed-Gary module.",
    owner: DEMO_PEOPLE.jordanMacLeod.name,
    evidenceType: "attestation",
    status: "active",
    collectionDate: "2026-03-01",
    reviewDueDate: "2027-03-01",
    controlIds: ["at-1", "at-2"],
  },
  {
    marker: "flagship:diagram-draft",
    title: "SGOP HonkNet topology diagram (draft)",
    description:
      "Work in progress network diagram for Mission Control SC-3. Draft Evidence does not satisfy coverage.",
    owner: DEMO_PEOPLE.caseyTremblay.name,
    evidenceType: "screenshot",
    status: "draft",
    collectionDate: null,
    reviewDueDate: null,
    controlIds: ["pl-2"],
  },
  {
    marker: "flagship:ia-policy",
    title: DEMO_POLICIES.identification,
    description: "Identification and authentication policy for FeatherAuth and Mobile Field Terminals.",
    owner: DEMO_PEOPLE.priyaSharma.name,
    evidenceType: "policy",
    status: "active",
    collectionDate: "2026-01-15",
    reviewDueDate: "2026-10-01",
    controlIds: ["ia-2", "ia-5"],
  },
];

const CMMC_EVIDENCE: readonly DemoEvidenceSpec[] = [
  {
    marker: "cmmc:cui-policy",
    title: "CGDS CUI handling policy (enclave excerpt)",
    description:
      "Excerpt of CUI handling rules for the Border Goose Squadron CUI Enclave. Not a CMMC assessment artifact.",
    owner: DEMO_PEOPLE.priyaSharma.name,
    evidenceType: "policy",
    status: "active",
    collectionDate: "2026-02-01",
    reviewDueDate: "2026-08-01",
    controlIds: ["AC.L2-3.1.1", "AC.L2-3.1.2", "AC.L2-3.1.3"],
  },
  {
    marker: "cmmc:access-list",
    title: "Border Post 17 CUI access roster",
    description: "Authorized enclave users for Border Goose Squadron operators.",
    owner: DEMO_PEOPLE.taylorReid.name,
    evidenceType: "log",
    status: "active",
    collectionDate: "2026-04-10",
    reviewDueDate: null,
    controlIds: ["AC.L2-3.1.1", "AC.L2-3.1.5"],
  },
  {
    marker: "cmmc:training-draft",
    title: "CUI awareness module attendance (draft)",
    description: "Incomplete attendance sheet for CUI awareness. Intentionally still draft.",
    owner: DEMO_PEOPLE.jordanMacLeod.name,
    evidenceType: "attestation",
    status: "draft",
    collectionDate: null,
    reviewDueDate: null,
    controlIds: ["AT.L2-3.2.1"],
  },
];

const EVIDENCE_GAP_EVIDENCE: readonly DemoEvidenceSpec[] = [
  {
    marker: "evidence-gap:cims-screenshot",
    title: "CIMS dashboard screenshot (unlinked draft)",
    description:
      "Single screenshot of Coconut Inventory Management System. Most implemented controls have no Evidence.",
    owner: DEMO_PEOPLE.samOkonkwo.name,
    evidenceType: "screenshot",
    status: "draft",
    collectionDate: null,
    reviewDueDate: null,
    controlIds: [],
  },
];

const HIGH_EVIDENCE: readonly DemoEvidenceSpec[] = [
  {
    marker: "high:nhoc-sctm",
    title: "NHOC High baseline security categorization memo",
    description:
      "Decision to overlay the High profile on National Honk Operations Centre after the Goose Readiness Exercise.",
    owner: DEMO_PEOPLE.margotChen.name,
    evidenceType: "document",
    status: "active",
    collectionDate: "2026-03-04",
    reviewDueDate: "2026-09-04",
    controlIds: ["pl-2", "ra-3"],
  },
];

export function flagshipEvidenceSpecs(): readonly DemoEvidenceSpec[] {
  return FLAGSHIP_EVIDENCE;
}

async function ensureEvidenceList(input: {
  db: AppDatabase;
  projectId: string;
  specs: readonly DemoEvidenceSpec[];
  actor: ActorIdentity;
}): Promise<{ created: number }> {
  const service = createPostgresEvidenceService(input.db);
  const existing = await service.listByProject(input.projectId);
  let created = 0;

  for (const spec of input.specs) {
    const found = existing.find((row) =>
      hasDemoSeedMarker(row.description, spec.marker),
    );
    if (found) {
      continue;
    }
    const result = await service.create(
      {
        projectId: input.projectId,
        title: spec.title,
        description: `${spec.description}${demoSeedMarker(spec.marker)}`,
        owner: spec.owner,
        evidenceType: spec.evidenceType,
        status: spec.status,
        collectionDate: spec.collectionDate,
        reviewDueDate: spec.reviewDueDate,
        controlIds: spec.controlIds,
      },
      input.actor,
    );
    existing.push(result.evidence);
    created += 1;
  }

  return { created };
}

export async function ensureCanonicalDemoEvidence(input: {
  db: AppDatabase;
  projects: {
    flagshipId: string;
    cmmcId: string;
    earlyId: string;
    evidenceGapId: string;
    highId: string;
  };
  actor: ActorIdentity;
}): Promise<{ created: number }> {
  const flagship = await ensureEvidenceList({
    db: input.db,
    projectId: input.projects.flagshipId,
    specs: FLAGSHIP_EVIDENCE,
    actor: input.actor,
  });
  const cmmc = await ensureEvidenceList({
    db: input.db,
    projectId: input.projects.cmmcId,
    specs: CMMC_EVIDENCE,
    actor: input.actor,
  });
  const gap = await ensureEvidenceList({
    db: input.db,
    projectId: input.projects.evidenceGapId,
    specs: EVIDENCE_GAP_EVIDENCE,
    actor: input.actor,
  });
  const high = await ensureEvidenceList({
    db: input.db,
    projectId: input.projects.highId,
    specs: HIGH_EVIDENCE,
    actor: input.actor,
  });

  void CANONICAL_PROJECTS.early;
  void input.projects.earlyId;

  return {
    created: flagship.created + cmmc.created + gap.created + high.created,
  };
}
