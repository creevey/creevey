# Creevey Testing Strategy and Patterns

## Testing Architecture Overview

Creevey itself is tested using a multi-layered approach to ensure reliability of the visual testing platform.

### Test Categories

1. **Unit Tests** - Individual function and component testing
2. **Integration Tests** - Module interaction testing
3. **E2E Tests** - Full workflow testing
4. **Visual Tests** - UI component verification

## Test Structure

### Directory Organization

```
tests/
├── client/                 # Frontend tests
│   └── helpers.test.ts     # Client utility tests
├── shared/                 # Shared utility tests
│   ├── serializeRegExp.test.ts
│   └── serializeRawStories.test.ts
├── utils.test.ts           # General utility tests
└── playwright.spec.ts      # Playwright integration tests
```

### Test File Patterns

- `*.test.ts` - Unit and integration tests
- `*.spec.ts` - Specification tests (Playwright)
- Test files mirror source structure

## Unit Testing Patterns

### Utility Function Testing

```typescript
// tests/shared/serializeRegExp.test.ts
import { describe, it, expect } from 'vitest';
import { serializeRegExp } from '../src/shared/serializeRegExp';

describe('serializeRegExp', () => {
  it('should serialize simple regex', () => {
    const regex = /test/g;
    expect(serializeRegExp(regex)).toBe('/test/g');
  });

  it('should handle complex regex patterns', () => {
    const regex = /^https?:\/\/[^\s]+$/i;
    expect(serializeRegExp(regex)).toBe('/^https?:\\/\\/[^\\s]+$/i');
  });
});
```

### Type Testing

```typescript
// tests/client/helpers.test.ts
import { describe, it, expect } from 'vitest';
import { isTest, isObject } from '../src/client/shared/helpers';

describe('type guards', () => {
  it('should identify test objects correctly', () => {
    const test = { id: 'test', storyId: 'story' };
    expect(isTest(test)).toBe(true);
  });

  it('should reject non-test objects', () => {
    const notTest = { id: 'test' };
    expect(isTest(notTest)).toBe(false);
  });
});
```

## Integration Testing Patterns

### Webdriver Integration

```typescript
// tests/playwright.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Playwright Webdriver', () => {
  test('should launch browser and capture screenshot', async () => {
    // Test actual webdriver functionality
    const { PlaywrightWebdriver } = await import('../src/playwright');

    const webdriver = new PlaywrightWebdriver('chromium', 'http://localhost:6006', config, options);

    await webdriver.openBrowser();
    const screenshot = await webdriver.takeScreenshot();
    expect(screenshot).toBeInstanceOf(Buffer);
    await webdriver.closeBrowser();
  });
});
```

### Stories Provider Testing

```typescript
// tests/integration/stories-provider.test.ts
import { describe, it, expect } from 'vitest';
import { hybridStoriesProvider } from '../src/server/providers/hybrid';

describe('Hybrid Stories Provider', () => {
  it('should load stories from filesystem', async () => {
    const stories = await hybridStoriesProvider(config, () => {});
    expect(stories).toBeDefined();
    expect(Object.keys(stories).length).toBeGreaterThan(0);
  });
});
```

## Visual Testing Patterns

### Component Testing

```typescript
// stories/TestViews.creevey.ts
import { story, test } from 'creevey';

story('TestViews', () => {
  test('renders correctly', async (context) => {
    await context.matchImage(await context.takeScreenshot());
  });

  test('handles interaction', async (context) => {
    await context.webdriver.click('[data-testid="button"]');
    await context.matchImage(await context.takeScreenshot());
  });
});
```

### Responsive Testing

```typescript
// stories/ResponsiveComponent.creevey.ts
import { story, test } from 'creevey';

story('ResponsiveComponent', () => {
  test('mobile view', async (context) => {
    // Configure mobile viewport in browser config
    await context.matchImage(await context.takeScreenshot());
  });

  test('desktop view', async (context) => {
    // Configure desktop viewport in browser config
    await context.matchImage(await context.takeScreenshot());
  });
});
```

## Test Configuration

### Vitest Configuration

```typescript
// vitest.config.mts
export default {
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
    globals: true,
  },
};
```

### Test Utilities

```typescript
// tests/utils/test-helpers.ts
export const mockConfig = {
  storybookUrl: 'http://localhost:6006',
  screenDir: './test-images',
  reportDir: './test-report',
  browsers: { chrome: { browserName: 'chromium' } },
};

export const createMockContext = () => ({
  browserName: 'chrome',
  webdriver: {
    click: vi.fn(),
    type: vi.fn(),
    takeScreenshot: vi.fn(),
  },
  takeScreenshot: vi.fn(),
  matchImage: vi.fn(),
});
```

## Test Data Management

### Mock Data

```typescript
// tests/mocks/stories.ts
export const mockStories = {
  'Component--default': {
    id: 'Component--default',
    name: 'Default',
    title: 'Component',
    parameters: { creevey: {} },
  },
};

export const mockTestResult = {
  status: 'success' as const,
  retries: 0,
  images: { chrome: { actual: 'path/to/actual.png' } },
};
```

### Test Fixtures

```typescript
// tests/fixtures/test-images.ts
import { readFileSync } from 'fs';
import { join } from 'path';

export const loadTestImage = (filename: string): Buffer => {
  return readFileSync(join(__dirname, '../fixtures', filename));
};

export const mockScreenshot = loadTestImage('mock-screenshot.png');
```

