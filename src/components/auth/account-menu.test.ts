import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  accountInitials,
  isThemeMenuOptionSelected,
  THEME_MENU_OPTIONS,
  themeMenuOptionLabel,
} from "@/components/auth/account-menu";

describe("account menu helpers", () => {
  it("builds initials from one or two name parts", () => {
    assert.equal(accountInitials("Ada Lovelace"), "AL");
    assert.equal(accountInitials("ada"), "AD");
    assert.equal(accountInitials("  "), "?");
  });

  it("exposes System, Light, and Dark theme options in order", () => {
    assert.deepEqual(
      THEME_MENU_OPTIONS.map((option) => option.value),
      ["system", "light", "dark"],
    );
    assert.deepEqual(
      THEME_MENU_OPTIONS.map((option) => option.label),
      ["System", "Light", "Dark"],
    );
  });

  it("labels and selects the current theme preference", () => {
    assert.equal(themeMenuOptionLabel("system"), "System");
    assert.equal(themeMenuOptionLabel("light"), "Light");
    assert.equal(themeMenuOptionLabel("dark"), "Dark");
    assert.equal(isThemeMenuOptionSelected("dark", "dark"), true);
    assert.equal(isThemeMenuOptionSelected("dark", "light"), false);
    assert.equal(isThemeMenuOptionSelected("system", "system"), true);
  });
});
