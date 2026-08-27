import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DEFAULT_FRAMEWORK_ID,
  assertProductSelectableFrameworkId,
  isProductSelectableFramework,
} from "@/data/framework";
import { DOD_CLOUD_IL4_FRAMEWORK_ID } from "@/framework/dod-cloud-il4-rev5/identities";
import { NIST_MODERATE_FRAMEWORK_ID } from "@/framework/nist-sp-800-53-rev5/identities";

/**
 * createProjectAction uses assertProductSelectableFrameworkId as the
 * product-create boundary. createProjectForOrg still accepts any registered ID.
 */
describe("createProjectAction framework selection", () => {
  it("accepts DoD IL4 and keeps Moderate as the omitted-id default", () => {
    assert.equal(DEFAULT_FRAMEWORK_ID, NIST_MODERATE_FRAMEWORK_ID);
    assert.equal(
      assertProductSelectableFrameworkId(DOD_CLOUD_IL4_FRAMEWORK_ID),
      DOD_CLOUD_IL4_FRAMEWORK_ID,
    );
    assert.equal(
      assertProductSelectableFrameworkId(NIST_MODERATE_FRAMEWORK_ID),
      NIST_MODERATE_FRAMEWORK_ID,
    );
  });

  it("rejects unknown and productSelectable=false frameworks", () => {
    assert.throws(
      () => assertProductSelectableFrameworkId("not-a-framework"),
      /Unknown framework/,
    );
    assert.equal(
      isProductSelectableFramework({
        id: "unpublished-overlay",
        title: "Unpublished",
        catalog: "Test",
        revision: "",
        profile: "Hidden",
        provider: "test",
        source: "test",
        productSelectable: false,
      }),
      false,
    );
  });
});
