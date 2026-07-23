export {
  DEFAULT_THEME_PREFERENCE,
  THEME_INIT_SCRIPT,
  THEME_PREFERENCES,
  THEME_PREFERENCE_STORAGE_KEY,
  applyResolvedTheme,
  isThemePreference,
  parseThemePreference,
  readDocumentTheme,
  readStoredThemePreference,
  resolveTheme,
  setThemePreference,
  writeStoredThemePreference,
  type ResolvedTheme,
  type SystemColorScheme,
  type ThemeDocumentRoot,
  type ThemePreference,
} from "@/theme/preference";
export { ThemeProvider, useTheme } from "@/theme/ThemeProvider";
