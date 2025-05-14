---
'creevey': patch
---

Disable full page screenshot

## Changes

### Screenshot Behavior Update

- **Removed full page screenshots**: Changed from `fullPage: true` to viewport-only screenshots
- **Consistent viewport capturing**: All screenshots now capture only the visible viewport area
- **Added debug logging**: Screenshots now log whether capturing element or viewport

### Technical Details

- **Element screenshots**: Continue to work as before with element selector
- **Page screenshots**: Now capture only the viewport instead of the entire page
- **Debug output**: Added logging to distinguish between element and viewport captures

### Benefits

- **More predictable screenshots**: Viewport-only captures are more consistent across different page heights
- **Better performance**: Smaller screenshots with faster capture times
- **Improved debugging**: Clear logging indicates screenshot capture mode

This change ensures more consistent screenshot behavior by focusing on the visible viewport rather than the entire page content.
