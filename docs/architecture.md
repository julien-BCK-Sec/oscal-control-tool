# Architecture

The application separates product concerns into independent layers.

Each layer has a single responsibility.

---

## Framework Layer

Provides read-only compliance framework information.

Responsibilities:

- FrameworkProvider
- FrameworkControl
- Framework metadata
- Framework derivation

Framework data is never persisted in application storage.

---

## Domain Layer

Represents the application's business model.

Contains:

- Project
- Control implementation
- Project metadata
- Domain services

The domain model is the source of truth.

The domain model is independent of OSCAL.

---

## Operational Layer

Stores application-specific operational information.

Contains:

- ControlRecord
- Review workflow
- Activity history
- Ownership
- Comments / threaded discussions
- Mentions
- Assignments
- In-app notifications
- Evidence (future)

Operational metadata is never stored inside OSCAL documents.

---

## Platform Services Layer

Milestone 1 capabilities:

- PostgreSQL persistence (ADR-014)
- Better Auth email/password sessions and organization plugin (ADR-015)
- Database-backed opaque session cookies
- Centralized Control Freak RBAC over organization roles (ADR-017)
- Organization invitations (ADR-018)
- Authenticated invite-only demo bootstrap (ADR-019)
- Development-only full demo bootstrap (`npm run bootstrap:demo` under
  `src/seed/dev-bootstrap/`) — env ensure, migrate, identity, projects,
  collaboration; not a production seed path

Milestone 02A capabilities:

- Control-scoped collaboration (ADR-020)
- Discussion / assignment / notification services over PostgreSQL repositories
- Collaboration events on the shared ControlActivity stream

Actor identity for activity rows comes from the authenticated session for user
actions and from the System actor for automated operations.

Later capabilities remain independent of UI and persistence:

- Email / external notifications
- AI services
- Evidence processing
- Background jobs / workflow automation (Milestone 02B)

---

## Persistence Layer

Provides repositories for application storage.

Examples:

- ProjectRepository (organization-scoped)
- OrganizationRepository (memberships / invitations)
- ControlRecordRepository
- ActivityRepository
- CommentRepository
- AssignmentRepository
- NotificationRepository

Repositories isolate the database from business logic.

Local development uses `compose.yaml` (PostgreSQL 16). See the README Quick
Start for `docker compose up -d` and cleanup commands.

Authorization checks occur in server wrappers / actions **before** repository
reads and mutations. A resource identifier alone is never sufficient.

---

## Export Layer

Transforms the domain model into standards-based exports.

Examples:

- OSCAL SSP
- Word (future)
- PDF (future)

Exporters adapt the domain model.

They do not define it.

Collaboration metadata is never included in OSCAL exports.

---

## Presentation Layer

Contains:

- Next.js
- React
- Design System
- Workspace UI
- Sign-in and organization team settings
- Collaboration UI (discussion panel, assignments, notification center,
  mention autocomplete)

Presentation never performs persistence directly.

Presentation never contains OSCAL serialization.

UI may hide unauthorized actions but is never the authorization boundary.

---

## Runtime flow (authenticated request)

```text
Browser cookie session
        │
        ▼
Better Auth getSession (server)
        │
        ▼
Resolve org membership + role (member table)
        │
        ▼
requirePermission (src/authz)
        │
        ▼
Repository / service (PostgreSQL)
        │
        ▼
Domain / OSCAL export as needed
```

Collaboration mutations follow the same path through authorized wrappers in
`src/server/` (discussions, assignments, notifications) before persistence.

---

## Architectural Principles

- Keep standards separate from operational metadata.
- Keep framework data read-only.
- Keep the domain model independent of export formats.
- Keep repositories database-specific.
- Keep UI independent of persistence.
- Keep exports deterministic.
- Keep application metadata separate from compliance content.
- Fail closed on missing authentication, membership, or permission.
- Never trust client-supplied organization, role, or membership claims.
