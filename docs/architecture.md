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
- Comments
- Evidence
- Assignments

Operational metadata is never stored inside OSCAL documents.

---

## Persistence Layer

Provides repositories for application storage.

Examples:

- ProjectRepository
- ControlRecordRepository
- ActivityRepository

Repositories isolate the database from business logic.

---

## Export Layer

Transforms the domain model into standards-based exports.

Examples:

- OSCAL SSP
- Word
- PDF

Exporters adapt the domain model.

They do not define it.

---

## Presentation Layer

Contains:

- Next.js
- React
- Design System
- Workspace UI

Presentation never performs persistence directly.

Presentation never contains OSCAL serialization.

---

## Platform Services Layer

Milestone 1 introduces:

- PostgreSQL persistence (ADR-014)
- Better Auth email/password sessions and organization plugin (ADR-015)
- Centralized Control Freak RBAC over organization roles (ADR-017)
- Organization invitations (ADR-018)

Later capabilities remain independent of UI and persistence:

- Notifications
- AI services
- Evidence processing
- Background jobs

---

## Architectural Principles

- Keep standards separate from operational metadata.
- Keep framework data read-only.
- Keep the domain model independent of export formats.
- Keep repositories database-specific.
- Keep UI independent of persistence.
- Keep exports deterministic.
- Keep application metadata separate from compliance content.