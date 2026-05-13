# GitLab JUnit Attachments Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve Creevey's existing JUnit attachment properties while adding GitLab-compatible screenshot attachment tags in testcase `system-out` output.

**Architecture:** Keep the change confined to the JUnit reporter and its focused test file. The reporter will continue writing XML-relative `property name="attachment"` entries, and also emit GitLab `[[ATTACHMENT|...]]` markers using project-root-relative paths so GitLab can resolve files from uploaded `report/` artifacts.

**Tech Stack:** TypeScript, Vitest, Node.js `path` utilities, GitLab JUnit attachment format

---

## File Structure

- Modify: `src/server/reporters/junit.ts`
  - Add small path-formatting helpers.
  - Emit both generic JUnit attachment properties and GitLab testcase `system-out` attachment lines.
- Modify: `tests/reporters/junit.test.ts`
  - Preserve existing attachment-property assertions.
  - Add GitLab `system-out` assertions.
  - Add a repo-local report-path helper for `report/...` path verification.
- Modify: `memories/workflow.md`
  - Record that GitLab JUnit screenshot support relies on testcase `system-out` attachment tags in addition to the generic properties block.
- Modify: `memories/memory.md`
  - Record the dual-format JUnit attachment behavior for future CI/reporting work.

### Task 1: Expand Reporter Tests For Dual-Format Attachments

**Files:**

- Modify: `tests/reporters/junit.test.ts`
- Test: `tests/reporters/junit.test.ts`

- [ ] **Step 1: Add repo-local report output helpers for GitLab path assertions**

Update the test helpers so attachment tests can create a `junit.xml` file under the repo `report/` directory instead of only under `tmpdir()`. Extend cleanup to remove generated directories recursively.

```ts
import { readFileSync, unlinkSync, existsSync, rmSync } from 'fs';

const createdFiles: string[] = [];
const createdDirectories: string[] = [];

function tempRepoReportXmlPath(): string {
  const outputDir = join(process.cwd(), 'report', `junit-test-${randomUUID()}`);
  const outputFile = join(outputDir, 'junit.xml');
  createdDirectories.push(outputDir);
  createdFiles.push(outputFile);
  return outputFile;
}

afterEach(() => {
  for (const p of createdFiles.splice(0)) {
    if (existsSync(p)) unlinkSync(p);
  }
  for (const dir of createdDirectories.splice(0)) {
    if (existsSync(dir)) rmSync(dir, { recursive: true, force: true });
  }
});
```

- [ ] **Step 2: Write failing assertions for GitLab testcase attachments**

Add assertions to the existing screenshot-attachments section so one test verifies both formats are present and another verifies no testcase `system-out` attachment block is written when attachments are absent.

```ts
test('writes GitLab attachment markers in testcase system-out', () => {
  const out = tempRepoReportXmlPath();
  const reportDir = dirname(out);
  const absPath = join(reportDir, 'Button', 'primary', 'chrome', 'button-actual-1.png');
  const t = makeFakeTest({
    state: 'failed',
    images: { header: {} },
    attachments: [absPath],
  });

  const xml = runReporter([t], out);

  expect(xml).toContain('<system-out>');
  expect(xml).toContain('[[ATTACHMENT|report/');
  expect(xml).toContain('[[ATTACHMENT|report/junit-test-');
  expect(xml).toContain('Button/primary/chrome/button-actual-1.png]]');
  expect(xml).toContain('</system-out>');
});

test('does not write testcase attachment system-out when attachments are undefined', () => {
  const out = tempXmlPath();
  const xml = runReporter([makeFakeTest({ state: 'passed' })], out);

  expect(xml).not.toContain('[[ATTACHMENT|');
});
```

- [ ] **Step 3: Run the focused reporter tests to verify the new assertions fail**

Run: `yarn test tests/reporters/junit.test.ts`

Expected: FAIL with missing `<system-out>` or missing `[[ATTACHMENT|report/...]]` assertions, while existing attachment-property assertions still pass.

