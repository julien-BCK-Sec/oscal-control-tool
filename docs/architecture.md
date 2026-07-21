# Architecture

The application separates these concerns:

1. Framework data (application-facing)
   - Read-only `Framework` / `FrameworkControl` types
   - Supplied by a `FrameworkProvider` (currently NIST Moderate)
   - Not raw OSCAL catalog or profile objects

2. Framework derivation (build-time)
   - Reads pinned NIST Moderate profile + SP 800-53 Rev. 5 catalog
   - Emits generated JSON under `src/data/framework/generated/`
   - Logic lives in `src/framework/nist-moderate/` (outside React)

3. Pinned NIST OSCAL content (vendor)
   - SP 800-53 Rev. 5 catalog
   - SP 800-53 Rev. 5 Moderate profile
   - OSCAL 1.2.2 JSON schemas

4. User implementation data
   - Status
   - Narratives
   - Components
   - Evidence references (future)

5. OSCAL
   - Export (current)
   - Import / schema validation (partial — SSP schema validation current)

6. FedRAMP policy evaluation (future, separate)
   - Consolidated Rules — not a catalog/profile substitute

React components never contain OSCAL serialization or profile/catalog parsing logic.
