"use client";

import Link from "next/link";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import {
  accountInitials,
  type AccountMenuAccount,
  type AccountMenuItem,
} from "@/components/auth/account-menu";
import { Button } from "@/components/design-system/button/Button";

export type AccountMenuProps = {
  account: AccountMenuAccount;
  /** Extra actions between the identity block and Sign out. */
  items?: AccountMenuItem[];
  onSignOut: () => void;
};

/**
 * Lightweight accessible account menu. Presentation only — callers supply
 * account labels and the sign-out handler.
 */
export function AccountMenu({
  account,
  items = [],
  onSignOut,
}: AccountMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const initials = accountInitials(account.displayName);

  function close(focusTrigger = true) {
    setOpen(false);
    if (focusTrigger) {
      triggerRef.current?.focus();
    }
  }

  useEffect(() => {
    if (!open) {
      return;
    }

    function onPointerDown(event: MouseEvent | PointerEvent) {
      const root = rootRef.current;
      if (!root || !(event.target instanceof Node)) {
        return;
      }
      if (!root.contains(event.target)) {
        close(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        close(true);
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const firstItem = menuRef.current?.querySelector<HTMLElement>(
      '[role="menuitem"]:not([aria-disabled="true"])',
    );
    firstItem?.focus();
  }, [open]);

  function onTriggerKeyDown(event: ReactKeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setOpen(true);
    }
  }

  function focusMenuItem(offset: number) {
    const items = menuRef.current?.querySelectorAll<HTMLElement>(
      '[role="menuitem"]:not([aria-disabled="true"])',
    );
    if (!items || items.length === 0) {
      return;
    }
    const list = Array.from(items);
    const active = document.activeElement;
    const index = list.findIndex((el) => el === active);
    const next =
      index < 0
        ? offset > 0
          ? 0
          : list.length - 1
        : (index + offset + list.length) % list.length;
    list[next]?.focus();
  }

  function onMenuKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        focusMenuItem(1);
        break;
      case "ArrowUp":
        event.preventDefault();
        focusMenuItem(-1);
        break;
      case "Home":
        event.preventDefault();
        menuRef.current
          ?.querySelectorAll<HTMLElement>(
            '[role="menuitem"]:not([aria-disabled="true"])',
          )[0]
          ?.focus();
        break;
      case "End": {
        event.preventDefault();
        const all = menuRef.current?.querySelectorAll<HTMLElement>(
          '[role="menuitem"]:not([aria-disabled="true"])',
        );
        all?.[all.length - 1]?.focus();
        break;
      }
      case "Tab":
        close(false);
        break;
      default:
        break;
    }
  }

  function runItem(item: AccountMenuItem) {
    if (item.disabled) {
      return;
    }
    item.onSelect?.();
    close(true);
  }

  return (
    <div className="relative" ref={rootRef}>
      <Button
        ref={triggerRef}
        type="button"
        variant="default"
        size="sm"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={`Account menu for ${account.displayName}`}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={onTriggerKeyDown}
        className="max-w-[12rem] gap-2"
      >
        <span
          aria-hidden="true"
          className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-sm bg-surface-secondary text-[0.65rem] font-semibold text-foreground"
        >
          {initials}
        </span>
        <span className="hidden min-w-0 truncate sm:inline">
          {account.displayName}
        </span>
      </Button>

      {open ? (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label="Account"
          tabIndex={-1}
          onKeyDown={onMenuKeyDown}
          className="absolute right-0 z-20 mt-2 w-[min(16rem,calc(100vw-2rem))] rounded-md border border-border bg-surface py-1 shadow-md"
        >
          <div className="border-b border-border px-3 py-2" role="presentation">
            <p className="truncate text-sm font-medium text-foreground">
              {account.displayName}
            </p>
            <p className="mt-0.5 truncate text-xs text-text-secondary">
              {account.organizationName}
            </p>
          </div>

          {items.length > 0 ? (
            <ul className="border-b border-border py-1" role="presentation">
              {items.map((item) => (
                <li key={item.id} role="presentation">
                  {item.href && !item.disabled ? (
                    <Link
                      role="menuitem"
                      href={item.href}
                      className="block w-full px-3 py-2 text-left text-sm text-foreground hover:bg-surface-secondary focus-visible:bg-surface-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-focus-ring"
                      onClick={() => runItem(item)}
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      role="menuitem"
                      disabled={item.disabled}
                      aria-disabled={item.disabled || undefined}
                      className="block w-full px-3 py-2 text-left text-sm text-foreground hover:bg-surface-secondary focus-visible:bg-surface-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-50"
                      onClick={() => runItem(item)}
                    >
                      {item.label}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          ) : null}

          <div className="py-1" role="presentation">
            <button
              type="button"
              role="menuitem"
              className="block w-full px-3 py-2 text-left text-sm text-foreground hover:bg-surface-secondary focus-visible:bg-surface-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-focus-ring"
              onClick={() => {
                close(false);
                onSignOut();
              }}
            >
              Sign out
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
