# Roadmap

## Next approved milestone

**Milestone 1 – Platform Foundation** (in progress on `feat/platform-foundation`)

Introduce multi-user capabilities while preserving repository, Server Action,
and OSCAL boundaries. See `docs/milestones/01-platform-foundation.md` and
ADR-014 through ADR-019.

### Deliverables

- PostgreSQL support
- Organizations
- Memberships
- Better Auth (email/password + verification)
- RBAC
- Invitations
- Authenticated invite-only demo

### Success criteria

- Existing demo project still functions under organization ownership.
- Tenant isolation enforced and tested.
- Users belong to organizations.
- Authentication is operational.
- Existing authoring / review / OSCAL regression tests pass.
- Documentation updated.

## Later (not next)

- Word/PDF export (formerly sequenced as Milestone 5)
- Comments, mentions, notifications
- Evidence management
- Additional compliance frameworks
- AI-assisted authoring