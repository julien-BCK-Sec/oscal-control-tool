# Milestone 02C – Amended Implementation Plan

Approved plan for Workflow Automation, incorporating review amendments.
Milestone requirements live in `02C-workflow-automation.md`.

Status: implemented on `feat/workflow-automation-02c`

---

## Architectural principles

- Business services publish Domain Events; they never invoke workflow logic.
- The Workflow Engine subscribes to `DomainEventBus`.
- Triggers, conditions, and actions are pluggable registries (composition over switches).
- Engine uses strongly typed models internally.
- Execution is synchronous; no queues, workers, schedulers, retries, or brokers.
- **No cascade:** workflow actions may publish domain events, but those events do not re-enter the Workflow Engine.

---

## Scope amendments (approved)

### ControlRecord fields

Do **not** add `priority`, `severity`, or `tags` to ControlRecord.

Register related condition/action types as **unavailable** until a future data model exists:

- Conditions: `priority`, `severity` — unavailable
- Actions: `add_tag`, `remove_tag` — unavailable

Available conditions: control status (`implementationStatus`), control category (framework family), framework (`project.frameworkId`), assigned user, assigned role (`owner` | `reviewer`).

Available actions: notify user, notify role, assign user, assign role, set due date (`reviewDueDate` + offset days), change status (`implementationStatus` only).

### Persistence (simplified)

Two tables only:

- `workflow_rules` — rule metadata + validated JSON for conditions and actions
- `workflow_executions` — run history + structured JSON diagnostics detail

No `workflow_conditions`, `workflow_actions`, or `workflow_execution_steps` tables.

### Diagnostics (practical)

Each execution records: triggering event, rule executed, whether conditions matched, actions executed, duration, success/failure, error message. Prefer structured JSON on the execution row over a normalized audit schema.

---

## Locked product decisions

| ID | Decision |
|----|----------|
| D1 | Control Status → `implementationStatus` only |
| D2 | Control Category → `FrameworkControl.family` |
| D3 | Framework → `project.frameworkId` |
| D4 | Assigned User/Role → active assignment; role = `assignmentRole` |
| D5 | Severity/Priority → catalog types registered, **unavailable** (no schema) |
| D6 | Tags → Add/Remove Tag registered, **unavailable** (no schema) |
| D7 | Set Due Date → `reviewDueDate` = occurredAt + offsetDays |
| D8 | Change Status → `implementationStatus` only |
| D9 | Assign Role → assign each org member with given `OrgRole` |
| D10 | Notify → in-app only; new notification event type |
| D11 | No-cascade loop policy |
| D12 | `workflow.manage` + `workflow.read` for `organization_admin` only |
| D13 | Workflow mutations use System actor (`actorId: null`) |
| D14 | Evaluation loads a fresh snapshot; event payloads stay id-focused |

---

## Work packages (approved order)

| WP | Scope |
|----|--------|
| **WP1** | Workflow engine, trigger registry, condition registry, action registry |
| **WP2** | Persistence (`workflow_rules`, `workflow_executions`), repository, validation |
| **WP3** | Authorized CRUD APIs, Server Actions |
| **WP4** | Administration UI |
| **WP5** | Domain Event integration, rule evaluation, action execution |
| **WP6** | Diagnostics, documentation (incl. ADR-023), final verification |

One logical commit per completed work package.

---

## Out of scope

Queues, background workers, schedulers, distributed execution, retries, nested/OR conditions, expression languages, email/webhooks, approval/SLA timers, ControlRecord priority/severity/tags schema.
