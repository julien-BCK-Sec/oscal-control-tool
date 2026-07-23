# Milestone 02B: Domain Event Infrastructure

> This milestone builds directly upon Collaboration (Milestone 02A) and
> establishes a first-class domain event infrastructure within Control
> Freak. It intentionally excludes workflow automation, external
> integrations, and AI-assisted automation.

## Status

Implemented on `feat/domain-events-02b`

## Objective

Introduce a reusable, event-driven architecture that enables Control
Freak to publish, transport, and consume domain events while preserving
tenant isolation, auditability, transaction integrity, and centralized
authorization.

The domain event infrastructure shall become the foundation for future
workflow automation, evidence management, AI agents, integrations,
reporting, notifications, and audit capabilities.

Platform Foundation and Collaboration are assumed complete.

## Outcomes

At completion:

- Business services publish domain events.
- Events remain immutable once published.
- Events are organization scoped.
- Consumers subscribe to domain events without coupling to business
  services.
- Existing collaboration functionality continues without regression.
- Workflow Automation can be implemented without modifying existing
  services.

## In Scope

- Domain event interfaces
- Event publishing
- Event dispatching
- Event subscriptions
- Event handlers
- Event metadata
- Event persistence (if required)
- Tenant-aware event routing
- Documentation
- Automated testing

## Explicitly Out of Scope

- Workflow automation
- Scheduled execution
- Email notifications
- Slack / Teams integration
- AI-assisted automation
- Public event APIs
- Webhooks
- External message brokers
- Distributed event processing

## Accepted Architectural Decisions

The following decisions are approved for this milestone.

1. Every business event shall be represented by a strongly typed domain event.
2. Domain events shall be immutable after publication.
3. Domain events shall be organization scoped.
4. Business services shall publish events but shall never directly invoke subscribers.
5. Event publication shall occur only after successful business operations.
6. Event consumers shall execute independently of publishers.
7. The infrastructure shall remain implementation agnostic and support future message brokers.

## Non-Functional Requirements

The event infrastructure shall:

- Preserve tenant isolation.
- Avoid duplicate publication.
- Support asynchronous processing.
- Support retryable consumers.
- Support horizontal scalability.
- Never block originating business operations.
- Remain fully auditable.

## Domain Model

### Domain Event

- Stable identifier
- Event type
- Organization identifier
- Aggregate identifier
- Aggregate type
- Actor identifier
- Correlation identifier
- Timestamp
- Payload

### Event Subscription

- Stable identifier
- Subscriber
- Event type
- Enabled status

### Event Handler

- Handler identifier
- Supported event types
- Execution status
- Error information

## Permission Expectations

### Organization Admin

- View event diagnostics
- View event history

### Project Manager

- No direct event management

### Author

- No direct event management

### Reviewer

- No direct event management

### Viewer

- No direct event management

Permissions remain centralized and enforced server-side.

# Work Packages

## WP1 -- Domain Event Foundation

Implement:

- Event interfaces
- Event base classes
- Event contracts
- Event metadata
- Repository tests

Suggested commit:

`feat: add domain event foundation`

------------------------------------------------------------------------

## WP2 -- Event Publishing Infrastructure

Implement:

- Event publisher
- Event dispatcher
- Event registration
- Event lifecycle

Suggested commit:

`feat: implement event publishing infrastructure`

------------------------------------------------------------------------

## WP3 -- Event Subscription Infrastructure

Implement:

- Subscriber registration
- Event routing
- Handler execution
- Subscription tests

Suggested commit:

`feat: implement event subscriptions`

------------------------------------------------------------------------

## WP4 -- Initial Domain Events

Publish events for:

- Project Created
- Project Updated
- Control Created
- Control Updated
- Control Assigned
- Discussion Created
- Discussion Updated
- Discussion Resolved
- Assignment Created
- Assignment Completed
- Notification Created

Suggested commit:

`feat: publish initial domain events`

------------------------------------------------------------------------

## WP5 -- Event Handler Framework

Implement:

- Generic handlers
- Error handling
- Retry support
- Logging

Suggested commit:

`feat: implement event handler framework`

------------------------------------------------------------------------

## WP6 -- Event Diagnostics

Provide:

- Event inspection
- Event history
- Failed event diagnostics
- Execution timestamps

Suggested commit:

`feat: add event diagnostics`

------------------------------------------------------------------------

## WP7 -- Event Integration

Update existing services to publish domain events rather than invoking
future automation directly.

No existing business behaviour shall change.

Suggested commit:

`refactor: integrate domain events`

------------------------------------------------------------------------

## WP8 -- Security & Authorization

Implement:

- Tenant-aware routing
- Authorization validation
- Event ownership
- Audit events

Suggested commit:

`feat: secure domain event infrastructure`

------------------------------------------------------------------------

## WP9 -- Documentation & Production Readiness

Update:

- docs/current-state.md
- docs/architecture.md
- docs/roadmap.md
- docs/decisions.md

Suggested commit:

`docs: document domain event architecture`

## Automated Verification

Run:

```bash
npm test
npm run lint
npm run build
```

Include:

- publisher tests
- subscriber tests
- routing tests
- authorization tests
- tenant isolation tests
- integration tests

## Manual Verification

- Publish events
- Receive events
- Verify subscriber execution
- Verify event ordering
- Verify event metadata
- Verify tenant isolation
- Confirm existing collaboration functionality continues without regression

## Definition of Done

- All work packages complete
- Domain events operational
- Publishers operational
- Subscribers operational
- Event routing operational
- Tenant isolation tests passing
- Documentation updated
- npm test/lint/build all pass
- Completion report generated

## Agent Execution Instructions

Implement this milestone exactly as written.

- Work on a dedicated feature branch.
- Complete work packages sequentially.
- Follow Platform Foundation and Collaboration architectural patterns.
- Keep publishers independent of subscribers.
- Publish events only after successful business operations.
- Reuse centralized authorization.
- Keep business logic out of UI components.
- Run focused tests after each work package.
- Update documentation continuously.
- Do not implement Workflow Automation (Milestone 02C).
- Do not merge into main.
- Do not deploy.
- Finish with the completion report required by AGENTS.md.