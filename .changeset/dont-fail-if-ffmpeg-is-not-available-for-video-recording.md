---
'creevey': patch
---

Don't fail if ffmpeg is not available for video recording

## Changes

### Enhanced Video Recording Resilience

- **Graceful fallback**: Playwright no longer fails when ffmpeg is not available
- **`tryCreateBrowserContext` function**: New helper that handles video recording failures
  - Attempts to create browser context with video recording enabled
  - If ffmpeg error occurs, warns user and retries without video recording
  - Preserves all other context options when fallback occurs

### Implementation Details

- **Error detection**: Specifically catches ffmpeg-related errors in context creation
- **User feedback**: Logs warning message when video recording is disabled due to missing ffmpeg
- **Graceful degradation**: Test execution continues normally without video recording
- **Error propagation**: Non-ffmpeg errors are still properly thrown

### Benefits

- **Improved reliability**: Tests don't fail due to missing system dependencies
- **Better user experience**: Clear warning message explains why video recording is disabled
- **Maintained functionality**: All other debugging features (traces, screenshots) continue to work
- **No breaking changes**: Existing configurations continue to work as expected

This change ensures Creevey remains functional in environments where ffmpeg is not installed, while still providing video recording capabilities when available.
