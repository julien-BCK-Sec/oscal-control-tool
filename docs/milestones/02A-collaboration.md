# Milestone 02A: Collaboration

> This milestone builds directly upon Platform Foundation and
> establishes first-class collaboration within Control Freak. It
> intentionally excludes workflow automation (Milestone 02B).

## Status

Draft

## Objective

Introduce first-class collaboration capabilities into Control Freak,
enabling organizations to discuss, review, assign, and track compliance
work directly within the platform while preserving tenant isolation,
auditability, and the integrity of OSCAL content.

Platform Foundation (PostgreSQL, organizations, authentication,
memberships, RBAC, repository pattern, and tenant isolation) is assumed
complete.

## Outcomes

At completion:

-   Organizations collaborate directly inside Control Freak.
-   Discussions are attached to compliance objects.
-   Authorized users assign owners and reviewers.
-   Users receive in-application notifications.
-   Activity history records collaboration events.
-   Collaboration metadata is never exported as OSCAL.
-   Existing authoring, review workflow, version history and exports
    continue without regression.

## In Scope

-   Threaded discussions
-   Comment editing and soft deletion
-   Discussion resolution
-   Mentions
-   Notification center
-   Assignments
-   Collaboration activity history
-   Collaboration repositories and services
-   Tenant-aware authorization
-   Documentation
-   Automated testing

## Explicitly Out of Scope

-   Chat or instant messaging
-   Live collaboration
-   Presence indicators
-   Email notifications
-   Slack / Teams integration
-   Workflow automation
-   AI-assisted collaboration
-   Webhooks
-   Public collaboration APIs

## Accepted Architectural Decisions

The following decisions are approved for this milestone:

1.  Collaboration targets are **Controls only**.
2.  Maximum discussion depth is **unlimited** using a parent-child
    model.
3.  Notifications are retained indefinitely unless explicitly deleted.
4.  Comments are **soft deleted** to preserve auditability.
5.  Assignments support **one primary assignee** per assignment record.
6.  Mentions reference existing organization users only.
7.  Collaboration activity follows the same retention policy as existing
    activity history.

These decisions supersede the exploratory questions from the draft
milestone.

## Domain Model

### Comment

-   Stable identifier
-   Organization identifier
-   Project identifier
-   Control identifier
-   Parent comment identifier (nullable)
-   Author identifier
-   Body
-   Resolution status
-   Created timestamp
-   Updated timestamp
-   Deleted timestamp (nullable)

### Assignment

-   Stable identifier
-   Organization identifier
-   Project identifier
-   Control identifier
-   Assigned user
-   Assignment role
-   Assigned timestamp
-   Completed timestamp (nullable)

### Notification

-   Stable identifier
-   Recipient identifier
-   Triggering actor
-   Event type
-   Related object
-   Read status
-   Created timestamp

## Permission Expectations

### Organization Admin

-   Moderate discussions
-   Manage assignments
-   Delete/restore comments
-   Perform all collaboration actions

### Project Manager

-   Assign work
-   Resolve discussions
-   Moderate project discussions

### Author

-   Create discussions
-   Reply
-   Edit/delete own comments
-   Resolve owned discussions where permitted

### Reviewer

-   Participate in discussions
-   Request changes
-   Resolve review discussions where permitted

### Viewer

-   Read discussions only

Permissions remain centralized and enforced server-side.

# Work Packages

## WP1 -- Collaboration Foundation

-   Database schema
-   Repositories
-   Services
-   Migrations
-   Tenant isolation
-   Repository tests

Suggested commit:

`feat: add collaboration persistence foundation`

------------------------------------------------------------------------

## WP2 -- Threaded Discussions

-   Discussions
-   Replies
-   Edit
-   Soft delete
-   Resolution
-   Audit history

Suggested commit:

`feat: implement threaded discussions`

------------------------------------------------------------------------

## WP3 -- Mentions

-   Mention parsing
-   Identity resolution
-   Authorization
-   Mention tests

Suggested commit:

`feat: implement mentions`

------------------------------------------------------------------------

## WP4 -- Notification Center

-   Notification generation
-   Read/unread
-   Notification UI
-   Duplicate prevention

Suggested commit:

`feat: add notification center`

------------------------------------------------------------------------

## WP5 -- Assignments

-   Assign owners/reviewers
-   Reassign
-   Remove assignments
-   Assignment history

Suggested commit:

`feat: implement assignments`

------------------------------------------------------------------------

## WP6 -- Collaboration Activity History

-   Record collaboration events
-   Preserve ordering
-   Pagination

Suggested commit:

`feat: extend activity history`

------------------------------------------------------------------------

## WP7 -- Collaboration User Interface

-   Discussion panel
-   Assignment controls
-   Notification center
-   Mention autocomplete
-   Accessibility
-   Loading/error states

Suggested commit:

`feat: add collaboration interface`

------------------------------------------------------------------------

## WP8 -- Security & Authorization

-   RBAC integration
-   Tenant isolation
-   Audit events
-   Prevent privilege escalation

Suggested commit:

`feat: secure collaboration authorization`

------------------------------------------------------------------------

## WP9 -- Documentation & Production Readiness

Update:

-   docs/current-state.md
-   docs/architecture.md
-   docs/roadmap.md
-   docs/decisions.md
-   docs/design-system.md (if required)

Suggested commit:

`docs: document collaboration architecture`

## Automated Verification

Run:

``` bash
npm test
npm run lint
npm run build
```

Include repository, authorization, migration and collaboration
integration tests.

## Manual Verification

-   Create discussions
-   Reply
-   Edit/delete comments
-   Resolve discussions
-   Mention users
-   Verify notifications
-   Assign work
-   Verify activity history
-   Confirm tenant isolation
-   Confirm collaboration metadata is excluded from OSCAL exports

## Definition of Done

-   All work packages complete
-   Collaboration repositories implemented
-   Discussions operational
-   Mentions operational
-   Notifications operational
-   Assignments operational
-   Activity history updated
-   Tenant isolation tests passing
-   Collaboration excluded from OSCAL export
-   Documentation updated
-   npm test/lint/build all pass
-   Completion report generated

## Agent Execution Instructions

Implement this milestone exactly as written.

-   Work on a dedicated feature branch.
-   Complete work packages sequentially.
-   Follow Platform Foundation architectural patterns.
-   Use PostgreSQL repositories, Better Auth, RBAC and centralized
    authorization.
-   Keep business logic out of UI components.
-   Run focused tests after each work package.
-   Update documentation continuously.
-   Do not implement Milestone 02B.
-   Do not merge into main.
-   Do not deploy.
-   Finish with the completion report required by AGENTS.md.
