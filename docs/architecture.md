# Architecture

The application separates three concerns:

1. Framework data
   - Read-only
   - FedRAMP, NIST, DISA
   - Control definitions

2. User implementation data
   - Status
   - Narratives
   - Components
   - Evidence references (future)

3. OSCAL
   - Import
   - Export
   - Validation

React components never contain OSCAL serialization logic.