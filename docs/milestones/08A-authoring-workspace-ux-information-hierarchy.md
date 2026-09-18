Milestone 08A — Authoring Workspace UX & Information Hierarchy

Status: Implemented on `feat/08A-authoring-workspace-ux` (not merged, not released, not accepted)

Manual acceptance (2026-09-18) identified remaining ODP visual complexity after the first implementation. A correction pass is on this branch: unresolved ODPs no longer force the section open; shared overlay conditions appear once at section scope; author-facing status is Resolved/Unresolved; catalog/resolution diagnostics default collapsed behind Details; parameter rows are a single dense surface rather than a card per ODP.

Author-facing surfaces prioritize what the author needs to understand or do; catalog/resolution diagnostics remain available through progressive disclosure.
Depends on: Milestone 07C accepted on main
Production baseline at planning time: v0.7.0
Primary goal: Reduce cognitive load and vertical sprawl in the authoring experience without removing information, weakening framework semantics, or turning Control Freak into a low-density generic SaaS UI.

1. Problem statement

Control Freak now has enough authoring capability that the UI is exposing the full complexity of the underlying model at once.

The overall visual language is working well: dark theme, restrained accent color, dense professional presentation, persistent project/framework context, control-family browser, and evidence workspace should remain recognizable.

The main usability problem is information hierarchy, especially in the Controls workspace after Milestone 07C.

A control can currently present, in one continuous surface:

requirement text;

canonical/source statement;

multiple organization-defined parameter editors;

nested catalog selections and nested parameter editors;

implementation status and narrative;

evidence;

ownership;

review state;

assignments;

discussions;

history.

Each item is legitimate, but too much of it is presented simultaneously and at similar visual priority. ODP-heavy controls such as AC-1 and AC-7 can become very long and visually repetitive.

Project Details has the inverse problem: its content is naturally sectional, but is presented as one long undifferentiated form.

This milestone introduces progressive disclosure, compact state summaries, and clearer authoring hierarchy while preserving the existing domain model and semantics.

2. Design principles

2.1 Preserve density

Control Freak is a professional authoring and review tool. Dense information presentation is useful when working through hundreds of controls.

Do not redesign it into a large-card, excessive-whitespace dashboard.

2.2 Progressive disclosure, not information removal

Important state should be immediately visible. Detailed editing surfaces should be available when needed.

The target interaction principle is:

Show the important state immediately. Let the author expand the complexity when working on it.

2.3 Preserve the current visual identity

Retain the existing:

dark theme;

restrained blue accent;

typography direction;

compact professional aesthetic;

project/framework context header;

control family/browser model;

evidence list/detail model unless usability testing identifies a concrete problem.

2.4 No semantic redesign

08A is a UX/information-hierarchy milestone.

It must not redefine:

framework membership;

parameter resolution or precedence;

SSP synthesis;

implementation status semantics;

evidence semantics;

review semantics;

authorization/compliance meaning.

2.5 Summaries must be derived

Compact UI summaries must be derived from canonical project/framework state. Do not create duplicate persisted summary state merely to support the UI.

3. Scope

08A focuses on four surfaces:

Controls authoring workspace

ODP authoring presentation

Control workflow/metadata inspector

Project Details / SSP system-characteristics authoring

The Overview and Evidence screens may receive small consistency/polish changes, but broad redesign of those surfaces is not a goal of this milestone.

4. Controls workspace hierarchy

Refactor the main control authoring column into clear authoring sections.

At minimum, evaluate and implement sections for:

Requirement

Organization-defined parameters

Implementation

Evidence

Sections should support progressive disclosure where appropriate.

4.1 Requirement

The human-readable requirement remains the primary requirement presentation.

Canonical/source material remains available but visually secondary. Do not remove source fidelity or make the human-readable rendering authoritative.

The source statement may remain collapsed by default where that is consistent with current behavior.

4.2 Organization-defined parameters

The ODP section must expose a compact state summary before requiring the author to inspect every editor.

Example presentation:

Organization-defined parameters · 0 of 8 resolved · 8 need attention

Unresolved parameters must not force the section open. A control with many unresolved ODPs is precisely where automatic expansion creates the most visual complexity.

The collapsed state must make outstanding count and any shared overlay condition obvious. The author opens the section to work.

The count must use the existing 07C resolution model and must not create a second interpretation of resolution state.

4.3 Implementation

Implementation status and narrative should read as a coherent authoring section rather than appearing as the continuation of a long parameter form.

Existing implementation semantics remain unchanged.

4.4 Evidence

The control should expose evidence state compactly, for example linked-record count and relevant missing-state indication, with details/actions available on expansion.

Do not imply evidence sufficiency, control effectiveness, assessment, or compliance merely from linked evidence counts.

5. ODP editor compaction

07C parameter authoring is semantically correct but visually repetitive for controls with many parameters.

Reduce repeated chrome while retaining access to advanced/catalog information.

