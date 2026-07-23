# Design system

Date: 2026-07-22

## Principles

1. **Governance platform, not a document editor** — narrative authoring is
   primary; ownership, review, and history are operational side panels.
2. **Tokens over one-offs** — colors, spacing, radii, and control heights live
   in `src/app/globals.css` (`:root` + `@theme`). Prefer tokens / shared
   utilities before hard-coded values.
3. **One styling system** — Tailwind v4 + CSS variables. Do not add another UI
   kit or CSS-in-JS layer.
4. **Sentence case** for UI copy (buttons, section titles, helper text). Status
   labels keep established product terms from the domain layer.
5. **Never color alone** — status badges always include a text label.
6. **Brand has one owner** — use `<Brand />` for all logo rendering.

## Brand assets

Located under `public/brand/`:

| File | Use |
|------|-----|
| `mark-on-light.png` | CF mark on light backgrounds |
| `mark-on-dark.png` | CF mark on dark backgrounds |
| `logo-on-light.png` | Horizontal lockup on light backgrounds |
| `logo-on-dark.png` | Horizontal lockup on dark backgrounds |

Do not recreate logos. Do not invent asset-selection logic outside `Brand`.

Prefer `appearance="auto"` so logos follow the resolved theme (ADR-022). Use a
fixed `on-light` / `on-dark` appearance only when a surface is intentionally
always one theme.

```tsx
import { Brand } from "@/components/design-system";

// Expanded navigation / projects home — follows resolved theme
<Brand variant="lockup" appearance="auto" size="sm" priority />

// Compact / mobile
<Brand variant="mark" appearance="auto" size="sm" />
```

Favicon / app icon metadata points at `mark-on-light.png` via `src/app/layout.tsx`.

## Tokens

Defined in `src/app/globals.css`:

- Surfaces, borders, focus ring, text, accent
- On-color foregrounds for solid fills (`--on-accent`, `--on-danger`)
- Primary text alias (`--text-primary`, utility `text-text-primary`)
- Semantic status (success, warning, danger, info, orange, teal)
- Spacing scale (`--space-*`)
- Typography sizes / weights / line heights
- Radii, shadows (`--shadow-subtle`, `--shadow-elevated`), transitions
- Control heights, card padding, layout widths (`--layout-sidebar`,
  `--layout-page-max`, `--product-header-height`)

Light values live on `:root`. Dark values override the same names under
`[data-theme="dark"]` (ADR-022). Prefer changing token values over adding
component-specific dark colors.

Shared component classes: `.btn`, `.btn-primary`, `.btn-danger`, `.btn-sm`,
`.field`, `.label`, `.control-id`, `.ds-card`, `.ds-card-prominent`.

## Theme preference

- Preferences: `system` | `light` | `dark` (default `system`)
- Stored in `localStorage` key `cf-theme-preference` (UI-only; not auth-backed)
- Resolved theme is applied as `data-theme` + `color-scheme` on `<html>`
- Blocking init script in the root layout prevents a wrong-theme flash
- Account menu → Theme section selects the preference
- Implementation: `src/theme/` (`preference.ts`, `ThemeProvider`)

## Component categories

```text
src/components/design-system/
  brand/          Brand
  badge/          StatusBadge + implementation/review maps
  button/         Button
  card/           Card, CardHeader, CardTitle, …
  form/           FormField, FormLabel, FormHint
  layout/         AppShell, ProductHeader, PageContent,
                  Stack, Inline, SplitLayout, ScrollArea,
                  SectionHeader, EmptyState
```

Domain UI stays under `controlBrowser/`, `workspace/`, `collaboration/`, etc.,
and **composes** these primitives.

Collaboration surfaces (`DiscussionPanel`, `AssignmentControls`,
`NotificationCenter`, `MentionTextarea`) live under
`src/components/collaboration/` and reuse `Button`, `SidebarCard`, `Stack`, and
form primitives. Do not move workflow or persistence logic into
`design-system/`.

### Preferred composition

```tsx
<AppShell header={<ProductHeader actions={<AuthenticatedHeaderActions />} />}>
  <PageContent narrow>{/* projects list */}</PageContent>
</AppShell>

<Card prominent aria-labelledby="review-heading">
  <CardHeader>
    <CardTitle id="review-heading">Review</CardTitle>
  </CardHeader>
  <CardContent>
    <ReviewStatusBadge status={reviewStatus} />
    …
  </CardContent>
</Card>

<SplitLayout main={<>…narrative…</>} side={<>…cards…</>} />
```

Control editor sidebar order (operational): ownership → implementation meta →
review → assignments → discussions → history.

## Badge semantics

| Domain | Examples | Variant |
|--------|----------|---------|
| Implementation draft | Draft | neutral |
| Implementation in review | In Review | accent |
| Implementation approved / implemented | Approved, Implemented | success |
| Implementation deprecated | Deprecated | danger |
| Review not reviewed | Not Reviewed | neutral |
| Review ready | Ready for Review | info |
| Review under review | Under Review | warning |
| Review changes requested | Changes Requested | attention |
| Review approved | Approved | success |

Use `ImplementationStatusBadge` / `ReviewStatusBadge` — do not copy badge CSS
into pages.

## Layout patterns

- **ProductHeader** — brand lockup (sm+) / mark (mobile); optional context;
  trailing actions via `AuthenticatedHeaderActions` (notifications + account
  menu). Account menu includes Theme preference (System / Light / Dark).
- **Workspace** — ProductHeader + WorkspaceHeader (project name, tabs, undo) +
  tab panels.
- **Control editor** — sticky control header; `SplitLayout` main (~70%) +
  operational sidebar (~30%); stacks on small screens.
- **Review actions** — desktop: primary action in control header only; Review
  card shows secondary actions + status context (primary still available on
  mobile in the card). Behavior uses the centralized review transition module.

## Responsive rules

- No horizontal page scrolling.
- Lockup → mark below `sm` in ProductHeader.
- Control header primary action: `lg+` only; Review card carries actions on
  narrow viewports.
- Sidebar sticky under `lg` only; stacks below the narrative on mobile.

## Accessibility expectations

- Visible `:focus-visible` rings on interactive controls.
- Labels associated with inputs (`FormLabel` + `htmlFor`).
- Buttons for actions (not clickable divs).
- Status badges include text; unassigned owner announced via `role="status"`.
- `prefers-reduced-motion` short-circuits transitions in `globals.css`.
- Brand: meaningful `alt` by default; `decorative` for redundant placements.
- Theme selector uses `menuitemradio` with a visible Selected label (not color
  alone).

## Guidance for future features

1. Add tokens before inventing new colors; add dark values under
   `[data-theme="dark"]` when introducing new color tokens.
2. Compose `Card` / `FormField` / `StatusBadge` / `Button` before new CSS.
3. Keep OSCAL / workflow logic out of design-system components.
4. Prefer extending maps in `badge/statusMaps.tsx` for new statuses.
5. Keep theme preference independent of authentication and domain code.
