# Milestone 1: Platform Foundation

## Status

Implemented on `feat/platform-foundation`. Required decisions are recorded in
ADR-014 through ADR-019 (`docs/decisions.md`).

## Objective

Move Control Freak from a trusted single-user SQLite deployment to a secure multi-user foundation using PostgreSQL, organizations, users, memberships, authentication, role-based authorization, invitations, and tested tenant isolation.

This milestone establishes the platform required for later collaboration features. It does not implement comments, mentions, notifications, evidence management, or advanced reporting.

## Outcomes

At completion:

- PostgreSQL is the supported application database.
- Existing repository and service boundaries remain intact or are deliberately evolved through ADRs.
- Users authenticate through the approved authentication mechanism.
- Every project belongs to an organization.
- Users access organizations through memberships.
- Server-side authorization enforces role permissions.
- Organization administrators can invite and manage members.
- Cross-tenant access is prevented and covered by automated tests.
- Existing project authoring, review workflow, activity history, versions, OSCAL export, and demo behavior continue to work.

## In scope

- PostgreSQL database support
- Drizzle PostgreSQL schema and migrations
- Migration of existing SQLite data
- Organization entity
- User entity
- Organization membership entity
- Project-to-organization ownership
- Authentication integration
- Server-side session and actor resolution
- Role-based access control
- Organization invitations
- Team/member management
- Tenant-aware repositories and services
- Tenant-isolation and authorization tests
- Production configuration and deployment documentation
- Backup and rollback documentation
- Updating current-state, architecture, roadmap, decisions, and deployment docs

## Explicitly out of scope

- Comments and discussions
- @mentions
- Notifications
- Review queues beyond existing review workflow
- Evidence uploads or evidence library
- Multi-framework catalog expansion
- AI features
- Billing or subscriptions
- Enterprise SSO beyond the approved authentication mechanism
- SCIM
- Fine-grained custom roles
- Public API or webhooks
- Horizontal scaling unless specifically required by the chosen deployment design
- Major UI redesign unrelated to account and organization management

## Required architectural decisions

Implementation must not begin beyond exploratory work until these decisions are recorded or explicitly confirmed:

1. Authentication provider or authentication implementation
2. Session strategy
3. Production PostgreSQL provider and connection model
4. SQLite-to-PostgreSQL migration and rollback strategy
5. Initial role model
6. Invitation expiration and acceptance behavior
7. Whether the current demo deployment remains available and how demo access is controlled

Record accepted decisions in `docs/decisions.md` before relying on them in code.

## Initial domain model

### Organization

Required fields:

- stable identifier
- name
- slug or equivalent human-readable identifier
- created timestamp
- updated timestamp

### User

Required fields:

- stable identifier
- authentication-provider subject or equivalent external identity key
- email
- display name
- created timestamp
- updated timestamp

Do not store passwords unless an explicit ADR approves first-party credential authentication.

### OrganizationMembership

Required fields:

- stable identifier
- organization identifier
- user identifier
- role
- membership status if invitations and active membership share a model
- created timestamp
- updated timestamp

The pair `(organizationId, userId)` must be unique for active membership semantics.

### Project

Every project must belong to exactly one organization after migration.

Existing project document content and OSCAL-independent domain behavior must remain unchanged except where organization context is required.

### Invitation

Required fields:

- stable identifier
- organization identifier
- invited email
- invited role
- invitation token stored safely
- inviter user identifier
- expiration timestamp
- accepted timestamp or status
- created timestamp

Invitation tokens must not be stored in recoverable plaintext if a hashed-token design is practical for the chosen implementation.

## Initial roles

Use the smallest role model required for the milestone:

- `organization_admin`
- `project_manager`
- `author`
- `reviewer`
- `viewer`

Do not implement custom roles in this milestone.

## Minimum permission expectations

### Organization admin

- View and manage organization membership
- Invite and remove members
- Assign organization roles
- Create, view, update, and delete projects in the organization
- Perform all author and reviewer actions

### Project manager

- Create and manage projects in the organization
- Assign control owners and reviewers where supported
- Perform author and reviewer actions
- Cannot manage organization administrators unless explicitly approved

