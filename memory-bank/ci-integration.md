# Creevey CI Integration Guide

This guide provides detailed instructions for integrating Creevey visual regression testing into continuous integration (CI) pipelines across different platforms.

## Table of Contents

1. [CI Integration Benefits](#ci-integration-benefits)
2. [General CI Setup](#general-ci-setup)
3. [GitHub Actions](#github-actions)
4. [GitLab CI](#gitlab-ci)
5. [CircleCI](#circleci)
6. [Jenkins](#jenkins)
7. [Azure DevOps](#azure-devops)
8. [Best Practices](#best-practices)

## CI Integration Benefits

Integrating Creevey into your CI workflow provides several advantages:

- **Automated Visual Testing**: Catch visual regressions automatically without manual intervention
- **Early Detection**: Identify visual issues before they reach production
- **Version Control Integration**: Track visual changes alongside code changes
- **Pull Request Validation**: Verify visual changes on PRs before merging
- **Consistent Testing Environment**: Run tests in a standardized environment

## General CI Setup

Regardless of the CI platform, the basic steps for integrating Creevey include:

1. **Environment Setup**: Configure Node.js and browser dependencies
2. **Cache Management**: Optimize build times with proper caching
3. **Storybook Build**: Build Storybook before running visual tests
4. **Creevey Execution**: Run Creevey tests in headless mode
5. **Artifact Storage**: Save screenshots and reports for review
6. **Status Reporting**: Report test results to your PR or commit

### Base Requirements

For any CI environment, ensure:

- Node.js (version 18.x or higher)
- Browser dependencies (for headless browsers)
- Sufficient memory allocation (minimum 4GB recommended)
- Artifact storage for screenshots and reports

## GitHub Actions

### Basic Setup

Create a `.github/workflows/visual-testing.yml` file:

```yaml
name: Visual Regression Testing

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  visual-tests:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0 # Required for comparing with base branch

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium

      - name: Build Storybook
        run: npm run build-storybook

      - name: Run Creevey tests
        run: npx creevey --config creevey.config.ts --reporter dot,html

      - name: Upload visual test artifacts
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: visual-test-report
          path: |
            .creevey/report/
            .creevey/report.html
```

### Advanced Setup with Base Branch Comparison

This setup detects the base branch and runs tests with reference to it:

```yaml
name: Visual Regression Testing

on:
  pull_request:
    branches: [main]

jobs:
  visual-tests:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium

      - name: Build Storybook
        run: npm run build-storybook

      # Checkout base branch to generate reference images
      - name: Checkout base branch
        run: |
          git checkout ${{ github.base_ref }}
          npm ci
          npm run build-storybook
          npx creevey --config creevey.config.ts --update

      # Return to PR branch and test against reference images
      - name: Checkout PR branch
        run: |
          git checkout ${{ github.head_ref }}
          npm ci
          npm run build-storybook
          npx creevey --config creevey.config.ts

      - name: Upload visual test artifacts
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: visual-test-report
          path: |
            .creevey/report/
            .creevey/report.html

      # Optional: Comment on PR with test results
      - name: Comment on PR
        if: github.event_name == 'pull_request' && always()
        uses: actions/github-script@v6
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          script: |
            const fs = require('fs');
            try {
              // Count failed tests
              const summaryPath = '.creevey/report/summary.json';
              if (fs.existsSync(summaryPath)) {
                const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
                const failed = summary.failed || 0;
                
                let body = '## Visual Regression Test Results\n\n';
                if (failed > 0) {
                  body += `❌ **${failed} visual differences detected**\n\n`;
                  body += 'Please check the test artifacts for details.\n';
                } else {
                  body += '✅ **No visual differences detected**\n';
                }
                
                github.rest.issues.createComment({
                  issue_number: context.issue.number,
                  owner: context.repo.owner,
                  repo: context.repo.repo,
                  body: body
                });
              }
            } catch (error) {
              console.error('Error creating PR comment:', error);
            }
```

### Setup with Docker

For consistent browser rendering across environments:

```yaml
name: Visual Regression Testing with Docker

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  visual-tests:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build Storybook
        run: npm run build-storybook

      - name: Set up Docker
        uses: docker/setup-buildx-action@v2

      - name: Run Creevey tests in Docker
        run: |
          docker run --rm \
            -v $(pwd):/app \
            -w /app \
            mcr.microsoft.com/playwright:v1.36.0-focal \
            npx creevey --config creevey.config.docker.ts

      - name: Upload visual test artifacts
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: visual-test-report
          path: |
            .creevey/report/
            .creevey/report.html
```

## GitLab CI

Create a `.gitlab-ci.yml` file:

```yaml
image: node:18

stages:
  - test

# Cache dependencies between jobs
cache:
  key: ${CI_COMMIT_REF_SLUG}
  paths:
    - node_modules/
    - .npm/

visual-regression:
  stage: test
  image: mcr.microsoft.com/playwright:v1.36.0-focal
  variables:
    # Ensure enough memory for browser tests
    NODE_OPTIONS: '--max_old_space_size=4096'
  before_script:
    - npm ci
    - npx playwright install chromium
  script:
    - npm run build-storybook
    - npx creevey --config creevey.config.ts --reporter dot,junit
  artifacts:
    when: always
    paths:
      - .creevey/report/
      - .creevey/report.html
    reports:
      junit: .creevey/report/junit.xml

# For merge requests, compare with target branch
visual-regression-compare:
  stage: test
  image: mcr.microsoft.com/playwright:v1.36.0-focal
  variables:
    NODE_OPTIONS: '--max_old_space_size=4096'
  before_script:
    - npm ci
    - npx playwright install chromium
  script:
    # Get target branch screenshots
    - git fetch origin $CI_MERGE_REQUEST_TARGET_BRANCH_NAME
    - git checkout $CI_MERGE_REQUEST_TARGET_BRANCH_NAME
    - npm ci
    - npm run build-storybook
    - npx creevey --config creevey.config.ts --update

    # Test current branch against reference
    - git checkout $CI_COMMIT_SHA
    - npm ci
    - npm run build-storybook
    - npx creevey --config creevey.config.ts
  artifacts:
    when: always
    paths:
      - .creevey/report/
      - .creevey/report.html
    reports:
      junit: .creevey/report/junit.xml
  only:
    - merge_requests
```

## CircleCI

Create a `.circleci/config.yml` file:

```yaml
version: 2.1
orbs:
  node: circleci/node@5.0.0
  browser-tools: circleci/browser-tools@1.2.5

jobs:
  visual-regression:
    docker:
      - image: cimg/node:18.12-browsers
    resource_class: large
    steps:
      - checkout
      - browser-tools/install-browser-tools:
          chrome-version: 'latest'
      - node/install-packages:
          pkg-manager: npm
          cache-path: ~/project/node_modules
      - run:
          name: Build Storybook
          command: npm run build-storybook
      - run:
          name: Run Creevey
          command: npx creevey --config creevey.config.ts
      - store_artifacts:
          path: .creevey/report
          destination: creevey-report
      - store_artifacts:
          path: .creevey/report.html
          destination: creevey-report.html
      # Optional: save test results for the dashboard
      - store_test_results:
          path: .creevey/report

  visual-regression-comparison:
    docker:
      - image: cimg/node:18.12-browsers
    resource_class: large
    steps:
      - checkout
      - browser-tools/install-browser-tools:
          chrome-version: 'latest'
      - node/install-packages:
          pkg-manager: npm
          cache-path: ~/project/node_modules
      - run:
          name: Fetch target branch
          command: |
            git fetch origin << pipeline.git.base_revision >>
            git checkout << pipeline.git.base_revision >>
            npm ci
            npm run build-storybook
            npx creevey --config creevey.config.ts --update

            git checkout << pipeline.git.revision >>
            npm ci
            npm run build-storybook
            npx creevey --config creevey.config.ts
      - store_artifacts:
          path: .creevey/report
          destination: creevey-report
      - store_artifacts:
          path: .creevey/report.html
          destination: creevey-report.html
      - store_test_results:
          path: .creevey/report

workflows:
  version: 2
  test:
    jobs:
      - visual-regression:
          filters:
            branches:
              ignore: main
      - visual-regression-comparison:
          filters:
            branches:
              ignore: main
```

## Jenkins

Create a `Jenkinsfile`:

```groovy
pipeline {
    agent {
        docker {
            image 'mcr.microsoft.com/playwright:v1.36.0-focal'
            args '-v /tmp:/tmp'
        }
    }

    options {
        timeout(time: 30, unit: 'MINUTES')
    }

    stages {
        stage('Setup') {
            steps {
                sh 'npm ci'
                sh 'npx playwright install chromium'
            }
        }

        stage('Build Storybook') {
            steps {
                sh 'npm run build-storybook'
            }
        }

        stage('Visual Tests') {
            steps {
                script {
                    def isPR = env.CHANGE_ID != null

                    if (isPR) {
                        // For PRs, compare with target branch
                        sh """
                            git fetch origin ${env.CHANGE_TARGET}
                            git checkout ${env.CHANGE_TARGET}
                            npm ci
                            npm run build-storybook
                            npx creevey --config creevey.config.ts --update

                            git checkout ${env.GIT_COMMIT}
                            npm ci
                            npm run build-storybook
                            npx creevey --config creevey.config.ts
                        """
                    } else {
                        // For regular branches, just run the tests
                        sh 'npx creevey --config creevey.config.ts'
                    }
                }
            }
            post {
                always {
                    junit '.creevey/report/junit.xml'
                    archiveArtifacts artifacts: '.creevey/report/**', allowEmptyArchive: true
                    archiveArtifacts artifacts: '.creevey/report.html', allowEmptyArchive: true

                    script {
                        if (env.CHANGE_ID) {
                            // For PRs, add a comment with results
                            def summary = readJSON file: '.creevey/report/summary.json'
                            def failed = summary.failed ?: 0

                            def comment = "## Visual Regression Test Results\n\n"
                            if (failed > 0) {
                                comment += "❌ **${failed} visual differences detected**\n\n"
                                comment += "Please check the [test artifacts](${BUILD_URL}artifact/) for details.\n"
                            } else {
                                comment += "✅ **No visual differences detected**\n"
                            }

                            // Using GitHub API to add comment
                            withCredentials([string(credentialsId: 'github-token', variable: 'GITHUB_TOKEN')]) {
                                sh """
                                    curl -X POST \
                                    -H "Authorization: token ${GITHUB_TOKEN}" \
                                    -H "Accept: application/vnd.github.v3+json" \
                                    https://api.github.com/repos/${env.CHANGE_AUTHOR}/${env.CHANGE_REPOSITORY}/issues/${env.CHANGE_ID}/comments \
                                    -d '{"body": "${comment}"}'
                                """
                            }
                        }
                    }
                }
            }
        }
    }
}
```

## Azure DevOps

Create an `azure-pipelines.yml` file:

```yaml
trigger:
  - main

pr:
  - main

pool:
  vmImage: 'ubuntu-latest'

variables:
  NODE_VERSION: '18.x'

jobs:
  - job: visual_regression
    displayName: 'Visual Regression Tests'

    steps:
      - task: NodeTool@0
        inputs:
          versionSpec: '$(NODE_VERSION)'
        displayName: 'Install Node.js'

      - task: Cache@2
        inputs:
          key: 'npm | "$(Agent.OS)" | package-lock.json'
          restoreKeys: |
            npm | "$(Agent.OS)"
          path: '$(npm_config_cache)'
        displayName: 'Cache npm packages'

      - script: npm ci
        displayName: 'Install dependencies'

      - script: npx playwright install --with-deps chromium
        displayName: 'Install browser dependencies'

      - script: npm run build-storybook
        displayName: 'Build Storybook'

      - script: npx creevey --config creevey.config.ts
        displayName: 'Run Creevey tests'

      - task: PublishTestResults@2
        inputs:
          testResultsFormat: 'JUnit'
          testResultsFiles: '.creevey/report/junit.xml'
          mergeTestResults: true
          testRunTitle: 'Visual Regression Tests'
        displayName: 'Publish test results'
        condition: always()

      - task: PublishPipelineArtifact@1
        inputs:
          targetPath: '.creevey/report'
          artifact: 'creevey-report'
          publishLocation: 'pipeline'
        displayName: 'Publish artifacts'
        condition: always()

      - task: PublishPipelineArtifact@1
        inputs:
          targetPath: '.creevey/report.html'
          artifact: 'creevey-report-html'
          publishLocation: 'pipeline'
        displayName: 'Publish HTML report'
        condition: always()

  # For PRs, add a comparison job
  - job: visual_regression_comparison
    displayName: 'Compare with target branch'
    condition: and(succeeded(), eq(variables['Build.Reason'], 'PullRequest'))

    steps:
      - task: NodeTool@0
        inputs:
          versionSpec: '$(NODE_VERSION)'
        displayName: 'Install Node.js'

      - checkout: self
        fetchDepth: 0
        displayName: 'Checkout with history'

      - script: npm ci
        displayName: 'Install dependencies'

      - script: npx playwright install --with-deps chromium
        displayName: 'Install browser dependencies'

      - script: |
          # Checkout target branch and generate reference images
          git checkout $(System.PullRequest.TargetBranch)
          npm ci
          npm run build-storybook
          npx creevey --config creevey.config.ts --update

          # Return to PR branch and run tests
          git checkout $(Build.SourceVersion)
          npm ci
          npm run build-storybook
          npx creevey --config creevey.config.ts
        displayName: 'Run comparison tests'

      - task: PublishTestResults@2
        inputs:
          testResultsFormat: 'JUnit'
          testResultsFiles: '.creevey/report/junit.xml'
          mergeTestResults: true
          testRunTitle: 'Comparison Tests'
        displayName: 'Publish test results'
        condition: always()

      - task: PublishPipelineArtifact@1
        inputs:
          targetPath: '.creevey/report'
          artifact: 'comparison-report'
          publishLocation: 'pipeline'
        displayName: 'Publish artifacts'
        condition: always()
```

## Best Practices

### Optimizing CI Performance

1. **Use Caching Effectively**

   - Cache node_modules and browser binaries
   - Cache Storybook build outputs if possible

2. **Parallelize Tests**

   - Split tests across multiple workers with `--workers` flag
   - Use test sharding for large test suites across multiple runners

3. **Minimize Resource Usage**

   - Use headless browser mode
   - Optimize Storybook build time with production flag

4. **Docker Best Practices**
   - Use official Playwright Docker images
   - Mount volumes for artifacts and screenshots
   - Set appropriate resource limits

### Effective Configuration

```typescript
// creevey.config.ci.ts - Optimized for CI environments
import { defineConfig } from 'creevey';
import { PlaywrightWebdriver } from 'creevey/playwright';

export default defineConfig({
  // Use Playwright webdriver
  webdriver: PlaywrightWebdriver,

  // Configure browsers for CI
  browsers: {
    chromium: {
      browserName: 'chromium',
      viewport: { width: 1280, height: 720 },
      headless: true,
      // Optimize for CI performance
      playwrightOptions: {
        args: [
          '--disable-gpu',
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-extensions',
        ],
      },
    },
  },

  // Set Storybook URL (built version)
  storybookUrl: 'http://localhost:6006',

  // Configure reporting
  reportDir: '.creevey/report',
  screenDir: '.creevey/images',

  // CI-specific settings
  maxWorkers: 4,
  differenceThreshold: 0.01, // Adjust sensitivity

  // Skip specific tests that might be flaky in CI
  tests: {
    'path/to/flaky/component': {
      skip: true,
    },
  },
});
```

### Screenshot Stability Tips

1. **Consistent Viewport Sizes**

   - Always specify exact viewport dimensions
   - Use standard sizes across all tests

2. **Handle Dynamic Content**

   - Mock dates, random values, and animations
   - Add data attributes for better element selection

3. **Wait Appropriately**

   - Use explicit waits for elements to be fully rendered
   - Wait for network requests to complete

4. **Isolate Tests**
   - Avoid test interdependencies
   - Reset state between tests

### Reporting and Analysis

1. **Generate Comprehensive Reports**

   - Use multiple reporters: `dot,html,junit`
   - Save artifacts even on test failure

2. **PR Integration**

   - Comment results on PRs
   - Include links to visual reports

3. **Track Historical Results**

   - Store reports across builds
   - Track visual coverage metrics

4. **Review Process**
   - Establish a process for reviewing visual changes
   - Consider approval workflows for intentional changes

### Example: Complete GitHub PR Comment with Image Diffs

For advanced PR feedback, you can generate and post visual diffs directly in PR comments:

```yaml
- name: Generate PR comment with diffs
  if: github.event_name == 'pull_request' && failure()
  run: |
    # Find failed tests with diffs
    FAILED_TESTS=$(find .creevey/report -name "*.diff.png" -type f | sort)

    if [ -n "$FAILED_TESTS" ]; then
      # Create markdown for the comment
      echo "## Visual Regression Test Results" > comment.md
      echo "" >> comment.md
      echo "❌ **Visual differences detected in $(echo "$FAILED_TESTS" | wc -l) tests**" >> comment.md
      echo "" >> comment.md
      
      # For each failed test, prepare diff image for upload
      mkdir -p ./diffs
      count=0
      
      for diff in $FAILED_TESTS; do
        if [ $count -lt 5 ]; then  # Limit to 5 images to keep comment size reasonable
          filename=$(basename "$diff")
          cp "$diff" "./diffs/$filename"
          echo "### $(dirname "$diff" | sed 's/.*\///')" >> comment.md
          echo "![Diff](${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}/artifacts/diff-$filename)" >> comment.md
          echo "" >> comment.md
          count=$((count+1))
        fi
      done
      
      if [ $(echo "$FAILED_TESTS" | wc -l) -gt 5 ]; then
        echo "... and $(( $(echo "$FAILED_TESTS" | wc -l) - 5 )) more differences" >> comment.md
      fi
      
      echo "View full report in the artifacts." >> comment.md
    fi

- name: Upload diff images
  if: github.event_name == 'pull_request' && failure()
  uses: actions/upload-artifact@v3
  with:
    name: visual-diffs
    path: ./diffs/

- name: Post comment to PR
  if: github.event_name == 'pull_request' && failure()
  uses: actions/github-script@v6
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    script: |
      const fs = require('fs');
      if (fs.existsSync('./comment.md')) {
        const comment = fs.readFileSync('./comment.md', {encoding: 'utf8'});
        github.rest.issues.createComment({
          issue_number: context.issue.number,
          owner: context.repo.owner,
          repo: context.repo.repo,
          body: comment
        });
      }
```
