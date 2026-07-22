<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version may contain breaking changes to APIs, conventions, and file structure. Before writing Next.js code, read the relevant guide under `node_modules/next/dist/docs/` and heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Control Freak Agent Instructions

## Purpose

These instructions define how autonomous coding agents work in this repository.

They are intentionally milestone-independent. Product scope belongs in `docs/vision.md`, priorities belong in `docs/roadmap.md`, the implemented system belongs in `docs/current-state.md`, and milestone-specific requirements belong in `docs/milestones/`.

## Required reading

Before substantial work, read:

1. `AGENTS.md`
2. `docs/vision.md`
3. `docs/current-state.md`
4. `docs/architecture.md`
5. `docs/decisions.md`
6. `docs/design-system.md` when changing UI
7. `docs/oscal-standards-alignment.md` when changing framework, OSCAL, validation, or export behavior
8. The milestone specification named in the task
9. Any relevant playbook under `docs/playbooks/`

Do not rely on chat history as the source of truth when repository documentation exists.

## Scope control

- Implement only the requested milestone or work package.
- Do not silently add adjacent features.
- Prefer the narrowest implementation that satisfies the acceptance criteria.
- Do not introduce infrastructure, dependencies, abstractions, or architectural patterns for hypothetical future work.
- Do not rewrite unrelated code.
- When requirements conflict, stop and report the conflict rather than choosing silently.

## Architecture rules

- Keep OSCAL serialization, parsing, schema validation, and profile/catalog handling outside React components.
- The application domain model is independent of OSCAL interchange models.
- Framework content is read-only reference data and is never stored as project-owned database content.
- User-authored implementation content remains separate from framework content.
- Operational governance metadata remains separate from OSCAL and project document snapshots.
- Database access goes through application-facing repositories or services and server-side mutation boundaries.
- Authorization must be enforced server-side before data access or mutation.
- UI components must not depend on ORM-specific types.
- Exporters adapt domain data into interchange formats; exporters do not define the domain model.
- Existing ADRs remain authoritative unless the current task explicitly requires a new decision.

## Multi-tenant and authorization rules

When the current milestone introduces organizations, users, memberships, or permissions:

- Every organization-owned record must have an explicit tenant boundary.
- A resource identifier alone is never sufficient authorization.
- Repository and service methods must receive or derive organization context.
- Cross-tenant access must fail closed.
- Authorization checks must occur on the server, even when the UI hides actions.
- Tests must prove tenant isolation and role restrictions.
- Never trust client-provided organization, role, owner, or membership claims without server-side verification.

## Development approach

- Make small, understandable changes.
- Prefer clear names and small functions.
- Avoid duplicated business logic.
- Use strict TypeScript types.
- Avoid `any`; when unavoidable, explain why in code or the completion report.
- Add comments only for non-obvious decisions.
- Include meaningful error handling.
- Do not leave dead code, commented-out implementations, debug statements, or temporary dependencies.
- Preserve accessibility: semantic HTML, associated labels, keyboard support, visible focus indicators, and text labels in addition to color.

## Dependencies and documentation

Before adding or upgrading a dependency:

1. Confirm it is required by the approved milestone.
2. Check the current official documentation and stable version.
3. Confirm compatibility with the repository's Node.js, React, Next.js, and TypeScript versions.
4. Prefer supported APIs over remembered or deprecated APIs.
5. Do not upgrade unrelated dependencies.
6. Update both `package.json` and `package-lock.json`.
7. Run `npm audit` and review the result.
8. Never run `npm audit fix --force` automatically.

Do not copy implementation guidance from untrusted sources without checking official documentation.

## Security requirements

Treat all user-controlled, imported, and uploaded data as untrusted.

- Never add or commit passwords, API keys, access tokens, private keys, credentials, or `.env` files.
- Never use `NEXT_PUBLIC_` for secrets or server-only configuration.
- Do not use `eval`, `new Function`, unsafe dynamic execution, or shell commands assembled from user input.
- Do not render user-provided HTML.
- Do not use `dangerouslySetInnerHTML` for user content.
- Validate imported data before processing it.
- Validate generated OSCAL before presenting it as valid.
- Do not send compliance or system data to third parties unless the milestone explicitly approves the integration.
- Do not disable TLS verification, security checks, lint rules, TypeScript checks, or tests to make failures disappear.
- Do not suppress errors without addressing and documenting the cause.
- Do not expose stack traces, secrets, database connection details, or internal paths to users.
- Use secure defaults and minimize dependencies.

## Database and migration safety

- Never edit an already-applied production migration.
- Never delete or reorder committed migrations to make a new schema work.
- Add a new forward migration for every schema change.
- Prefer additive migrations before destructive migrations.
- Destructive or irreversible migrations require explicit approval and a documented rollback or recovery plan.
- Migration tests must cover a clean database and representative existing data when data migration is involved.
- Do not assume production is empty.
- Never run destructive seed, reset, truncate, or drop operations against production data.
- Keep migration execution and application startup behavior documented.

## OSCAL and standards safety

- Use pinned standards artifacts. Do not fetch moving standards files at runtime.
- Do not invent authoritative NIST, FedRAMP, DISA, or OSCAL content.
- Preserve control identifiers, provenance, and source versions.
- Keep OSCAL-specific structures inside dedicated adapter, validation, import, or export modules.
- Do not claim support for a standard, framework, baseline, or policy layer that is not actually implemented and verified.
- OSCAL schema validation proves structure only; do not present it as semantic or policy compliance.