### Author

- View assigned or organization-visible projects according to the approved access model
- Edit project metadata and control implementation content
- Edit permitted control operational metadata
- Submit or resubmit controls for review

### Reviewer

- View permitted projects and controls
- Start reviews
- Approve controls
- Request changes
- Reopen reviews if the approved workflow allows it
- Cannot edit implementation narratives unless separately permitted

### Viewer

- Read permitted organization and project content
- Cannot mutate projects, controls, memberships, invitations, or review status

The exact permission matrix must be encoded centrally and tested. UI visibility is not authorization.

## Work packages

### Work package 1: PostgreSQL foundation

- Add PostgreSQL configuration and Drizzle support.
- Preserve repository interfaces where practical.
- Create forward-only PostgreSQL migrations.
- Add development and test database setup.
- Verify clean database creation.
- Do not remove SQLite migration tooling until data migration and rollback decisions are complete.

Acceptance criteria:

- Application starts against a clean PostgreSQL database.
- Existing project repository tests pass against PostgreSQL or an approved equivalent test strategy.
- Health check verifies PostgreSQL connectivity without exposing secrets.
- No application code depends directly on a global SQLite connection.

Suggested commit:

`chore: add PostgreSQL persistence foundation`

### Work package 2: Existing data migration

- Implement a repeatable migration path from the current SQLite schema.
- Migrate projects, snapshots, control records, and control activities.
- Preserve identifiers, revisions, timestamps, project JSON, review state, and activity ordering.
- Define how existing projects are assigned to an initial organization.
- Produce a migration verification report.

Acceptance criteria:

- Migration works against a representative copy of existing data.
- Record counts and key relationships are verified.
- Existing named versions and activity history remain readable.
- Migration can be safely rerun or fails clearly without duplicating data.
- Rollback or recovery procedure is documented.

Suggested commit:

`feat: migrate existing SQLite data to PostgreSQL`

### Work package 3: Organizations and memberships

- Add Organization, User, and OrganizationMembership persistence.
- Assign every project to an organization.
- Add application-facing repositories or services.
- Update project list and project load paths to require organization context.

Acceptance criteria:

- Organization-owned records cannot be loaded without organization context.
- A user can belong to multiple organizations.
- Duplicate memberships are prevented.
- Project identifiers cannot be used to bypass tenant boundaries.

Suggested commit:

`feat: add organizations and memberships`

### Work package 4: Authentication and actor resolution

- Integrate the approved authentication mechanism.
- Establish a server-side authenticated session.
- Resolve the current user and organization context.
- Replace the current generic actor fallback for authenticated user actions while preserving a system actor for automated operations.
- Add sign-in, sign-out, and unauthorized states with minimal UI.

Acceptance criteria:

- Unauthenticated users cannot access protected application routes or server actions.
- Authenticated actions create activity entries with the correct actor identity.
- Session data cannot be forged through client-provided fields.
- Authentication secrets are server-only.

Suggested commit:

`feat: add authentication and session identity`

### Work package 5: Centralized RBAC

- Implement a centralized authorization service or policy module.
- Map roles to explicit permissions.
- Apply authorization before repository reads and mutations.
- Apply role rules to existing review transitions.
- Hide unavailable UI actions without relying on hiding as enforcement.

Acceptance criteria:

- Permission rules exist in one authoritative module.
- Server actions fail closed when permission is absent.
- Viewer mutation attempts fail.
- Author and reviewer transitions follow the approved matrix.
- Organization access is checked for every organization-owned resource.

Suggested commit:

`feat: enforce role-based authorization`

### Work package 6: Invitations and team management

- Allow organization administrators to invite users by email.
- Implement invitation expiration, acceptance, duplicate handling, and revocation.
- Add a minimal team management interface using the existing design system.
- Prevent privilege escalation through invitation acceptance or role editing.

Acceptance criteria:

- Only authorized roles can issue, revoke, or change invitations and memberships.
- Expired, revoked, reused, or invalid tokens fail safely.
- An accepted invitation creates or activates the correct membership exactly once.
- Users cannot grant a role above their own authority under the approved rules.

