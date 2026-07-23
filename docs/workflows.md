# Workflow Automation

Milestone 02C introduces a lightweight workflow engine that reacts to Domain
Events. See ADR-023 and `docs/milestones/02C-workflow-automation.md`.

## How it works

```text
Business Service / authorized wrapper
        │
        ▼
 Publish Domain Event (ADR-021)
        │
        ▼
   Domain Event Bus
        │
        ▼
   Workflow Engine (subscriber)
        │
        ├─ load enabled rules for org + trigger
        ├─ evaluate conditions (AND)
        ├─ execute actions (System actor)
        └─ record workflow_executions
```

Business services never import or call workflow code.

## Administration

Organization admins manage rules at:

`/organizations/{orgId}/workflows`

Permissions: `workflow.read`, `workflow.manage` (organization admin only).

## Trigger catalog

| Trigger | Domain event |
|---------|----------------|
| Control created | `ControlCreated` |
| Control updated | `ControlUpdated` |
| Control assigned | `ControlAssigned` |
| Assignment completed | `AssignmentCompleted` |
| Discussion created | `DiscussionCreated` |
| Discussion resolved | `DiscussionResolved` |

## Available conditions (AND only)

- Control status → `implementationStatus`
- Control category → framework control `family`
- Framework → `project.frameworkId`
- Assigned user → active assignment assignee
- Assigned role → active assignment role (`owner` | `reviewer`)

## Available actions

- Notify user / notify role (in-app `workflow_triggered`)
- Assign user / assign role (assignment role `owner` | `reviewer`)
- Set due date → `reviewDueDate` = event time + offset days
- Change status → `implementationStatus` only

## Unavailable extension points (registered, not writable)

- Conditions: `priority`, `severity`
- Actions: `add_tag`, `remove_tag`

These await ControlRecord model support in a future milestone.

## Diagnostics

Each `workflow_executions` row stores:

- triggering event id/type and correlation id
- rule id
- whether conditions matched
- action results
- duration
- status (`succeeded` | `failed` | `skipped` | `duplicate`)
- error message when applicable
- structured detail JSON

UI: `/organizations/{orgId}/workflows/{ruleId}/runs`

## Current limitations

- Synchronous, in-process execution only (same process as the publisher).
- **No cascade:** workflow-published domain events do not trigger further
  workflows.
- No queues, retries, schedulers, email, webhooks, OR/nested conditions, or
  scripting.
- Review-status transitions are not workflow-driven in this milestone.
- Multi-instance deployments: each process has its own bus; rules/executions
  are durable in PostgreSQL, but in-process event diagnostics remain
  process-local (ADR-021).

## Extension points

- Register additional triggers, conditions, and actions without changing the
  engine core (`src/workflow/registries`).
- Replace in-process bus transport later (outbox/broker) without changing
  publisher call sites (ADR-021).
- Future milestones may add cascade policies, async workers, approvals, and
  SLA timers on top of the same rule/execution model.
