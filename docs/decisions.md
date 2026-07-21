# Architectural Decisions

## ADR-001

Decision:
Use an internal domain model instead of exposing OSCAL directly to the UI.

Reason:
OSCAL is an interchange format, not an application data model.

Date:
2026-07-21

## ADR-002

Decision:
Introduce a small `FrameworkProvider` interface and derive the NIST Moderate
framework at build time from the pinned profile and catalog into generated
application JSON.

Reason:
- Keeps the UI on application types (`Framework`, `FrameworkControl`).
- Avoids shipping the full OSCAL catalog/profile to the browser.
- Uses only local pinned artifacts (no runtime network fetch).
- Limits profile support to features actually used by the Moderate baseline.

Date:
2026-07-21