## Design system rules

When changing UI:

- Reuse components and tokens from `src/components/design-system` and `src/app/globals.css`.
- Do not add a third-party UI kit unless explicitly approved.
- Do not recreate brand assets or duplicate badge, button, card, form, or layout styling.
- Keep workflow, persistence, authorization, and OSCAL logic out of design-system components.
- Preserve sentence case and established status terminology.
- Never communicate status by color alone.

## Tests

- Every bug fix requires a regression test when reasonably possible.
- Every new business rule requires focused tests.
- Every authorization rule requires positive and negative tests.
- Every tenant boundary requires cross-tenant denial tests.
- Do not delete, skip, weaken, or rewrite valid tests merely to make the suite pass.
- Do not claim a command passed unless it was actually run successfully.

## Autonomous workflow

### Before coding

1. Confirm the working tree is understood and do not overwrite user changes.
2. Read the required repository documentation.
3. Read the milestone specification and identify its ordered work packages.
4. Identify existing ADRs that constrain the implementation.
5. Confirm the current branch and task scope.
6. Record any ambiguity, security concern, or architectural conflict before coding.

### During work

- Complete work packages in the documented order unless the specification permits otherwise.
- Keep changes within the current work package.
- Run focused tests as each package is completed.
- Review the diff before committing.
- Commit only when the task explicitly authorizes commits.
- Use small, logical commits with descriptive messages.
- Continue to the next package only when the current package is coherent and tests pass, unless the completion report clearly documents a blocker.

### After implementation

1. Review the full diff.
2. Run relevant focused tests.
3. Run `npm test`.
4. Run `npm run lint`.
5. Run `npm run build`.
6. Run migration verification required by the milestone.
7. Run `npm audit` when dependencies changed.
8. Confirm no unrelated files changed.
9. Update documentation required by the milestone.
10. Produce a completion report containing:
   - work packages completed;
   - files changed;
   - migrations created;
   - tests added or changed;
   - commands run and their results;
   - commits created;
   - manual verification still required;
   - warnings, risks, assumptions, or unresolved issues.

## Escalation and stop conditions

Stop and ask for direction before proceeding when:

- the milestone conflicts with an existing ADR;
- an architectural decision must be reversed or materially changed;
- requirements permit multiple materially different product behaviors and the milestone does not choose one;
- authentication or authorization behavior is ambiguous;
- a migration would destroy, rewrite, or risk existing data;
- production secrets, external accounts, or vendor selection are required but not approved;
- a task requires merging, deploying, modifying production data, or changing production infrastructure without explicit authorization;
- tests reveal a pre-existing failure that prevents trustworthy completion;
- user changes would need to be discarded or overwritten;
- the requested work cannot be completed without expanding scope.

When stopping, preserve the working tree and provide a concise blocker report with options.

## Git safety

- Never push directly to `main`.
- Never merge into `main` unless explicitly requested.
- Never deploy unless explicitly requested.
- Do not commit or push unless the task explicitly authorizes it.
- Do not rewrite Git history.
- Do not force push.
- Do not use `git reset --hard`.
- Do not delete branches or discard user changes.
- Do not modify `.gitignore` to allow secrets or generated build artifacts.
- When commits are authorized, keep them small, focused, and aligned to work packages.
- Do not include unrelated formatting or cleanup in feature commits.

## Documentation updates

Update documentation when implementation changes its subject:

- `docs/current-state.md`: what is implemented now, known gaps, deployment assumptions, next approved milestone.
- `docs/architecture.md`: responsibilities, boundaries, runtime flow, and structural changes.
- `docs/decisions.md`: new or changed architectural decisions.
- `docs/roadmap.md`: milestone status or ordering changes.
- `docs/design-system.md`: new reusable UI primitives or changed design rules.
- `docs/oscal-standards-alignment.md`: standards source, version, derivation, validation, or support changes.
- relevant playbooks: repeatable operational or engineering procedures.

Do not duplicate large sections across documents. Link to the authoritative document instead.

## Definition of done

A task is complete only when:

- acceptance criteria are satisfied;
- required tests exist and pass;
- `npm test`, `npm run lint`, and `npm run build` pass;
- migrations are verified as required;
- no unrelated changes are included;
- documentation is current;
- security and authorization requirements are tested;
- the completion report is accurate;
- no unresolved blocker is hidden.

Operate autonomously inside the repository sandbox.

You may read and edit repository files, create the feature branch, make local
commits, and run ordinary local development commands without asking for each
one.

You may automatically run:

- git status, diff, log, and branch commands;
- repository searches and file inspection;
- npm test, npm run lint, npm run build, and focused test commands;
- local database setup and migrations against disposable development or test
  databases;
- approved code-generation commands.

Ask before:

- enabling live network access;
- installing or upgrading dependencies not already approved;
- accessing files outside the repository;
- reading credentials or environment secrets;
- pushing, opening a pull request, merging, or deploying;
- connecting to any remote or production database;
- destructive Git or filesystem commands;
- destructive database operations;
- running unsandboxed commands.

Never access production credentials or production data.
Use official documentation only when online research is required.