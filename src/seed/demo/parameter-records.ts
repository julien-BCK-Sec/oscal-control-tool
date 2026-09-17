import type { ProjectParameterRecords } from "@/data/parameter";

/**
 * Explicit project-authored ODP records for demo seeds.
 * Values are not inferred from implementation narratives.
 */
export const DEMO_NIST_MODERATE_PARAMETER_RECORDS: ProjectParameterRecords = {
  "ac-01_odp.01": {
    controlId: "ac-1",
    parameterId: "ac-01_odp.01",
    intent: "organization-defined",
    body: {
      form: "assignment",
      values: ["ISSO and control owners"],
    },
  },
  "ac-01_odp.03": {
    controlId: "ac-1",
    parameterId: "ac-01_odp.03",
    intent: "organization-defined",
    body: {
      form: "selection",
      howMany: "one-or-more",
      selectedChoiceKeys: ["0", "2"],
    },
  },
  "ac-01_odp.04": {
    controlId: "ac-1",
    parameterId: "ac-01_odp.04",
    intent: "organization-defined",
    body: {
      form: "assignment",
      values: ["Chief Information Security Officer"],
    },
  },
  "ac-07_odp.01": {
    controlId: "ac-7",
    parameterId: "ac-07_odp.01",
    intent: "organization-defined",
    body: {
      form: "assignment",
      values: ["5"],
    },
  },
  "ac-07_odp.02": {
    controlId: "ac-7",
    parameterId: "ac-07_odp.02",
    intent: "organization-defined",
    body: {
      form: "assignment",
      values: ["15 minutes"],
    },
  },
  "ac-07_odp.03": {
    controlId: "ac-7",
    parameterId: "ac-07_odp.03",
    intent: "organization-defined",
    body: {
      form: "selection",
      howMany: "one-or-more",
      selectedChoiceKeys: ["1"],
    },
  },
  "ac-02_odp.06": {
    controlId: "ac-2",
    parameterId: "ac-02_odp.06",
    intent: "organization-defined",
    body: {
      form: "assignment",
      values: [
        "Immediately upon receipt of a validated termination event",
      ],
    },
  },
};

export const DEMO_IL4_PARAMETER_RECORDS: ProjectParameterRecords = {
  "ac-07_odp.01": {
    controlId: "ac-7",
    parameterId: "ac-07_odp.01",
    intent: "organization-defined",
    body: {
      form: "assignment",
      values: ["5"],
    },
  },
  "ma-05.01_odp": {
    controlId: "ma-5.1",
    parameterId: "ma-05.01_odp",
    intent: "dspav-assertion",
    body: {
      form: "assignment",
      values: [
        "Escort-only maintenance with sanitization before diagnostic attach",
      ],
    },
    dspavSourceNote: "Restricted DSPAV obtained by the ISSO; not verified by Control Freak",
  },
  "ia-05.01_odp.01": {
    controlId: "ia-5.1",
    parameterId: "ia-05.01_odp.01",
    intent: "conflict-proceeding",
    notes:
      "Organization proceeded using FedRAMP additional guidance while both authoritative sources remain visible.",
  },
  "au-05.01_odp.01": {
    controlId: "au-5.1",
    parameterId: "au-05.01_odp.01",
    intent: "accept-permitted-baseline",
  },
};
