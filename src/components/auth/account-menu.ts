/**
 * Presentation helpers and item contract for the authenticated account menu.
 * Keep session fetching and sign-out side effects out of this module.
 */

export type AccountMenuAccount = {
  displayName: string;
  organizationName: string;
};

/**
 * Optional navigation / settings actions rendered above Sign out.
 * Add Profile, Preferences, etc. here later without changing menu chrome.
 */
export type AccountMenuItem = {
  id: string;
  label: string;
  href?: string;
  onSelect?: () => void;
  disabled?: boolean;
};

/** Initials for the compact avatar trigger (1–2 characters). */
export function accountInitials(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "?";
  }
  if (parts.length === 1) {
    const only = parts[0]!;
    return only.slice(0, 2).toUpperCase();
  }
  return `${parts[0]![0] ?? ""}${parts[parts.length - 1]![0] ?? ""}`.toUpperCase();
}
