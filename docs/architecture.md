# Architecture

The application separates these concerns:

1. Framework data (application-facing)
   - Read-only MVP control subset
   - Currently derived conceptually from NIST SP 800-53 Rev. 5 Moderate
   - Not a full OSCAL catalog or profile

2. Pinned NIST OSCAL content (vendor)
   - SP 800-53 Rev. 5 catalog
   - SP 800-53 Rev. 5 Moderate profile
   - OSCAL 1.2.2 JSON schemas

3. User implementation data
   - Status
   - Narratives
   - Components
   - Evidence references (future)

4. OSCAL
   - Export (current)
   - Import / schema validation (future)

5. FedRAMP policy evaluation (future, separate)
   - Consolidated Rules — not a catalog/profile substitute

React components never contain OSCAL serialization logic.