Suggested commit:

`feat: add organization invitations and team management`

### Work package 7: Tenant-isolation and authorization test suite

Add focused tests proving at minimum:

- User A cannot read Organization B.
- User A cannot list Organization B projects.
- User A cannot load a known Project B identifier.
- User A cannot mutate Project B.
- User A cannot read or mutate Project B control records or activities.
- Viewer cannot edit project or control content.
- Viewer cannot trigger review transitions.
- Author cannot approve a review unless explicitly permitted.
- Reviewer cannot perform prohibited authoring actions.
- Removed membership loses access immediately.
- Invitation acceptance cannot create membership in the wrong organization.
- Client-supplied organization identifiers cannot override session authorization.

Acceptance criteria:

- Positive and negative authorization tests pass.
- Tests exercise server-side entry points, not only policy helper functions.
- Test fixtures include at least two organizations and multiple roles.

Suggested commit:

`test: verify tenant isolation and role permissions`

### Work package 8: Documentation and deployment readiness

- Update all affected documentation.
- Document environment variables and secret handling.
- Document migration, backup, rollback, and production verification.
- Update demo seed behavior for organization ownership and authenticated access.
- Verify production startup behavior.

Acceptance criteria:

- `docs/current-state.md` accurately describes PostgreSQL, authentication, tenancy, and known gaps.
- `docs/architecture.md` shows authentication, authorization, repositories, and PostgreSQL flow.
- `docs/decisions.md` contains the required ADRs.
- `docs/roadmap.md` marks Milestone 1 complete only after acceptance.
- Deployment documentation no longer claims SQLite is the active production architecture.
- Manual production smoke-test steps are documented.

Suggested commit:

`docs: document platform foundation architecture and operations`

## Migration verification requirements

The completion report must include:

- source SQLite file or fixture description;
- migration command used;
- row counts before and after for each migrated table;
- orphan and foreign-key checks;
- project revision and snapshot checks;
- representative OSCAL export comparison;
- activity ordering verification;
- known transformations or defaults;
- rollback or recovery procedure.

Do not use a production database as the first migration test.

## Required automated verification

Run at minimum:

```bash
npm test
npm run lint
npm run build
```

Also run all database-specific migration and integration tests introduced by this milestone.

When dependencies change:

```bash
npm audit
```

Do not declare the milestone complete while tenant-isolation tests are absent or failing.

## Required manual verification

- Sign in and sign out.
- Create or access two organizations with different users.
- Confirm each user sees only authorized projects.
- Create a project and verify organization ownership.
- Edit an implementation as an author.
- Submit it for review.
- Review it as a reviewer.
- Confirm a viewer cannot edit or review.
- Invite a new member and accept the invitation.
- Remove a member and confirm access is revoked.
- Export and validate an existing project as OSCAL.
- Restart the application and confirm persistence.
- Verify health check behavior.

## Documentation updates

Required:

- `docs/current-state.md`
- `docs/architecture.md`
- `docs/decisions.md`
- `docs/roadmap.md`
- deployment documentation
- migration and rollback playbook

Update `docs/design-system.md` only when reusable account or organization UI primitives are added.

Update `docs/oscal-standards-alignment.md` only if OSCAL behavior changes.

## Definition of done

Milestone 1 is complete only when:

- all work packages are complete;
- PostgreSQL is the supported application database;
- existing data migration is verified;
- authentication is active;
- all projects are organization-owned;
- server-side RBAC is enforced;
- invitations and team management work;
- tenant-isolation tests pass;
- existing authoring, review, history, versioning, and OSCAL export behavior pass regression tests;
- required documentation is current;
- production migration and rollback procedures are documented;
- `npm test`, `npm run lint`, and `npm run build` pass;
- no unresolved security blocker is hidden.

## Agent execution instruction

When assigned this milestone autonomously:

- Work on a dedicated feature branch.
- Complete work packages in order.
- Commit after each completed package only when commits are explicitly authorized.
- Run focused tests before each commit.
- Stop at any required architectural decision that is not approved.
- Do not merge, deploy, or touch production data.
- Finish with the completion report required by `AGENTS.md`.
