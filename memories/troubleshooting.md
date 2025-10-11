# Creevey Troubleshooting Guide

## Common Issues and Solutions

### Installation and Setup Issues

#### Issue: "Cannot find module 'creevey'"

**Symptoms**: Import errors when trying to use Creevey
**Causes**:

- Incomplete installation
- Incorrect import paths
- Node.js version incompatibility

**Solutions**:

```bash
# Reinstall dependencies
yarn install --force

# Check Node.js version
node --version  # Should be >=18

# Verify installation
yarn creevey --version
```

#### Issue: Docker-related errors during installation

**Symptoms**: Docker daemon errors, permission denied
**Causes**: Docker not running, permission issues

**Solutions**:

```bash
# Start Docker daemon
docker start

# Check Docker permissions
docker run hello-world

# Use without Docker if not needed
yarn creevey test --no-docker
```

### Configuration Issues

#### Issue: "Config file not found"

**Symptoms**: Creevey cannot find configuration file
**Causes**: Incorrect config file location or naming

**Solutions**:

```typescript
// Create config at one of these locations:
// .creevey/config.ts (recommended)
// creevey.config.ts

// Specify custom config path
yarn creevey test --config ./custom-config.ts
```

#### Issue: Invalid configuration errors

**Symptoms**: TypeScript compilation errors, runtime validation failures
**Causes**: Type mismatches, missing required properties

**Solutions**:

```typescript
// Use proper typing
import { CreeveyConfig } from 'creevey';

const config: CreeveyConfig = {
  webdriver: PlaywrightWebdriver, // Required
  storybookUrl: 'http://localhost:6006', // Required
  browsers: { chrome: true }, // Required
};

// Validate configuration
yarn creevey test --debug  # Shows config validation
```

### Storybook Integration Issues

#### Issue: "Cannot connect to Storybook"

**Symptoms**: Connection refused, timeout errors
**Causes**: Storybook not running, wrong URL, network issues

**Solutions**:

```bash
# Check if Storybook is running
curl http://localhost:6006

# Start Storybook automatically
yarn creevey test -s --ui

# Use correct URL
yarn creevey test --storybook-url http://localhost:9000
```

#### Issue: "No stories found"

**Symptoms**: Empty test suite, no stories discovered
**Causes**: Incorrect stories configuration, Storybook API issues

**Solutions**:

```typescript
// Check Storybook stories endpoint
curl http://localhost:6006/stories.json

// Verify stories provider configuration
const config: CreeveyConfig = {
  storiesProvider: hybridStoriesProvider, // For interactive tests
  // or
  storiesProvider: browserStoriesProvider, // For static tests
};

// Check test file pattern
testsRegex: /\.creevey\.(ts|js)$/,
```

### Browser and Webdriver Issues

#### Issue: "Browser launch failed"

**Symptoms**: Cannot start browser, timeout during launch
**Causes**: Missing browser dependencies, Docker issues, permission problems

**Solutions**:

```bash
# For Docker usage
yarn creevey test --docker

# For local browsers
yarn creevey test --no-docker

# Install browser dependencies
# Ubuntu/Debian
sudo apt-get install -y libnss3-dev libatk-bridge2.0-dev

# macOS
# browsers should work out of the box
```

#### Issue: Selenium/Playwright connection errors

**Symptoms**: Grid connection refused, webdriver errors
**Causes**: Grid not running, wrong grid URL, version mismatches

**Solutions**:

```typescript
// Check grid connectivity
curl http://localhost:4444/status

// Use correct grid URL
const config: CreeveyConfig = {
  gridUrl: 'http://selenium-hub:4444/wd/hub',
};

// For Playwright, no grid needed
const config: CreeveyConfig = {
  webdriver: PlaywrightWebdriver,
  useDocker: false,
};
```

### Test Execution Issues

#### Issue: Tests timing out

**Symptoms**: Tests fail after timeout period
**Causes**: Slow loading, complex interactions, insufficient timeout

**Solutions**:

```typescript
// Increase timeout
const config: CreeveyConfig = {
  testTimeout: 60000, // 60 seconds instead of 30
};

// Add delays for complex components
story('SlowComponent', () => {
  test('with delay', async (context) => {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    await context.matchImage(await context.takeScreenshot());
  });
});
```

#### Issue: Flaky tests

**Symptoms**: Tests pass/fail inconsistently
**Causes**: Timing issues, animation states, network delays

**Solutions**:

```typescript
// Add retries
const config: CreeveyConfig = {
  maxRetries: 3,
};

// Wait for stable state
test('stable state', async (context) => {
  await context.webdriver.waitForSelector('.loaded');
  await new Promise(resolve => setTimeout(resolve, 500));
  await context.matchImage(await context.takeScreenshot());
});

// Use Creevey delay parameter
parameters: {
  creevey: {
    delay: 1000, // Wait 1 second before capture
  }
}
```

### Image Comparison Issues

#### Issue: False positive differences

**Symptoms**: Tests fail due to minor pixel differences
**Causes**: Anti-aliasing, font rendering, browser differences

**Solutions**:

```typescript
// Adjust threshold
const config: CreeveyConfig = {
  diffOptions: {
    threshold: 0.2, // Increase from default 0.1
    includeAA: false, // Ignore anti-aliased pixels
  },
};

// Use odiff for better comparison
yarn creevey test --odiff

// Ignore dynamic elements
parameters: {
  creevey: {
    ignoreElements: '.timestamp, .loading-spinner',
  }
}
```

#### Issue: Large diff images

**Symptoms**: Significant differences in screenshots
**Causes**: Layout changes, missing assets, viewport differences