## Performance Testing

### Test Execution Time

```typescript
// tests/performance/test-execution.test.ts
import { describe, it, expect } from 'vitest';

describe('Performance Tests', () => {
  it('should complete test execution within timeout', async () => {
    const startTime = Date.now();

    // Run test workflow
    await runTestWorkflow();

    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(30000); // 30 seconds
  });
});
```

### Memory Usage

```typescript
// tests/performance/memory.test.ts
import { describe, it, expect } from 'vitest';

describe('Memory Usage', () => {
  it('should not leak memory during test execution', async () => {
    const initialMemory = process.memoryUsage().heapUsed;

    // Run multiple test cycles
    for (let i = 0; i < 100; i++) {
      await runTestCycle();
    }

    // Force garbage collection if available
    if (global.gc) global.gc();

    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = finalMemory - initialMemory;

    // Allow some memory increase but not excessive
    expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // 50MB
  });
});
```

## Error Handling Tests

### Webdriver Errors

```typescript
// tests/error-handling/webdriver.test.ts
import { describe, it, expect } from 'vitest';

describe('Webdriver Error Handling', () => {
  it('should handle browser launch failure', async () => {
    const webdriver = new PlaywrightWebdriver('invalid-browser', config, options);

    await expect(webdriver.openBrowser()).rejects.toThrow();
  });

  it('should handle screenshot capture failure', async () => {
    // Mock webdriver to throw error
    const mockWebdriver = {
      takeScreenshot: () => Promise.reject(new Error('Screenshot failed')),
    };

    const context = createTestContext(mockWebdriver);

    await expect(context.takeScreenshot()).rejects.toThrow('Screenshot failed');
  });
});
```

### Configuration Errors

```typescript
// tests/error-handling/config.test.ts
import { describe, it, expect } from 'vitest';
import { readConfig } from '../src/server/config';

describe('Configuration Error Handling', () => {
  it('should handle missing config file', async () => {
    const config = await readConfig({ config: 'nonexistent.ts' });
    expect(config).toBeDefined();
    // Should use defaults
  });

  it('should handle invalid config syntax', async () => {
    // Create temporary invalid config file
    await expect(readConfig({ config: 'invalid-config.ts' })).rejects.toThrow();
  });
});
```

## Cross-Browser Testing

### Browser Matrix Testing

```typescript
// tests/cross-browser/browser-matrix.test.ts
import { describe, it } from 'vitest';

describe('Cross-Browser Tests', () => {
  const browsers = ['chrome', 'firefox', 'webkit'];

  browsers.forEach((browser) => {
    describe(`${browser}`, () => {
      it('should capture screenshots consistently', async () => {
        const config = createBrowserConfig(browser);
        const result = await runVisualTest(config);

        expect(result.status).toBe('success');
      });

      it('should handle interactions correctly', async () => {
        const config = createBrowserConfig(browser);
        const result = await runInteractionTest(config);

        expect(result.status).toBe('success');
      });
    });
  });
});
```

## Test Utilities

### Custom Matchers

```typescript
// tests/utils/custom-matchers.ts
import { expect } from 'vitest';

interface CustomMatchers {
  toBeValidScreenshot: () => void;
  toMatchReferenceImage: () => void;
}

expect.extend({
  toBeValidScreenshot(received: Buffer) {
    const isValid = Buffer.isBuffer(received) && received.length > 0;

    return {
      pass: isValid,
      message: () => `expected ${received} to be a valid screenshot buffer`,
    };
  },

  toMatchReferenceImage(received: Buffer, reference: Buffer) {
    // Simple comparison - in real implementation would use image comparison
    const matches = received.equals(reference);

    return {
      pass: matches,
      message: () => `expected screenshot to match reference image`,
    };
  },
});
```

### Test Helpers

```typescript
// tests/utils/test-helpers.ts
export const withTimeout = <T>(promise: Promise<T>, timeoutMs: number = 5000): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Test timeout')), timeoutMs)),
  ]);
};

export const retryTest = async (testFn: () => Promise<void>, maxRetries: number = 3): Promise<void> => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await testFn();
      return;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
};
```

## Continuous Integration Testing

### CI Test Configuration

```yaml
# .github/workflows/tests.yml
- name: Run Tests
  run: |
    yarn test --coverage
    yarn creevey test --no-docker --reporter junit

- name: Upload Coverage
  uses: codecov/codecov-action@v3
  with:
    file: ./coverage/lcov.info
```

### Test Parallelization

```typescript
// vitest.config.mts
export default {
  test: {
    include: ['tests/**/*.test.ts'],
    pool: 'threads',
    poolOptions: {
      threads: {
        maxThreads: 4,
        minThreads: 2,
      },
    },
  },
};
```

## Best Practices

### Test Organization

- Group related tests in `describe` blocks
- Use descriptive test names
- Keep tests focused and independent
- Use helpers to reduce duplication

### Test Data

- Use consistent mock data
- Clean up test artifacts
- Use deterministic test data
- Avoid external dependencies in tests

### Error Testing

- Test both success and failure paths
- Verify error messages
- Test edge cases and boundary conditions
- Ensure proper cleanup on errors

### Performance Testing

- Monitor test execution times
- Test with realistic data sizes
- Profile memory usage
- Test under concurrent load
