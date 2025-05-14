---
'creevey': minor
---

Add Creevey Playwright reporter

## Changes

### New Playwright Reporter

- **Native Playwright integration**: Added `CreeveyPlaywrightReporter` for seamless integration with Playwright test suites
- **Automatic screenshot collection**: Captures screenshots from Playwright tests for visual comparison
- **UI integration**: Provides Creevey's visual diff UI for Playwright test results

### Documentation and Examples

- **`docs/playwright-reporter.md`**: Comprehensive documentation covering:
  - Installation and configuration steps
  - Usage patterns with `page.screenshot()` and `toHaveScreenshot()`
  - Advanced features like custom test names and metadata
  - Test steps integration and performance optimization
  - API reference and troubleshooting guide
- **`docs/examples/playwright-reporter-example.ts`**: Complete example file demonstrating:
  - Basic configuration in `playwright.config.ts`
  - Screenshot capture and comparison techniques
  - Custom test naming and organization
  - Multi-step tests with proper structure
  - Error handling and performance optimizations

### Key Features

- **Multiple screenshot capture**: Support for multiple screenshots within a single test
- **Custom metadata**: Add Creevey-specific metadata via test annotations
- **Test steps support**: Integration with Playwright's test step functionality
- **Performance optimizations**: Batch processing and lazy initialization options
- **Flexible configuration**: Customizable report directories, ports, and comparison options
- **Error resilience**: Graceful error handling that doesn't break test execution

### Configuration Options

- `reportDir`: Directory for report output
- `screenDir`: Directory for reference images
- `port`: UI server port
- `debug`: Enable detailed logging
- `batchProcessing`: Performance optimization for large test suites
- `maxConcurrency`: Control parallel screenshot processing
- `customComparisonOptions`: Fine-tune image comparison behavior

### Integration Benefits

- **Unified workflow**: Use Creevey's visual testing within existing Playwright test suites
- **Familiar API**: Leverages standard Playwright screenshot methods
- **Enhanced reporting**: Access to Creevey's advanced visual diff UI and approval workflow
- **Flexible deployment**: Works with existing Creevey configurations and servers

This addition significantly expands Creevey's ecosystem by providing first-class Playwright integration, enabling teams already using Playwright to easily adopt advanced visual testing capabilities.
