# Configuring Reporters in Creevey

Creevey allows you to define test reporters in the configuration file. The `--reporter` CLI option is deprecated and should not be used. Instead, define reporters directly in your Creevey configuration file.

## Reporter Configuration Examples

### Basic Reporter Configuration

```typescript
// creevey.config.ts
import { CreeveyConfig } from 'creevey';
import { PlaywrightWebdriver } from 'creevey/playwright';

const config: CreeveyConfig = {
  webdriver: PlaywrightWebdriver,
  // Built-in reporter options: 'creevey' (default), 'teamcity', or 'junit'
  reporter: 'junit',
  // Optional reporter configuration
  reporterOptions: {
    outputFile: 'junit-results.xml',
  },
  // ... other configuration options
};

export default config;
```

### Using Mocha-Compatible Reporters

Creevey accepts Mocha-compatible reporters:

```typescript
// creevey.config.ts
import { CreeveyConfig } from 'creevey';
import { PlaywrightWebdriver } from 'creevey/playwright';
import MochaJUnitReporter from 'mocha-junit-reporter';

const config: CreeveyConfig = {
  webdriver: PlaywrightWebdriver,
  // Use a Mocha-compatible reporter
  reporter: MochaJUnitReporter,
  reporterOptions: {
    mochaFile: './test-results.xml',
  },
  // ... other configuration options
};

export default config;
```

## Available Built-in Reporters

1. **creevey** (default): Creevey's default reporter that outputs test results to the console
2. **teamcity**: Produces TeamCity-compatible output (automatically used when running in TeamCity environment)
3. **junit**: Generates JUnit XML reports, useful for CI systems

## Important Notes

1. **Single Reporter**: Creevey currently supports only a single reporter at a time. Multiple reporters cannot be configured simultaneously.

2. **CLI Flag Deprecated**: The `--reporter` command-line flag is deprecated. If used, Creevey will display a warning message:

   ```
   --reporter option has been removed please describe reporter in config file
   ```

3. **Reporter Type**: The reporter configuration expects either a built-in reporter name (string) or a class that implements the Mocha reporter interface.

## Best Practices

- Always define reporters in the configuration file
- For CI environments, use 'junit' reporter or a custom Mocha-compatible reporter
- For local development, the default 'creevey' reporter provides clear console output
- When using TeamCity, Creevey automatically detects the environment and uses the TeamCity reporter

## Example Configuration for CI

```typescript
// creevey.config.ts
import { CreeveyConfig } from 'creevey';
import { PlaywrightWebdriver } from 'creevey/playwright';

const config: CreeveyConfig = {
  webdriver: PlaywrightWebdriver,
  // Use junit reporter in CI environments
  reporter: process.env.CI ? 'junit' : 'creevey',
  reporterOptions: process.env.CI ? { outputFile: 'test-results/junit.xml' } : undefined,
  // ... other configuration options
};

export default config;
```
