# GitLab-Compatible JUnit Attachments Design

## Goal

Preserve Creevey's existing JUnit attachment output while adding the attachment format GitLab parses in unit test reports, so screenshot links appear in the GitLab test details view without breaking other JUnit consumers.

## Current State

- `src/server/reporters/junit.ts` writes screenshot attachments as testcase-level `<properties><property name="attachment" value="..." /></properties>`.
- Those property values are relative to the generated XML file.
- GitLab unit test reports do not parse JUnit `properties` for screenshots.
- GitLab expects attachment markers inside testcase-level `<system-out>` text using `[[ATTACHMENT|path]]`.
- GitLab resolves those attachment paths against the job artifact layout rooted at `$CI_PROJECT_DIR`.
- Creevey already saves screenshots under `reportDir/...` and the GitLab job already uploads `report/` as an artifact.

## Approved Approach

Use a dual-format output:

- Keep the existing attachment `<properties>` block unchanged for generic JUnit consumers.
- Add a testcase-level `<system-out>` block containing one GitLab attachment marker per screenshot.

This is the smallest compatible fix because it preserves current output and adds the GitLab-specific format GitLab documents.

## Output Design

For each testcase with attachments:

1. Preserve the current `<properties>` block.
2. Add a `<system-out>` element directly under the same `<testcase>`.
3. Emit one attachment marker per line inside `system-out`.

Example:

```xml
<testcase classname="Button/primary" name="matches screenshot" time="1.23">
  <failure message="Images do not match">...</failure>
  <properties>
    <property name="attachment" value="Button/primary/chrome/button-actual-1.png" />
    <property name="attachment" value="Button/primary/chrome/button-diff-1.png" />
  </properties>
  <system-out>
    [[ATTACHMENT|report/Button/primary/chrome/button-actual-1.png]]
    [[ATTACHMENT|report/Button/primary/chrome/button-diff-1.png]]
  </system-out>
</testcase>
```

## Path Rules

Two path bases will intentionally coexist:

- JUnit property values remain relative to the report file. This preserves current behavior and existing tests.
- GitLab `[[ATTACHMENT|...]]` values are relative to the project root so they match GitLab artifact resolution.

For the current repo layout and CI job, GitLab attachment values should resolve to paths under `report/...`.

Implementation target:

- Property path: `relative(dirname(reportFile), attachmentAbsPath)`
- GitLab path: `relative(process.env.CI_PROJECT_DIR ?? process.cwd(), attachmentAbsPath)`

The resulting GitLab path must be normalized to forward slashes so the XML is stable across platforms and matches GitLab examples.

## Behavior Rules

- Emit `system-out` only when `test.attachments` is non-empty.
- Do not write suite-level `system-out` because GitLab does not parse attachments there.
- Do not change failure or error rendering.
- Do not add new reporter options for this fix.

## Test Plan

Update `tests/reporters/junit.test.ts` to verify:

- the existing attachment property output still exists
- testcase `system-out` is emitted when attachments exist
- `system-out` contains one `[[ATTACHMENT|...]]` marker per attachment
- GitLab markers include the `report/` prefix in the current output layout
- no testcase attachment `system-out` is emitted when attachments are empty or undefined

## Non-Goals

- No new configuration mode for selecting attachment output format.
- No attempt to support GitLab-specific path rewriting for artifacts stored outside the project directory.
- No changes to artifact upload settings in `.gitlab-ci.yml`, because the current job already uploads `report/`.

## Verification

Run the focused reporter test file after implementation:

```bash
yarn test tests/reporters/junit.test.ts
```
