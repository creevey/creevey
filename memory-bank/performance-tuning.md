# Creevey Performance Tuning Guide

This guide provides strategies and techniques for optimizing Creevey's performance in visual regression testing workflows, from configuration tweaks to advanced optimization strategies.

## Table of Contents

1. [Understanding Performance Bottlenecks](#understanding-performance-bottlenecks)
2. [Configuration Optimization](#configuration-optimization)
3. [Browser Selection and Configuration](#browser-selection-and-configuration)
4. [Test Selection Strategies](#test-selection-strategies)
5. [Parallelization and Workers](#parallelization-and-workers)
6. [Resource Management](#resource-management)
7. [CI Pipeline Optimization](#ci-pipeline-optimization)
8. [Advanced Techniques](#advanced-techniques)

## Understanding Performance Bottlenecks

Visual regression testing performance can be limited by several factors:

- **Browser Startup Time**: Launching browser instances is expensive
- **Screenshot Capture**: Taking and processing screenshots requires resources
- **Story Rendering**: Complex components take longer to render
- **Image Comparison**: Comparing images pixel-by-pixel is CPU-intensive
- **Disk I/O**: Saving and reading screenshots can be slow
- **Network Latency**: Storybook server communication can cause delays

Understanding which bottlenecks affect your workflow helps target optimizations effectively.

## Configuration Optimization

### Basic Configuration Tuning

```typescript
// creevey.config.ts
import { defineConfig } from 'creevey';
import { PlaywrightWebdriver } from 'creevey/playwright';

export default defineConfig({
  webdriver: PlaywrightWebdriver,

  // Performance optimized settings
  storybookUrl: 'http://localhost:6006',
  maxWorkers: Math.max(1, require('os').cpus().length - 1), // Use N-1 cores

  // Reduce unnecessary I/O
  screenDir: '.creevey/images',
  reportDir: '.creevey/report',

  // Skip image rendering in report for faster reporting
  imageRendering: 'lazy',

  // Optimize browser instances
  browsers: {
    chromium: {
      browserName: 'chromium',
      headless: true,
      // Minimal viewport for faster rendering
      viewport: { width: 800, height: 600 },
      // Optimize browser resources
      playwrightOptions: {
        args: ['--disable-gpu', '--disable-dev-shm-usage', '--disable-setuid-sandbox', '--no-sandbox'],
      },
    },
  },
});
```

### Threshold and Tolerance Settings

Adjust image comparison sensitivity for faster processing:

```typescript
export default defineConfig({
  // ... other config

  // Faster image comparison with reasonable tolerance
  differenceThreshold: 0.01, // 1% threshold for differences

  // Skip anti-aliasing in comparisons for better performance
  ignoreAntialiasing: true,
});
```

## Browser Selection and Configuration

### Choosing the Fastest Browser

Browser performance varies significantly:

```typescript
export default defineConfig({
  // ... other config
  browsers: {
    // Chromium is typically fastest for screenshots
    chromium: {
      browserName: 'chromium',
      headless: true,
      // Disable unnecessary features
      playwrightOptions: {
        args: [
          '--disable-extensions',
          '--disable-component-extensions-with-background-pages',
          '--disable-background-networking',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-breakpad',
          '--disable-client-side-phishing-detection',
          '--disable-default-apps',
          '--disable-dev-shm-usage',
          '--disable-extensions',
          '--disable-features=Translate,BackForwardCache',
          '--disable-hang-monitor',
          '--disable-ipc-flooding-protection',
          '--disable-popup-blocking',
          '--disable-prompt-on-repost',
          '--disable-renderer-backgrounding',
          '--disable-sync',
          '--force-color-profile=srgb',
          '--metrics-recording-only',
          '--no-first-run',
          '--no-sandbox',
          '--enable-automation',
          '--password-store=basic',
          '--use-mock-keychain',
        ],
      },
    },
  },
});
```

### Browser Instance Reuse

Configure browser reuse to avoid startup costs:

```typescript
export default defineConfig({
  // ... other config

  // Reuse browser instances for multiple stories
  // Options: 'per_test', 'per_story', 'per_kind', 'per_browser'
  browserPerWorker: 'per_kind',
});
```

## Test Selection Strategies

### Selective Testing

Only run tests that are likely to be affected by your changes:

```typescript
// Run only specific components
npx creevey --grep "Button|Input"

// Skip specific components
npx creevey --grep-invert "Modal|Tooltip"
```

### Config-based Selection

```typescript
export default defineConfig({
  // ... other config

  // Skip certain tests in fast runs
  tests: {
    'complex/SlowComponent': {
      skip: process.env.FAST_RUN === 'true',
    },
    'layout/LargeTable': {
      skip: process.env.FAST_RUN === 'true',
    },
  },
});
```

### Story Filtering by Changed Files

Create a script to determine which stories to test based on git changes:

```javascript
// scripts/selective-testing.js
const { execSync } = require('child_process');
const path = require('path');

// Get changed files since branch diverged from main
const changedFiles = execSync('git diff --name-only $(git merge-base HEAD origin/main) HEAD')
  .toString()
  .split('\n')
  .filter(Boolean);

// Map component directories to story patterns
const componentDirs = {
  'src/components/Button': 'Button',
  'src/components/Input': 'Input',
  // Add other mappings
};

// Build grep pattern based on changed files
const patterns = changedFiles
  .map((file) => {
    const dir = path.dirname(file);
    return Object.entries(componentDirs).find(([compDir]) => dir.startsWith(compDir))?.[1];
  })
  .filter(Boolean);

if (patterns.length > 0) {
  const grepPattern = patterns.join('|');
  console.log(`Running tests for: ${grepPattern}`);
  execSync(`npx creevey --grep "${grepPattern}"`, { stdio: 'inherit' });
} else {
  console.log('No relevant component changes detected, skipping tests');
}
```

## Parallelization and Workers

### Worker Optimization

```typescript
export default defineConfig({
  // ... other config

  // Adjust based on machine capacity (CPU cores and memory)
  maxWorkers: 4,

  // Set to 0 to use available CPUs minus 1
  // maxWorkers: 0,

  // Alternatively, calculate based on available memory
  // maxWorkers: Math.min(
  //   require('os').cpus().length - 1,
  //   Math.floor(require('os').freemem() / (1.5 * 1024 * 1024 * 1024))
  // ),
});
```

### Advanced Parallelization

Create a sharded test execution strategy for CI:

```javascript
// scripts/sharded-tests.js
const { execSync } = require('child_process');

// Get total stories count
const storiesOutput = execSync('npx creevey --list').toString();
const totalStories = storiesOutput.split('\n').filter(Boolean).length;

// Get shard info from environment
const shardIndex = parseInt(process.env.SHARD_INDEX || '0');
const totalShards = parseInt(process.env.TOTAL_SHARDS || '1');

// Calculate story range for this shard
const storiesPerShard = Math.ceil(totalStories / totalShards);
const startStory = shardIndex * storiesPerShard;
const endStory = Math.min((shardIndex + 1) * storiesPerShard, totalStories);

console.log(`Running shard ${shardIndex + 1}/${totalShards} (stories ${startStory}-${endStory})`);

// Execute creevey with the shard range
execSync(`npx creevey --skip ${startStory} --take ${endStory - startStory}`, {
  stdio: 'inherit',
});
```

## Resource Management

### Memory Optimization

```typescript
export default defineConfig({
  // ... other config

  // Prevent memory leaks with browser cleanup
  hooks: {
    afterEach: async ({ browser }) => {
      // Clear browser caches
      if (browser && browser.page) {
        await browser.page
          .evaluate(() => {
            window.performance?.memory && console.log('Memory usage:', window.performance.memory);
            if (window.gc) window.gc();
          })
          .catch(() => {});
      }
    },
    afterAll: async ({ browser }) => {
      // Force close and cleanup
      if (browser && browser.page) {
        await browser.page.close().catch(() => {});
      }
    },
  },
});
```

### Storybook Optimization

Configure Storybook for faster loading:

```javascript
// .storybook/main.js
module.exports = {
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [
    // Keep only essential addons
    '@storybook/addon-essentials',
  ],
  // Production optimizations for testing
  features: {
    storyStoreV7: true, // Modern store for faster loading
  },
  // Faster webpack builds
  webpackFinal: (config) => {
    // Skip source maps in test mode
    if (process.env.NODE_ENV === 'test') {
      config.devtool = false;
    }

    // Optimize chunking
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        minSize: 30000,
        maxSize: 0,
        minChunks: 1,
      },
    };

    return config;
  },
};
```

## CI Pipeline Optimization

### Caching Strategies

For GitHub Actions:

```yaml
- name: Cache node modules
  uses: actions/cache@v3
  with:
    path: |
      node_modules
      ~/.cache/ms-playwright
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}-playwright

- name: Cache Storybook build
  uses: actions/cache@v3
  with:
    path: storybook-static
    key: ${{ runner.os }}-storybook-${{ hashFiles('src/**/*.stories.*') }}-${{ github.sha }}
    restore-keys: |
      ${{ runner.os }}-storybook-

- name: Cache Creevey images
  uses: actions/cache@v3
  with:
    path: .creevey/images
    key: ${{ runner.os }}-creevey-${{ github.ref_name }}
```

### Staged Execution

Run visual tests in stages to fail fast:

```yaml
- name: Quick visual check
  run: |
    # Run only critical components first
    npx creevey --grep "Button|Form|Header" --reporter dot

- name: Full visual tests
  if: success()
  run: |
    # Run remaining tests only if critical ones pass
    npx creevey --grep-invert "Button|Form|Header" --reporter dot,html
```

## Advanced Techniques

### Memory Leak Detection

Create a memory monitoring script:

```typescript
// scripts/memory-monitor.js
const { execSync } = require('child_process');
const fs = require('fs');

// Run tests with memory profiling
const output = execSync('NODE_OPTIONS=--expose-gc npx creevey --config creevey.memory.config.ts').toString();

// Parse memory logs from output
const memoryUsages = output
  .split('\n')
  .filter((line) => line.includes('Memory usage:'))
  .map((line) => {
    const json = line.replace('Memory usage:', '').trim();
    return JSON.parse(json);
  });

// Analyze for leaks
if (memoryUsages.length > 0) {
  const startMemory = memoryUsages[0].usedJSHeapSize / 1024 / 1024;
  const endMemory = memoryUsages[memoryUsages.length - 1].usedJSHeapSize / 1024 / 1024;

  console.log(`Memory check: Start: ${startMemory.toFixed(2)}MB, End: ${endMemory.toFixed(2)}MB`);

  if (endMemory > startMemory * 1.5) {
    console.warn('Potential memory leak detected!');

    // Write to file for analysis
    fs.writeFileSync('memory-profile.json', JSON.stringify(memoryUsages, null, 2));
  }
}
```

### Custom Optimized Webdriver

Create a specialized fast webdriver:

```typescript
// src/utils/fast-webdriver.ts
import { Webdriver } from 'creevey';
import playwright from 'playwright';

export class FastWebdriver implements Webdriver {
  private browser: playwright.Browser | null = null;
  private context: playwright.BrowserContext | null = null;
  private page: playwright.Page | null = null;

  async start(options: any) {
    // Launch a single persistent browser
    if (!this.browser) {
      this.browser = await playwright.chromium.launch({
        headless: true,
        args: ['--disable-gpu', '--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      });
    }

    // Create context with viewport
    this.context = await this.browser.newContext({
      viewport: options.viewport,
      deviceScaleFactor: 1,
    });

    // Create page with optimized settings
    this.page = await this.context.newPage();

    // Optimize page performance
    await this.page.addInitScript(() => {
      // Disable animations
      const style = document.createElement('style');
      style.type = 'text/css';
      style.innerHTML = '* { animation-duration: 0s !important; transition-duration: 0s !important; }';
      document.head.appendChild(style);

      // Intercept timers for faster rendering
      const originalSetTimeout = window.setTimeout;
      window.setTimeout = (fn, ms, ...args) => {
        return originalSetTimeout(fn, Math.min(ms, 10), ...args);
      };
    });

    return {
      page: this.page,
      browser: this.browser,
    };
  }

  async stop() {
    if (this.page) {
      await this.page.close().catch(() => {});
      this.page = null;
    }

    if (this.context) {
      await this.context.close().catch(() => {});
      this.context = null;
    }

    // Keep browser instance alive for reuse
  }

  async takeScreenshot() {
    if (!this.page) throw new Error('Page not initialized');

    // Use optimal screenshot settings
    return this.page.screenshot({
      type: 'png',
      fullPage: false,
      optimizeForSpeed: true,
    });
  }

  // Implement other required methods
}
```

### Storybook Static Server

For faster story loading, serve pre-built Storybook:

```typescript
// scripts/static-storybook.js
const express = require('express');
const compression = require('compression');
const { execSync } = require('child_process');

// Build Storybook if not already built
if (!require('fs').existsSync('./storybook-static')) {
  console.log('Building Storybook...');
  execSync('npm run build-storybook', { stdio: 'inherit' });
}

// Create optimized server
const app = express();
app.use(compression()); // Compress responses
app.use(
  express.static('./storybook-static', {
    maxAge: '1h', // Cache static assets
    etag: true,
  }),
);

// Start server
const port = 6006;
const server = app.listen(port, () => {
  console.log(`Static Storybook server running at http://localhost:${port}`);

  // Run Creevey against static server
  try {
    execSync('npx creevey --config creevey.config.ts', { stdio: 'inherit' });
  } finally {
    server.close();
  }
});
```

### Image Processing Optimization

For large test suites with many screenshots:

```typescript
// scripts/optimize-images.js
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

// Configure sharp for speed
sharp.cache(false); // Disable cache for lower memory usage
sharp.concurrency(require('os').cpus().length); // Use all CPUs

async function* getFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const res = path.resolve(dir, entry.name);
    if (entry.isDirectory()) {
      yield* getFiles(res);
    } else if (entry.name.match(/\.(png|jpg)$/)) {
      yield res;
    }
  }
}

async function optimizeImages() {
  const screenshotDir = '.creevey/images';
  const optimizedCount = { processed: 0, skipped: 0 };

  for await (const file of getFiles(screenshotDir)) {
    try {
      const stats = await stat(file);

      // Skip already optimized images (under 100KB)
      if (stats.size < 100 * 1024) {
        optimizedCount.skipped++;
        continue;
      }

      // Optimize PNG files (screenshots)
      await sharp(file)
        .png({ compressionLevel: 9, adaptiveFiltering: true })
        .toBuffer()
        .then((data) => fs.promises.writeFile(file, data));

      optimizedCount.processed++;
    } catch (err) {
      console.error(`Error processing ${file}:`, err);
    }
  }

  console.log(`Optimized ${optimizedCount.processed} images, skipped ${optimizedCount.skipped} images`);
}

optimizeImages().catch(console.error);
```

## Performance Monitoring

Track Creevey performance over time:

```typescript
// scripts/performance-tracker.js
const { execSync } = require('child_process');
const fs = require('fs');

// Run with time measurement
console.log('Starting performance measurement...');
const startTime = Date.now();

try {
  execSync('npx creevey --config creevey.config.ts', { stdio: 'inherit' });
} catch (e) {
  // Continue even if tests fail
}

const endTime = Date.now();
const duration = (endTime - startTime) / 1000;

// Load historical data
let history = [];
try {
  if (fs.existsSync('perf-history.json')) {
    history = JSON.parse(fs.readFileSync('perf-history.json', 'utf8'));
  }
} catch (e) {
  console.error('Error reading performance history:', e);
}

// Add new data point
const dataPoint = {
  timestamp: new Date().toISOString(),
  durationSeconds: duration,
  commit: execSync('git rev-parse HEAD').toString().trim(),
  storyCount: parseInt(execSync('npx creevey --list | wc -l').toString().trim()),
};

history.push(dataPoint);

// Save updated history
fs.writeFileSync('perf-history.json', JSON.stringify(history, null, 2));

// Report
console.log(`\n--- Performance Report ---`);
console.log(`Total duration: ${duration.toFixed(2)} seconds`);

if (history.length > 1) {
  const previous = history[history.length - 2].durationSeconds;
  const diff = duration - previous;
  const diffPercent = (diff / previous) * 100;

  console.log(`Previous run: ${previous.toFixed(2)} seconds`);
  console.log(`Difference: ${diff > 0 ? '+' : ''}${diff.toFixed(2)} seconds (${diffPercent.toFixed(1)}%)`);

  if (diffPercent > 10) {
    console.warn('⚠️ Performance regression detected!');
  } else if (diffPercent < -10) {
    console.log('🎉 Performance improvement!');
  }
}
```

By implementing these performance optimizations, you can significantly reduce the execution time of your Creevey visual regression tests, making them more practical for continuous integration and development workflows.