5.1 Primary parameter presentation

The primary visible information should be:

human-readable parameter label;

resolution/status state;

concise guidance when useful;

editable value or catalog selection.

Technical parameter IDs should remain accessible but visually secondary.

5.2 Secondary details

Evaluate a compact Details affordance for information such as:

OSCAL/catalog parameter ID;

guidelines;

surrounding catalog insert context;

provenance/resolution metadata where applicable;

other advanced/debugging-oriented information already exposed by the UI.

Do not hide information required to understand an authoritative-value-required, source-conflict, deviation, or other fail-closed state.

5.3 Nested choices

Preserve the 07C nested-choice UX:

nested editors appear beneath the selected parent choice;

nested project records survive parent deselection;

deselected nested records remain hidden rather than deleted;

internal [nested parameter] placeholders are not presented as author-facing UX.

Any compaction must preserve this behavior.

5.4 Resolved parameters

Fully resolved parameters should not consume the same amount of space as unresolved parameters unless the author chooses to edit them.

Explore a compact resolved presentation with an Edit/Expand affordance.

Do not make resolution state difficult to inspect or modify.

6. Control workflow / metadata inspector

The current right column contains useful workflow information but permanently consumes substantial authoring width.

Evaluate converting it into a collapsible contextual inspector or a compact-summary-plus-inspector pattern.

The compact state should make key workflow information visible, such as:

owner;

implementation status;

review state;

assignment state;

discussion/activity indicator where useful.

The expanded inspector must preserve the existing ability to work with:

ownership;

implementation metadata currently located there;

review workflow;

assignments;

discussions;

history.

Do not remove functionality merely to create more whitespace.

The author should be able to reclaim horizontal space when concentrating on requirement, ODP, narrative, or evidence authoring.

7. Project Details hierarchy

Rename/relabeling of the top-level tab may be considered if evidence from the existing content supports it. In particular, evaluate whether System better describes this surface than Project details.

Do not rename it merely for novelty; the decision should reflect the actual SSP system-characteristics content.

Refactor the long form into natural sections, such as:

System identity

SSP organization

Boundary and environment

System roles

Information types and security categorization

Interconnections

Operational status

Each section should expose a compact completeness/state summary and expand for editing.

Examples:

System identity · Complete

Boundary & environment · 2 fields missing

Security categorization · Not documented

System roles · None documented

These are documentation completeness states, not compliance or authorization scores.

Empty lists must retain the existing semantics: not documented does not mean none exist.

8. Export placement

The current Project Details surface also contains document/export actions.

Evaluate moving export actions out of the system-characteristics editing form into a more appropriate project-level location or action surface.

Current exports include at least:

human-readable SSP Word export;

OSCAL SSP JSON where supported.

Do not change export capability or framework availability rules in 08A.

If export relocation would materially expand scope, document the recommendation and defer implementation rather than forcing it into this milestone.

9. Overview

The current Overview is generally successful and should not be broadly redesigned.

Permitted improvements are limited to changes that improve consistency with the new authoring hierarchy, such as:

linking completeness/readiness summaries directly to the corresponding authoring section;

clearer calls to continue incomplete work;

minor visual consistency changes.

Do not introduce a new compliance score.

A broader SSP readiness/work-queue feature remains a separate possible milestone.

10. Evidence workspace

The current evidence list/detail workspace is generally understandable and should not be broadly redesigned in 08A.

Small improvements may be made when they directly support consistency or remove demonstrated friction.

Do not expand 08A into a new evidence lifecycle or assessment model.

11. Accessibility and interaction requirements

Progressive disclosure must remain keyboard accessible.

Interactive controls must:

use appropriate native semantics where possible;

expose expanded/collapsed state accessibly;

preserve normal keyboard behavior in text fields and controls;

not reintroduce the 07C Space-key/keyboard propagation defect;

maintain visible focus treatment.

Collapsed sections must not cause authored values to be deleted or silently reset.

12. State and persistence

Prefer UI-only disclosure state unless there is a compelling reason to persist a preference.

Do not add database/project-schema fields merely to remember open/closed sections without an approved design decision.

If remembering disclosure state across navigation materially improves usability, first evaluate browser/session-local state or existing UI-state patterns.

Canonical authored project data must remain independent of whether a section is expanded.

13. Representative acceptance controls

Design and manual acceptance must include controls with different complexity profiles.

At minimum:

Simple control

A control with no ODPs or minimal authoring complexity.

Goal: ensure progressive disclosure does not add unnecessary interaction to simple controls.

AC-1 — Policy and Procedures

ODP-heavy control with repeated parameter editors and catalog selection.

Goal: demonstrate a substantial reduction in vertical/repetitive UI while preserving all authoring capability.

AC-7 — Unsuccessful Logon Attempts

Includes free-text values, multi-select catalog choices, and nested parameters.

Goal: ensure the compact UI preserves the full 07C nested/resolution workflow.

DoD IL4 representative control

