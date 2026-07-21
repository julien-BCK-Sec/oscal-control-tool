# Vision

Build a lightweight, local-first compliance authoring tool.

The application allows users to document security control implementations and export valid OSCAL artifacts.

The first supported baseline is the full pinned NIST SP 800-53 Rev. 5 Moderate baseline, supplied through a `FrameworkProvider` and derived at build time from the pinned OSCAL profile and catalog.

Future work may add FedRAMP-specific policy evaluation (Consolidated Rules) and, if an official FedRAMP OSCAL profile is located and approved, FedRAMP baseline support. The application does not currently implement an official FedRAMP baseline. FedRAMP rules remain a future separate policy layer.

The application is not intended to become a full GRC platform.