### Task 2: Implement Dual-Format Attachment Output In The Reporter

**Files:**

- Modify: `src/server/reporters/junit.ts`
- Test: `tests/reporters/junit.test.ts`

- [ ] **Step 1: Add small helpers for stable attachment path formatting**

Add helpers to keep the main testcase writer small and ensure GitLab paths use forward slashes.

```ts
import { dirname, relative, resolve, sep } from 'path';

private normalizePath(filePath: string): string {
  return filePath.split(sep).join('/');
}

private relativeAttachmentPath(absPath: string): string {
  return relative(dirname(this.reportFile), absPath);
}

  private gitlabAttachmentPath(absPath: string): string {
    return this.normalizePath(relative(process.env.CI_PROJECT_DIR ?? process.cwd(), absPath));
  }
```

- [ ] **Step 2: Add a dedicated writer for testcase attachments**

Extract the attachment rendering so both formats are emitted from one place.

```ts
private writeAttachments(attachments: string[]): void {
  if (attachments.length === 0) return;

  this.writeElement('properties', {}, () => {
    for (const absPath of attachments) {
      this.writeElement('property', {
        name: 'attachment',
        value: this.relativeAttachmentPath(absPath),
      });
    }
  });

  this.writeElement(
    'system-out',
    {},
    undefined,
    attachments.map((absPath) => `[[ATTACHMENT|${this.gitlabAttachmentPath(absPath)}]]`).join('\n'),
  );
}
```

- [ ] **Step 3: Replace the inline attachment block in `writeTasks` with the new helper**

Keep failure and error rendering unchanged and call the new writer only when attachments are present.

```ts
private writeTasks(tests: Map<string, FakeTest>): void {
  for (const [, test] of tests) {
    const classname = test.parent.title;
    const attachments = test.attachments ?? [];
    this.writeElement(
      'testcase',
      {
        classname,
        name: test.title,
        time: getDuration(test),
      },
      () => {
        if (test.state === 'failed') {
          this.writeFailureOrError(test);
        }
        this.writeAttachments(attachments);
      },
    );
  }
}
```

- [ ] **Step 4: Run the focused reporter tests to verify the implementation passes**

Run: `yarn test tests/reporters/junit.test.ts`

Expected: PASS with both the legacy property assertions and the new GitLab `system-out` attachment assertions.

### Task 3: Update Project Memory For GitLab JUnit Attachments

**Files:**

- Modify: `memories/workflow.md`
- Modify: `memories/memory.md`

- [ ] **Step 1: Update workflow memory with the GitLab attachment format detail**

Add a concise note near the existing GitLab CI/JUnit section.

```md
- The GitLab screenshot job relies on testcase-level `<system-out>` `[[ATTACHMENT|report/...]]` markers for screenshot links in GitLab's Tests UI, while Creevey also keeps generic JUnit attachment properties for other consumers.
```

- [ ] **Step 2: Update primary memory with the dual-format reporter behavior**

Add a concise CI integration note.

```md
8. Creevey's JUnit reporter keeps XML-relative `property name="attachment"` entries and also emits GitLab-compatible testcase `system-out` attachment markers using `report/...` paths so screenshot artifacts are visible in GitLab test details.
```

- [ ] **Step 3: Run the focused reporter tests again after memory updates**

Run: `yarn test tests/reporters/junit.test.ts`

Expected: PASS unchanged, confirming the documentation-only edits did not affect behavior.

## Self-Review

- Spec coverage: the plan preserves the existing properties block, adds testcase `system-out` attachment markers, uses `CI_PROJECT_DIR`-relative GitLab paths when available and otherwise falls back to project-root-relative paths, keeps failure/error output unchanged, and adds focused tests for presence and absence cases.
- Placeholder scan: no TODO/TBD markers or vague testing instructions remain.
- Type consistency: helper names, path rules, and assertion strings match the approved design and the current `JUnitReporter` structure.