Use an IL4 control that demonstrates fail-closed parameter semantics, such as AC-7 and/or a DSPAV/source-conflict example.

Goal: ensure UX simplification does not obscure authority/provenance warnings or imply resolution where none exists.

14. Manual acceptance scenarios

Manual browser acceptance should verify at least:

A simple control remains fast to understand and edit.

AC-1 no longer presents every parameter editor at full visual weight on initial load.

The ODP summary accurately reports resolved/unresolved state.

Expanding ODPs exposes all existing authoring functionality.

Technical IDs and catalog context remain available without dominating the primary UI.

AC-7 multi-select and nested editors behave exactly as in accepted 07C.

Typed spaces and ordinary keyboard interaction continue to work in all authoring controls.

Collapsing/expanding sections does not lose unsaved/live draft or persisted project values.

Narrative authoring is easier to focus on without unrelated metadata consuming unnecessary space.

Workflow metadata remains discoverable and editable if the right inspector is collapsed.

Project Details/System sections clearly communicate missing documentation without implying absence or noncompliance.

IL4 authoritative-value-required, DSPAV, and source-conflict states remain explicit and fail closed.

SSP Word output is semantically unchanged by UI disclosure state.

OSCAL export behavior and availability are unchanged.

15. Non-goals

08A does not include:

a new compliance/readiness score;

assessment conclusions;

new framework support;

IL4 per-ODP mapping research;

OSCAL set-parameters;

responsibility/origination modeling;

SSP DOCX template redesign;

grammar rewriting;

new evidence sufficiency semantics;

a major visual-brand redesign;

replacement of the control family/browser navigation model;

database migrations unless a consequential requirement is discovered and separately approved.

16. Architecture guardrails

The following accepted architecture remains authoritative:

src/domain/parameter-resolution.ts remains the sole parameter precedence/resolution path.

UI summaries consume existing resolution results; they do not independently determine winners.

Framework-authoritative values remain authoritative under the 07C rules.

may-use-baseline still requires explicit acceptance.

deviations, DSPAV assertions, and conflict proceedings do not become resolution winners.

IL4 unmapped ODPs remain fail closed.

authoritative source statements remain distinct from resolved/project-authored statements.

UI compaction must not infer authored values from implementation narratives.

CMMC/GRR controls must not gain artificial ODP semantics.

17. Implementation approach

Before broad component refactoring, create a small UX spike/prototype using the existing application components and data.

Recommended order:

Inspect current Controls, Project Details, Overview, and Evidence component boundaries.

Identify reusable disclosure/section-summary patterns.

Prototype the Controls workspace using AC-1 and AC-7.

STOP for visual/manual review before propagating the pattern broadly if the prototype materially changes interaction behavior.

Apply the accepted pattern across controls.

Refactor Project Details using the same hierarchy principles.

Apply only small, justified Overview/Evidence consistency changes.

Run automated validation.

Perform manual browser acceptance using the representative controls above.

This milestone should avoid a large speculative design-system rewrite.

18. Testing expectations

Add focused tests for new behavior where practical, including:

accurate ODP resolved/unresolved summary counts;

disclosure does not alter canonical authored state;

nested records remain preserved through parent choice/disclosure changes;

workflow inspector collapse does not alter workflow state;

Project Details completeness summaries distinguish missing documentation from empty/false assertions;

keyboard target behavior remains protected;

framework authority/fail-closed states render in the compact presentation.

Existing 07C parameter-resolution and SSP tests remain regression requirements.

Final validation must include:

npm test
npm run lint
npm run build
npm run derive:framework
git diff --check

Framework derivation must remain consistent with the accepted baseline unless an independently approved framework-data change occurs:

NIST Low: 149

NIST Moderate: 287

NIST High: 370

CMMC L2: 110

DoD IL4: 345, including 10 GRRs

IL4 parameter mapping count remains 0 unless a separate authoritative mapping decision is approved.

19. Definition of done

08A is complete when:

the Controls workspace has a clearer hierarchy using progressive disclosure;

ODP-heavy controls are materially less visually repetitive on initial load;

unresolved/resolved ODP state is immediately understandable;

all 07C ODP authoring capabilities remain available;

nested parameter behavior remains intact;

control workflow metadata can be accessed without permanently dominating authoring width;

Project Details/System characteristics are organized into understandable sections with documentation-completeness summaries;

no UI summary introduces a second semantic/resolution path;

no compliance or authorization claims are introduced;

SSP and OSCAL outputs remain semantically unchanged;

automated tests, lint, build, framework derivation, and diff-check pass;

representative simple, AC-1, AC-7, and IL4 browser acceptance passes;

durable docs and Help are updated for material interaction changes;

final implementation is manually reviewed before release.

20. Release boundary

08A should be releasable independently as a usability milestone.

Do not combine unrelated feature work into the milestone merely because UI components are being touched.

Tagging and production deployment are separate release decisions after implementation and manual acceptance.