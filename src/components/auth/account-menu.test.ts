import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { accountInitials } from "@/components/auth/account-menu";

describe("account menu helpers", () => {
  it("builds initials from one or two name parts", () => {
    assert.equal(accountInitials("Ada Lovelace"), "AL");
    assert.equal(accountInitials("ada"), "AD");
    assert.equal(accountInitials("  "), "?");
  });
});
