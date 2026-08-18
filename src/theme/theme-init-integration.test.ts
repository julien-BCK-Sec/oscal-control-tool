import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import {
  THEME_INIT_SCRIPT,
  THEME_INIT_SCRIPT_ID,
  THEME_INIT_SCRIPT_STRATEGY,
} from "@/theme/preference";

describe("root layout theme initializer integration", () => {
  const layoutSource = readFileSync(
    path.join(process.cwd(), "src/app/layout.tsx"),
    "utf8",
  );
  const scriptComponentSource = readFileSync(
    path.join(process.cwd(), "src/theme/ThemeInitScript.tsx"),
    "utf8",
  );

  it("uses next/script instead of a raw React <script> tag", () => {
    assert.match(layoutSource, /ThemeInitScript/);
    assert.doesNotMatch(layoutSource, /<script\s/);
    assert.doesNotMatch(layoutSource, /dangerouslySetInnerHTML/);
    assert.match(scriptComponentSource, /from "next\/script"/);
    assert.match(scriptComponentSource, /THEME_INIT_SCRIPT_STRATEGY/);
    assert.equal(THEME_INIT_SCRIPT_STRATEGY, "beforeInteractive");
    assert.equal(THEME_INIT_SCRIPT_ID, "cf-theme-init");
    assert.match(THEME_INIT_SCRIPT, /data-theme/);
  });
});
