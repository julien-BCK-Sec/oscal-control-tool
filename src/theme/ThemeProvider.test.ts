import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import {
  THEME_PREFERENCE_STORAGE_KEY,
  writeStoredThemePreference,
} from "@/theme/preference";
import {
  getThemeClientSnapshot,
  getThemeServerSnapshot,
  resetThemeStoreForTests,
  subscribeToTheme,
} from "@/theme/ThemeProvider";

type MediaListener = (event: MediaQueryListEvent) => void;

function installMatchMedia(initialMatches: boolean): {
  setMatches: (matches: boolean) => void;
  restore: () => void;
} {
  const listeners = new Set<MediaListener>();
  let matches = initialMatches;

  const mediaQueryList = {
    get matches() {
      return matches;
    },
    media: "(prefers-color-scheme: dark)",
    onchange: null,
    addEventListener(type: string, listener: EventListener) {
      if (type === "change") {
        listeners.add(listener as MediaListener);
      }
    },
    removeEventListener(type: string, listener: EventListener) {
      if (type === "change") {
        listeners.delete(listener as MediaListener);
      }
    },
    addListener() {},
    removeListener() {},
    dispatchEvent() {
      return false;
    },
  } as MediaQueryList;

  const previous = globalThis.matchMedia;
  globalThis.matchMedia = () => mediaQueryList;

  return {
    setMatches(next: boolean) {
      matches = next;
      const event = { matches: next } as MediaQueryListEvent;
      for (const listener of listeners) {
        listener(event);
      }
    },
    restore() {
      globalThis.matchMedia = previous;
    },
  };
}

function installDocumentRoot(): () => void {
  const attrs = new Map<string, string>();
  const previous = globalThis.document;
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: {
      documentElement: {
        setAttribute(name: string, value: string) {
          attrs.set(name, value);
        },
        getAttribute(name: string) {
          return attrs.get(name) ?? null;
        },
        style: { colorScheme: "" },
      },
    },
  });
  return () => {
    Object.defineProperty(globalThis, "document", {
      configurable: true,
      value: previous,
    });
  };
}

function installLocalStorage(): () => void {
  const map = new Map<string, string>();
  const storage = {
    getItem(key: string) {
      return map.has(key) ? map.get(key)! : null;
    },
    setItem(key: string, value: string) {
      map.set(key, String(value));
    },
    removeItem(key: string) {
      map.delete(key);
    },
    clear() {
      map.clear();
    },
  };
  const previous = globalThis.localStorage;
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: storage,
  });
  return () => {
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: previous,
    });
  };
}

afterEach(() => {
  resetThemeStoreForTests();
});

describe("theme store snapshots (useSyncExternalStore)", () => {
  it("returns a stable server snapshot identity", () => {
    const first = getThemeServerSnapshot();
    const second = getThemeServerSnapshot();
    assert.equal(first, second);
    assert.equal(first.preference, "system");
    assert.equal(first.resolved, "light");
  });

  it("returns a stable client snapshot identity when unchanged", () => {
    const restoreStorage = installLocalStorage();
    const media = installMatchMedia(false);
    try {
      writeStoredThemePreference("light", globalThis.localStorage);
      const first = getThemeClientSnapshot();
      const second = getThemeClientSnapshot();
      assert.equal(first, second);
      assert.equal(first.preference, "light");
      assert.equal(first.resolved, "light");
    } finally {
      media.restore();
      restoreStorage();
    }
  });

  it("changes client snapshot identity when the theme changes", () => {
    const restoreStorage = installLocalStorage();
    const media = installMatchMedia(false);
    try {
      writeStoredThemePreference("light", globalThis.localStorage);
      const light = getThemeClientSnapshot();

      writeStoredThemePreference("dark", globalThis.localStorage);
      const dark = getThemeClientSnapshot();

      assert.notEqual(light, dark);
      assert.equal(dark.preference, "dark");
      assert.equal(dark.resolved, "dark");
      // Unchanged re-read keeps the new identity.
      assert.equal(getThemeClientSnapshot(), dark);
    } finally {
      media.restore();
      restoreStorage();
    }
  });

  it("notifies subscribers when the system color scheme changes", () => {
    const restoreStorage = installLocalStorage();
    const restoreDocument = installDocumentRoot();
    const media = installMatchMedia(false);
    try {
      writeStoredThemePreference("system", globalThis.localStorage);
      assert.equal(getThemeClientSnapshot().resolved, "light");

      let notifications = 0;
      const unsubscribe = subscribeToTheme(() => {
        notifications += 1;
      });

      media.setMatches(true);

      assert.equal(notifications, 1);
      const after = getThemeClientSnapshot();
      assert.equal(after.preference, "system");
      assert.equal(after.resolved, "dark");
      assert.equal(
        globalThis.document.documentElement.getAttribute("data-theme"),
        "dark",
      );

      unsubscribe();
    } finally {
      media.restore();
      restoreDocument();
      restoreStorage();
    }
  });

  it("does not notify for system scheme changes when preference is explicit", () => {
    const restoreStorage = installLocalStorage();
    const restoreDocument = installDocumentRoot();
    const media = installMatchMedia(false);
    try {
      writeStoredThemePreference("light", globalThis.localStorage);
      let notifications = 0;
      const unsubscribe = subscribeToTheme(() => {
        notifications += 1;
      });

      media.setMatches(true);

      assert.equal(notifications, 0);
      assert.equal(getThemeClientSnapshot().resolved, "light");
      unsubscribe();
    } finally {
      media.restore();
      restoreDocument();
      restoreStorage();
    }
  });

  it("keeps the storage key used by preference persistence", () => {
    assert.equal(THEME_PREFERENCE_STORAGE_KEY, "cf-theme-preference");
  });
});
