/**
 * Client UI theme preference (ADR-022).
 * Independent of authentication and business logic. Persistence is localStorage
 * only — never mirrored to the server.
 */

export const THEME_PREFERENCE_STORAGE_KEY = "cf-theme-preference";

export const THEME_PREFERENCES = ["system", "light", "dark"] as const;

export type ThemePreference = (typeof THEME_PREFERENCES)[number];

/** Resolved document theme applied to <html data-theme>. */
export type ResolvedTheme = "light" | "dark";

export const DEFAULT_THEME_PREFERENCE: ThemePreference = "system";

export function isThemePreference(value: unknown): value is ThemePreference {
  return (
    value === "system" || value === "light" || value === "dark"
  );
}

/** Parse a stored value; invalid or missing → system. */
export function parseThemePreference(raw: string | null | undefined): ThemePreference {
  if (isThemePreference(raw)) {
    return raw;
  }
  return DEFAULT_THEME_PREFERENCE;
}

export function readStoredThemePreference(
  storage: Pick<Storage, "getItem"> | null | undefined = defaultStorage(),
): ThemePreference {
  if (!storage) {
    return DEFAULT_THEME_PREFERENCE;
  }
  try {
    return parseThemePreference(storage.getItem(THEME_PREFERENCE_STORAGE_KEY));
  } catch {
    return DEFAULT_THEME_PREFERENCE;
  }
}

export function writeStoredThemePreference(
  preference: ThemePreference,
  storage: Pick<Storage, "setItem"> | null | undefined = defaultStorage(),
): void {
  if (!storage) {
    return;
  }
  try {
    storage.setItem(THEME_PREFERENCE_STORAGE_KEY, preference);
  } catch {
    // Quota / private mode — preference still applies for this session via apply.
  }
}

export type SystemColorScheme = {
  matchesDark: boolean;
};

/**
 * Resolve preference → light|dark.
 * `systemScheme` must be supplied by the caller (matchMedia or test double).
 */
export function resolveTheme(
  preference: ThemePreference,
  systemScheme: SystemColorScheme,
): ResolvedTheme {
  if (preference === "light") {
    return "light";
  }
  if (preference === "dark") {
    return "dark";
  }
  return systemScheme.matchesDark ? "dark" : "light";
}

export type ThemeDocumentRoot = {
  setAttribute(name: string, value: string): void;
  getAttribute(name: string): string | null;
  style: { colorScheme: string };
};

/** Apply the resolved theme to the document root. */
export function applyResolvedTheme(
  theme: ResolvedTheme,
  root: ThemeDocumentRoot,
): void {
  root.setAttribute("data-theme", theme);
  root.style.colorScheme = theme;
}

export function readDocumentTheme(
  root: ThemeDocumentRoot,
): ResolvedTheme | null {
  const value = root.getAttribute("data-theme");
  return value === "light" || value === "dark" ? value : null;
}

/**
 * Persist preference (when explicit), resolve, and apply to the document root.
 */
export function setThemePreference(
  preference: ThemePreference,
  options: {
    storage?: Pick<Storage, "getItem" | "setItem"> | null;
    root: ThemeDocumentRoot;
    systemScheme: SystemColorScheme;
  },
): ResolvedTheme {
  writeStoredThemePreference(preference, options.storage ?? defaultStorage());
  const resolved = resolveTheme(preference, options.systemScheme);
  applyResolvedTheme(resolved, options.root);
  return resolved;
}

function defaultStorage(): Pick<Storage, "getItem" | "setItem"> | null {
  if (typeof globalThis === "undefined") {
    return null;
  }
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

/**
 * Inline script for <head>: reads localStorage, resolves system preference,
 * sets data-theme + color-scheme before first paint (FOUC prevention).
 */
export const THEME_INIT_SCRIPT = `(function(){try{var k=${JSON.stringify(THEME_PREFERENCE_STORAGE_KEY)};var p=localStorage.getItem(k);var pref=p==="light"||p==="dark"?p:"system";var dark=pref==="dark"||(pref==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);var t=dark?"dark":"light";var r=document.documentElement;r.setAttribute("data-theme",t);r.style.colorScheme=t;}catch(e){}})();`;
