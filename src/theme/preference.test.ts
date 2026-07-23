import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import {
  DEFAULT_THEME_PREFERENCE,
  THEME_INIT_SCRIPT,
  THEME_PREFERENCE_STORAGE_KEY,
  applyResolvedTheme,
  parseThemePreference,
  readDocumentTheme,
  readStoredThemePreference,
  resolveTheme,
  setThemePreference,
  writeStoredThemePreference,
  type ThemeDocumentRoot,
} from "@/theme/preference";

function createMemoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear() {
      map.clear();
    },
    getItem(key: string) {
      return map.has(key) ? map.get(key)! : null;
    },
    key(index: number) {
      return Array.from(map.keys())[index] ?? null;
    },
    removeItem(key: string) {
      map.delete(key);
    },
    setItem(key: string, value: string) {
      map.set(key, String(value));
    },
  };
}

function createDocumentRoot(): ThemeDocumentRoot & {
  attrs: Map<string, string>;
} {
  const attrs = new Map<string, string>();
  return {
    attrs,
    setAttribute(name: string, value: string) {
      attrs.set(name, value);
    },
    getAttribute(name: string) {
      return attrs.has(name) ? attrs.get(name)! : null;
    },
    style: { colorScheme: "" },
  };
}

describe("theme preference", () => {
  afterEach(() => {
    // no shared globals mutated in these unit tests
  });

  it("defaults to system when no stored preference exists", () => {
    const storage = createMemoryStorage();
    assert.equal(readStoredThemePreference(storage), DEFAULT_THEME_PREFERENCE);
    assert.equal(parseThemePreference(null), "system");
    assert.equal(parseThemePreference(undefined), "system");
    assert.equal(parseThemePreference("nope"), "system");
  });

  it("reads a stored light preference", () => {
    const storage = createMemoryStorage();
    storage.setItem(THEME_PREFERENCE_STORAGE_KEY, "light");
    assert.equal(readStoredThemePreference(storage), "light");
  });

  it("reads a stored dark preference", () => {
    const storage = createMemoryStorage();
    storage.setItem(THEME_PREFERENCE_STORAGE_KEY, "dark");
    assert.equal(readStoredThemePreference(storage), "dark");
  });

  it("persists an explicit preference", () => {
    const storage = createMemoryStorage();
    writeStoredThemePreference("dark", storage);
    assert.equal(storage.getItem(THEME_PREFERENCE_STORAGE_KEY), "dark");
    writeStoredThemePreference("light", storage);
    assert.equal(storage.getItem(THEME_PREFERENCE_STORAGE_KEY), "light");
    writeStoredThemePreference("system", storage);
    assert.equal(storage.getItem(THEME_PREFERENCE_STORAGE_KEY), "system");
  });

  it("resolves system preference from the OS color scheme", () => {
    assert.equal(resolveTheme("system", { matchesDark: true }), "dark");
    assert.equal(resolveTheme("system", { matchesDark: false }), "light");
  });

  it("ignores system scheme when preference is light or dark", () => {
    assert.equal(resolveTheme("light", { matchesDark: true }), "light");
    assert.equal(resolveTheme("light", { matchesDark: false }), "light");
    assert.equal(resolveTheme("dark", { matchesDark: false }), "dark");
    assert.equal(resolveTheme("dark", { matchesDark: true }), "dark");
  });

  it("applies the resolved theme to the document root", () => {
    const root = createDocumentRoot();
    applyResolvedTheme("dark", root);
    assert.equal(root.getAttribute("data-theme"), "dark");
    assert.equal(root.style.colorScheme, "dark");
    assert.equal(readDocumentTheme(root), "dark");

    applyResolvedTheme("light", root);
    assert.equal(root.getAttribute("data-theme"), "light");
    assert.equal(root.style.colorScheme, "light");
    assert.equal(readDocumentTheme(root), "light");
  });

  it("switches themes via setThemePreference and persists", () => {
    const storage = createMemoryStorage();
    const root = createDocumentRoot();

    let resolved = setThemePreference("dark", {
      storage,
      root,
      systemScheme: { matchesDark: false },
    });
    assert.equal(resolved, "dark");
    assert.equal(storage.getItem(THEME_PREFERENCE_STORAGE_KEY), "dark");
    assert.equal(root.getAttribute("data-theme"), "dark");

    resolved = setThemePreference("light", {
      storage,
      root,
      systemScheme: { matchesDark: true },
    });
    assert.equal(resolved, "light");
    assert.equal(root.getAttribute("data-theme"), "light");

    resolved = setThemePreference("system", {
      storage,
      root,
      systemScheme: { matchesDark: true },
    });
    assert.equal(resolved, "dark");
    assert.equal(storage.getItem(THEME_PREFERENCE_STORAGE_KEY), "system");
    assert.equal(root.getAttribute("data-theme"), "dark");
  });

  it("reacts to system-theme changes while in system mode", () => {
    const storage = createMemoryStorage();
    const root = createDocumentRoot();
    writeStoredThemePreference("system", storage);

    setThemePreference("system", {
      storage,
      root,
      systemScheme: { matchesDark: false },
    });
    assert.equal(root.getAttribute("data-theme"), "light");

    // Simulate OS flip without changing stored preference.
    const next = resolveTheme(readStoredThemePreference(storage), {
      matchesDark: true,
    });
    applyResolvedTheme(next, root);
    assert.equal(storage.getItem(THEME_PREFERENCE_STORAGE_KEY), "system");
    assert.equal(root.getAttribute("data-theme"), "dark");
  });

  it("does not follow system changes when locked to light or dark", () => {
    const storage = createMemoryStorage();
    const root = createDocumentRoot();

    setThemePreference("light", {
      storage,
      root,
      systemScheme: { matchesDark: false },
    });
    const stillLight = resolveTheme(readStoredThemePreference(storage), {
      matchesDark: true,
    });
    assert.equal(stillLight, "light");
    applyResolvedTheme(stillLight, root);
    assert.equal(root.getAttribute("data-theme"), "light");

    setThemePreference("dark", {
      storage,
      root,
      systemScheme: { matchesDark: true },
    });
    const stillDark = resolveTheme(readStoredThemePreference(storage), {
      matchesDark: false,
    });
    assert.equal(stillDark, "dark");
  });

  it("embeds the storage key in the FOUC init script", () => {
    assert.match(THEME_INIT_SCRIPT, /cf-theme-preference/);
    assert.match(THEME_INIT_SCRIPT, /data-theme/);
    assert.match(THEME_INIT_SCRIPT, /prefers-color-scheme/);
  });
});
