<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->


# Project Instructions

## Project Goal

Build a small, local-first web application that allows a user to document
NIST SP 800-53 Rev. 5 Moderate controls and export the information as valid
OSCAL JSON.

The application uses the full pinned NIST SP 800-53 Rev. 5 Moderate baseline
through a `FrameworkProvider`, derived at build time from the pinned OSCAL
profile and catalog. The product remains intentionally narrow: do not expand
it into a general GRC platform. Do not claim FedRAMP baseline support until an
official FedRAMP OSCAL profile is located, approved, and integrated. FedRAMP
rules remain a future separate policy layer.

## Current MVP Scope

The application should:

1. Load the NIST SP 800-53 Rev. 5 Moderate baseline via `FrameworkProvider`
   (derived from the pinned OSCAL profile and catalog).
2. Display the controls in a simple interface.
3. Allow the user to enter implementation information.
4. Persist projects in a local SQLite database via `ProjectRepository`
   (legacy browser localStorage may be imported once; it is not the primary store).
5. Export a valid OSCAL System Security Plan JSON document.
6. Validate the generated OSCAL document.

Do not add features outside the current requested task.

## Development Approach

- Make small, understandable changes.
- Prefer the simplest implementation that meets the requirement.
- Do not introduce abstractions for hypothetical future requirements.
- Preserve a clean separation between:
  - authoritative framework/control data;
  - user-entered implementation data;
  - OSCAL import, export, and validation logic.
- Keep OSCAL transformation code outside React UI components.
- Do not rewrite unrelated code.
- Do not change project architecture without explaining why it is necessary.
- When requirements are unclear, use the narrowest reasonable interpretation.
- Do not silently add features.

## Technology

- Use the existing Next.js App Router project.
- Use TypeScript.
- Use React and Tailwind CSS.
- Use npm and retain `package-lock.json`.
- Do not introduce another package manager.
- Local project persistence uses SQLite + Drizzle behind `ProjectRepository`
  (Milestone 4). Do not add authentication, cloud hosting, PostgreSQL, a
  state-management framework, or a third-party UI library unless specifically
  requested.
- Prefer built-in browser, React, Next.js, TypeScript, and Node.js capabilities
  before adding dependencies.

  ## Session continuity

Before starting substantial work, read:

- `docs/current-state.md`
- `docs/architecture.md`
- `docs/roadmap.md`
- `docs/decisions.md`

After completing a milestone, update `docs/current-state.md` so another session can continue without relying on chat history.


## Architecture Principles

- Keep OSCAL out of the UI.
- The domain model is the source of truth.
- Standards are pinned, never fetched at runtime.
- Frameworks are read-only reference data and are not stored in the database.
- User implementations are stored separately from framework content.
- Exporters adapt the domain model; they do not define it.
- Database access goes through `ProjectRepository` and Server Actions only.
- Local SQLite assumes a durable filesystem and a single Node.js instance;
  it is not safe to expose publicly without authentication.

## Packages and Current Documentation

Before adding or upgrading a dependency:

1. Determine whether the dependency is actually necessary.
2. Check its current stable version and official documentation.
3. Confirm that it is compatible with the existing Node.js, React, Next.js,
   and TypeScript versions.
4. Use the current supported API rather than relying only on model memory.
5. Avoid deprecated, abandoned, prerelease, release-candidate, or beta packages
   unless explicitly requested.
6. Do not downgrade an existing dependency merely because an older API is more
   familiar.
7. Do not upgrade unrelated dependencies as part of a feature change.
8. Update and commit both `package.json` and `package-lock.json` when dependency
   changes are required.

If an error may be caused by a recent library or framework change, consult the
official current documentation and release information before attempting
workarounds.

Do not copy commands or code from untrusted blogs, forums, or generated search
summaries without verifying them against official documentation.

## Standards

Always use the latest stable NIST OSCAL release unless a specific compatibility version is explicitly required.

Pin all external schemas into the repository.

Never depend on floating branches or live internet resources for validation.

## Security Requirements

Treat all user-controlled and imported data as untrusted.

- Never add hard-coded passwords, API keys, access tokens, private keys, or
  credentials.
- Never commit `.env` files or secrets.
- Do not use `eval`, `new Function`, unsafe dynamic execution, or shell command
  construction from user input.
- Do not render user-provided HTML.
- Do not use `dangerouslySetInnerHTML`.
- Validate imported JSON before processing it.
- Validate OSCAL output before presenting it as valid.
- Avoid unnecessary network requests and external services.
- Do not send compliance or system data to third parties.
- Do not disable TLS verification, security checks, lint rules, or TypeScript
  checks to make an error disappear.
- Do not suppress errors without documenting and fixing their cause.
- Do not expose stack traces or sensitive implementation details to users.
- Use secure defaults.
- Minimize dependencies.
- Review new dependencies for maintenance status and known vulnerabilities.
- Run `npm audit` after dependency changes and review the results.
- Do not automatically run `npm audit fix --force`.
- Never perform destructive filesystem or Git operations without explicit
  instruction.

## Data and OSCAL

- Framework control text is authoritative source data and should be read-only.
- User implementation content must be stored separately from framework data.
- Do not invent authoritative FedRAMP, NIST, DISA, or OSCAL content.
- Preserve control identifiers and source/version information.
- Generate stable UUIDs when records are created; do not regenerate them on
  every export.
- OSCAL exports must be deterministic where practical.
- OSCAL exports must be validated against the selected official schema version.
- Keep OSCAL-specific structures inside dedicated adapter/export modules.
- Do not expose the full OSCAL schema directly through the user interface.

## Code Quality

- Use strict TypeScript types.
- Avoid `any`; when unavoidable, explain why.
- Prefer clear names and small functions.
- Avoid duplicated business logic.
- Add comments only when they explain non-obvious decisions.
- Include meaningful error handling.
- Keep accessibility in mind:
  - use semantic HTML;
  - associate labels with form controls;
  - support keyboard navigation;
  - maintain visible focus indicators.
- Do not leave dead code, commented-out implementations, debug statements, or
  placeholder dependencies.

## Testing and Completion

Before declaring a task complete:

1. Review the full diff.
2. Run the relevant tests.
3. Run `npm run lint`.
4. Run `npm run build`.
5. If dependencies changed, run `npm audit`.
6. Confirm that no unrelated files were changed.
7. Briefly report:
   - what changed;
   - which files changed;
   - what commands were run;
   - whether any warnings or unresolved issues remain.

Do not claim that a command succeeded unless it was actually run successfully.

## Git Safety

- Do not commit or push unless explicitly requested.
- Do not rewrite Git history.
- Do not use `git reset --hard`, force push, delete branches, or discard user
  changes.
- Do not modify `.gitignore` to allow secrets or generated build artifacts.
- Keep commits small and focused when commits are requested.