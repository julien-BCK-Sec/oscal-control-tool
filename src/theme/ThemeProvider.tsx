"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  DEFAULT_THEME_PREFERENCE,
  applyResolvedTheme,
  readStoredThemePreference,
  resolveTheme,
  setThemePreference as persistAndApplyTheme,
  type ResolvedTheme,
  type ThemePreference,
} from "@/theme/preference";

type ThemeSnapshot = {
  preference: ThemePreference;
  resolved: ResolvedTheme;
};

type ThemeContextValue = ThemeSnapshot & {
  setPreference: (preference: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const listeners = new Set<() => void>();

/**
 * Stable server snapshot for useSyncExternalStore.
 * Must be the same object identity on every getServerSnapshot call (Object.is).
 */
const SERVER_SNAPSHOT: ThemeSnapshot = Object.freeze({
  preference: DEFAULT_THEME_PREFERENCE,
  resolved: "light" as const,
});

/** Cached client snapshot; replaced only when preference or resolved theme changes. */
let cachedClientSnapshot: ThemeSnapshot | null = null;

function emitThemeChange(): void {
  cachedClientSnapshot = null;
  for (const listener of listeners) {
    listener();
  }
}

function readSystemScheme(): { matchesDark: boolean } {
  if (typeof globalThis.matchMedia !== "function") {
    return { matchesDark: false };
  }
  return {
    matchesDark: globalThis.matchMedia("(prefers-color-scheme: dark)").matches,
  };
}

function documentRoot(): HTMLElement {
  return globalThis.document.documentElement;
}

/**
 * Client snapshot for useSyncExternalStore.
 * Returns the cached object when preference and resolved theme are unchanged.
 */
export function getThemeClientSnapshot(): ThemeSnapshot {
  const preference = readStoredThemePreference();
  const resolved = resolveTheme(preference, readSystemScheme());
  if (
    cachedClientSnapshot &&
    cachedClientSnapshot.preference === preference &&
    cachedClientSnapshot.resolved === resolved
  ) {
    return cachedClientSnapshot;
  }
  cachedClientSnapshot = { preference, resolved };
  return cachedClientSnapshot;
}

/**
 * Server snapshot for useSyncExternalStore.
 * Always returns the module-level constant (stable Object.is identity).
 */
export function getThemeServerSnapshot(): ThemeSnapshot {
  return SERVER_SNAPSHOT;
}

/**
 * Subscribe to theme store updates and OS color-scheme changes when preference
 * is `system`. Stable module-level identity for useSyncExternalStore.
 */
export function subscribeToTheme(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange);

  if (typeof globalThis.matchMedia !== "function") {
    return () => {
      listeners.delete(onStoreChange);
    };
  }

  const media = globalThis.matchMedia("(prefers-color-scheme: dark)");

  function onMediaChange() {
    const preference = readStoredThemePreference();
    if (preference !== "system") {
      return;
    }
    applyResolvedTheme(
      resolveTheme("system", { matchesDark: media.matches }),
      documentRoot(),
    );
    emitThemeChange();
  }

  media.addEventListener("change", onMediaChange);
  return () => {
    listeners.delete(onStoreChange);
    media.removeEventListener("change", onMediaChange);
  };
}

function setPreferenceClient(preference: ThemePreference): void {
  persistAndApplyTheme(preference, {
    root: documentRoot(),
    systemScheme: readSystemScheme(),
  });
  emitThemeChange();
}

/** Test helper: clear the client snapshot cache and listeners. */
export function resetThemeStoreForTests(): void {
  cachedClientSnapshot = null;
  listeners.clear();
}

/**
 * Syncs theme preference with the document root and OS preference changes.
 * Must wrap interactive UI that reads or sets theme preference.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const snapshot = useSyncExternalStore(
    subscribeToTheme,
    getThemeClientSnapshot,
    getThemeServerSnapshot,
  );

  const setPreference = useCallback((preference: ThemePreference) => {
    setPreferenceClient(preference);
  }, []);

  const value = useMemo(
    () => ({
      preference: snapshot.preference,
      resolved: snapshot.resolved,
      setPreference,
    }),
    [snapshot.preference, snapshot.resolved, setPreference],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}
