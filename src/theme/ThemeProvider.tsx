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

let cachedSnapshot: ThemeSnapshot | null = null;

function emitThemeChange(): void {
  cachedSnapshot = null;
  for (const listener of listeners) {
    listener();
  }
}

function readSystemScheme(): { matchesDark: boolean } {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return { matchesDark: false };
  }
  return {
    matchesDark: window.matchMedia("(prefers-color-scheme: dark)").matches,
  };
}

function readSnapshot(): ThemeSnapshot {
  const preference = readStoredThemePreference();
  const resolved = resolveTheme(preference, readSystemScheme());
  return { preference, resolved };
}

function getClientSnapshot(): ThemeSnapshot {
  const next = readSnapshot();
  if (
    cachedSnapshot &&
    cachedSnapshot.preference === next.preference &&
    cachedSnapshot.resolved === next.resolved
  ) {
    return cachedSnapshot;
  }
  cachedSnapshot = next;
  return next;
}

function getServerSnapshot(): ThemeSnapshot {
  return {
    preference: DEFAULT_THEME_PREFERENCE,
    resolved: "light",
  };
}

function subscribe(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange);
  const media = window.matchMedia("(prefers-color-scheme: dark)");

  function onMediaChange() {
    const preference = readStoredThemePreference();
    if (preference !== "system") {
      return;
    }
    applyResolvedTheme(
      resolveTheme("system", { matchesDark: media.matches }),
      document.documentElement,
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
    root: document.documentElement,
    systemScheme: readSystemScheme(),
  });
  emitThemeChange();
}

/**
 * Syncs theme preference with the document root and OS preference changes.
 * Must wrap interactive UI that reads or sets theme preference.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const snapshot = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot,
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
