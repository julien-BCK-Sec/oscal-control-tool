import Script from "next/script";
import {
  THEME_INIT_SCRIPT,
  THEME_INIT_SCRIPT_ID,
  THEME_INIT_SCRIPT_STRATEGY,
} from "@/theme/preference";

/**
 * Blocking theme initializer for the root layout.
 * Uses next/script (beforeInteractive) so React does not ignore a raw
 * <script> tag, while still applying data-theme before hydration.
 */
export function ThemeInitScript() {
  return (
    <Script id={THEME_INIT_SCRIPT_ID} strategy={THEME_INIT_SCRIPT_STRATEGY}>
      {THEME_INIT_SCRIPT}
    </Script>
  );
}
