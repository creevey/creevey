---
'creevey': patch
---

Deserialize regexp after master-worker communication

## Changes

### Master-Worker Communication Fix

- **`src/server/providers/browser.ts`**: Fixed regular expression deserialization in master-worker communication
  - Moved `deserializeRawStories` call to master process side instead of worker
  - Separated raw stories loading from deserialization to maintain proper data flow
  - Ensures regexp patterns in stories are correctly reconstructed after serialization/deserialization

### Specific Changes

- Master process now receives raw stories and deserializes them locally
- Worker process sends raw stories without deserialization
- Prevents loss of regexp functionality during inter-process communication

This fix ensures that regular expressions within story data are properly handled when communicating between master and worker processes, preventing serialization issues that could cause regexp patterns to lose their functionality.