**Solutions**:

```typescript
// Ensure consistent viewport
const config: CreeveyConfig = {
  browsers: {
    chrome: {
      viewport: { width: 1024, height: 768 },
    },
  },
};

// Wait for fonts and images
test('wait for assets', async (context) => {
  await context.webdriver.waitForFunction(() => document.fonts.ready, { timeout: 10000 });
  await context.matchImage(await context.takeScreenshot());
});
```

### Docker Issues

#### Issue: "Docker daemon not running"

**Symptoms**: Docker connection errors
**Causes**: Docker not installed or not running

**Solutions**:

```bash
# Start Docker daemon
# macOS/Windows: Start Docker Desktop
# Linux: sudo systemctl start docker

# Test Docker connectivity
docker run hello-world

# Use without Docker
yarn creevey test --no-docker
```

#### Issue: Docker image pull failures

**Symptoms**: Cannot download browser images
**Causes**: Network issues, registry problems, authentication

**Solutions**:

```bash
# Use local images
yarn creevey test --docker --pull-images=false

# Use custom registry
const config: CreeveyConfig = {
  dockerAuth: {
    username: process.env.DOCKER_USER,
    password: process.env.DOCKER_PASS,
  },
};

# Use specific image
browsers: {
  chrome: {
    dockerImage: 'selenoid/chrome:123.0',
  },
}
```

### Performance Issues

#### Issue: Slow test execution

**Symptoms**: Tests take very long to complete
**Causes**: Too many parallel browsers, inefficient test patterns

**Solutions**:

```typescript
// Limit parallel browsers
const config: CreeveyConfig = {
  browsers: {
    chrome: { limit: 2 }, // Reduce from default
    firefox: { limit: 1 },
  },
};

// Use worker queue for large suites
useWorkerQueue: true,
  // Optimize test patterns
  test('efficient test', async (context) => {
    // Minimize unnecessary interactions
    // Combine multiple assertions
    await context.matchImages({
      initial: await context.takeScreenshot(),
      'after-click': await context.takeScreenshot(),
    });
  });
```

#### Issue: Memory usage problems

**Symptoms**: Out of memory errors, slow performance
**Causes**: Memory leaks, too many browser instances

**Solutions**:

```bash
# Monitor memory usage
yarn creevey test --debug

# Reduce browser limits
# Use fail-fast to stop on first error
yarn creevey test --fail-fast

# Restart workers periodically
# (handled automatically by Creevey)
```

### CI/CD Issues

#### Issue: Tests fail in CI but pass locally

**Symptoms**: Inconsistent behavior between local and CI
**Causes**: Different environments, missing dependencies, timing

**Solutions**:

```typescript
// CI-specific configuration
// .creevey/ci.config.ts
const config: CreeveyConfig = {
  useDocker: false, // Often needed in CI
  testTimeout: 60000, // Increase timeout
  maxRetries: 2, // Handle flaky CI tests
  browsers: {
    chrome: {
      browserName: 'chromium',
      playwrightOptions: {
        args: ['--no-sandbox', '--disable-dev-shm-usage'], // CI flags
      },
    },
  },
};

// Use appropriate reporter
reporter: process.env.CI ? 'junit' : 'creevey',
```

#### Issue: Artifact handling

**Symptoms**: Test reports not saved, screenshots missing
**Causes**: Incorrect paths, permission issues, artifact cleanup

**Solutions**:

```bash
# Ensure report directory exists
mkdir -p report

# Use absolute paths
const config: CreeveyConfig = {
  reportDir: process.cwd() + '/report',
  screenDir: process.cwd() + '/images',
};

# Upload artifacts in CI
# GitHub Actions
- name: Upload Test Results
  uses: actions/upload-artifact@v3
  with:
    name: creevey-report
    path: report/
```

### Debugging Techniques

#### Enable Debug Logging

```bash
# Basic debug
yarn creevey test --debug

# Verbose tracing
yarn creevey test --trace

# Check configuration
yarn creevey test --debug | grep "config"
```

#### Inspect Test State

```typescript
// Add debugging to tests
test('debug test', async (context) => {
  console.log('Browser:', context.browserName);
  console.log('URL:', await context.webdriver.getCurrentUrl());

  // Capture element state
  const element = await context.webdriver.findElement(By.css('.component'));
  console.log('Element visible:', await element.isDisplayed());

  await context.matchImage(await context.takeScreenshot());
});
```

#### Manual Browser Inspection

```typescript
// Use headed browser for debugging
const config: CreeveyConfig = {
  browsers: {
    chrome: {
      browserName: 'chromium',
      playwrightOptions: {
        headless: false,
        slowMo: 100, // Slow down for observation
      },
    },
  },
};

// Add pause in tests
test('manual inspection', async (context) => {
  await context.matchImage(await context.takeScreenshot());

  // Pause for manual inspection
  console.log('Pausing for inspection - check browser');
  await new Promise((resolve) => setTimeout(resolve, 30000));
});
```

## Getting Help

### Log Analysis

```bash
# Check Creevey logs
yarn creevey test --debug 2>&1 | tee creevey.log

# Filter specific errors
grep -i error creevey.log
grep -i timeout creevey.log
```

### Community Resources

- GitHub Issues: Report bugs and request features
- Documentation: Check `docs/` directory for detailed guides
- Examples: Review `docs/examples/` for configuration patterns

### Creating Bug Reports

When reporting issues, include:

1. Creevey version
2. Configuration file
3. Full error logs with `--debug`
4. Operating system and Node.js version
5. Minimal reproduction example
6. Expected vs actual behavior
