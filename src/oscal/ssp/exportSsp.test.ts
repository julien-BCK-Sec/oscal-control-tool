import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { assembleProject } from "@/domain";
import { resolveFrameworkControls } from "@/data/framework";
import {
  frameworkHasOscalSspExport,
  NIST_HIGH_FRAMEWORK_ID,
  NIST_HIGH_IDENTITY,
  NIST_LOW_FRAMEWORK_ID,
  NIST_LOW_IDENTITY,
  NIST_MODERATE_FRAMEWORK_ID,
  NIST_MODERATE_IDENTITY,
  type NistSp80053Rev5Identity,
} from "@/framework/nist-sp-800-53-rev5/identities";
import { CMMC_LEVEL_2_FRAMEWORK_ID } from "@/framework/cmmc-level-2-nist-sp-800-171-r2/identities";
import { NIST_SP80053_REV5_MODERATE_PROFILE_URI } from "@/oscal/ssp/constants";
import { projectToOscalSsp } from "@/oscal/ssp/exportSsp";
import { validateOscalSspDocument } from "@/oscal/ssp/validateSsp";

function createDeterministicUuidFactory() {
  let sequence = 0;
  return () => {
    sequence += 1;
    return `00000000-0000-4000-8000-${String(sequence).padStart(12, "0")}`;
  };
}

function buildProjectSsp(identity: NistSp80053Rev5Identity) {
  const project = assembleProject({
    metadata: {
      systemName: `${identity.profile} Export System`,
      organizationName: "Example Organization",
      systemDescription: "System used for profile-aware SSP export tests.",
    },
    frameworkId: identity.id,
    frameworkControls: resolveFrameworkControls(identity.id),
    implementations: {
      "ac-1": {
        status: "implemented",
        narrative: "Policies are documented and reviewed annually.",
      },
    },
  });
  return projectToOscalSsp(project, {
    lastModified: "2026-08-17T15:00:00.000Z",
    createUuid: createDeterministicUuidFactory(),
  });
}

describe("projectToOscalSsp framework profile metadata", () => {
  const cases = [
    NIST_LOW_IDENTITY,
    NIST_MODERATE_IDENTITY,
    NIST_HIGH_IDENTITY,
  ] as const;

  for (const identity of cases) {
    it(`references the ${identity.profile} profile and passes schema validation`, () => {
      const document = buildProjectSsp(identity);
      const ssp = document["system-security-plan"];
      const resource = ssp["back-matter"].resources[0];
      assert.equal(resource?.title, identity.oscalProfileTitle);
      assert.equal(resource?.rlinks?.[0]?.href, identity.oscalProfileUri);
      assert.equal(
        resource?.rlinks?.[0]?.["media-type"],
        identity.oscalProfileMediaType,
      );
      assert.match(
        ssp["control-implementation"].description,
        new RegExp(identity.title),
      );
      if (identity.id !== NIST_MODERATE_FRAMEWORK_ID) {
        assert.doesNotMatch(
          ssp["control-implementation"].description,
          /Moderate/,
        );
        assert.doesNotMatch(resource?.title ?? "", /Moderate/);
        assert.doesNotMatch(resource?.rlinks?.[0]?.href ?? "", /MODERATE/);
      }
      if (identity.id === NIST_MODERATE_FRAMEWORK_ID) {
        assert.equal(
          resource?.rlinks?.[0]?.href,
          NIST_SP80053_REV5_MODERATE_PROFILE_URI,
        );
      }
      const validation = validateOscalSspDocument(document);
      assert.equal(validation.ok, true);
    });
  }

  it("fails closed for an unknown framework identity", () => {
    assert.throws(
      () =>
        projectToOscalSsp(
          assembleProject({
            metadata: {
              systemName: "Unknown",
              organizationName: "Example",
              systemDescription: "Should not export.",
            },
            frameworkId: "not-a-framework",
            frameworkControls: [],
            implementations: {},
          }),
        ),
      /Unknown framework/,
    );
  });

  it("does not fabricate an OSCAL SSP for CMMC Level 2", () => {
    assert.equal(frameworkHasOscalSspExport(CMMC_LEVEL_2_FRAMEWORK_ID), false);
    assert.equal(frameworkHasOscalSspExport(NIST_MODERATE_FRAMEWORK_ID), true);
    assert.throws(
      () =>
        projectToOscalSsp(
          assembleProject({
            metadata: {
              systemName: "CMMC",
              organizationName: "Example",
              systemDescription: "Should not export.",
            },
            frameworkId: CMMC_LEVEL_2_FRAMEWORK_ID,
            frameworkControls: resolveFrameworkControls(CMMC_LEVEL_2_FRAMEWORK_ID),
            implementations: {},
          }),
        ),
      /Unknown framework/,
    );
  });

  it("keeps Low, Moderate, and High profile URIs distinct", () => {
    assert.notEqual(
      NIST_LOW_IDENTITY.oscalProfileUri,
      NIST_MODERATE_IDENTITY.oscalProfileUri,
    );
    assert.notEqual(
      NIST_MODERATE_IDENTITY.oscalProfileUri,
      NIST_HIGH_IDENTITY.oscalProfileUri,
    );
    assert.match(NIST_LOW_IDENTITY.oscalProfileUri, /LOW-baseline_profile/);
    assert.match(NIST_HIGH_IDENTITY.oscalProfileUri, /HIGH-baseline_profile/);
    assert.equal(NIST_LOW_FRAMEWORK_ID.endsWith("-low"), true);
    assert.equal(NIST_HIGH_FRAMEWORK_ID.endsWith("-high"), true);
  });
});
