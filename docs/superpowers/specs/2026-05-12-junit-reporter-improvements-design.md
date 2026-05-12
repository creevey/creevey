# JUnit Reporter Improvements — Design Spec

**Date:** 2026-05-12  
**Scope:** Broad CI/CD compatibility (Jenkins, TeamCity, GitHub Actions, Allure, TestMo, etc.)  
**Target file:** `src/server/reporters/junit.ts`

---

## Problem

The current `JUnitReporter` produces minimal XML that fails to integrate properly with CI tools:

1. Same story running in multiple browsers merges into one `<testsuite>`, producing incorrect per-browser failure counts.
2. `<failure>` has no text body — stack traces and image diff errors are silently dropped.
3. All bad outcomes are counted as `failures`; the spec distinguishes `errors` (crashes) from `failures` (assertion mismatches).
4. Screenshot attachments (`test.attachments`) are never written to the XML.
5. `hostname` attribute is missing from `<testsuite>` (required by Jenkins JUnit plugin schema).
6. Sequential `id` attribute is missing from `<testsuite>`.
7. Empty `<failure/>` tags are written when `test.err` is `undefined`.

---

## Design

### 1. Suite Keying (multi-browser fix)

**Current:** `suites` and `suiteStartTimes` are both keyed by `test.parent.title` (story name).

**New:** Key by `"${suiteName}/${browserName}"` internally. When writing XML, use only the story name as the `<testsuite name>` attribute, so CI tools still group by story. Each browser produces its own `<testsuite>` block.

```
Internal key:  "Button/primary/chrome"
XML name attr: "Button/primary"
```

This also fixes `suiteStartTimes` which has the same collision.

Each `<testsuite>` additionally writes a `<properties>` block with `<property name="browser" value="chrome"/>` so CI tools can distinguish browsers within the same story group.

---

### 2. Failure Body & Error/Failure Distinction

**Detection logic:**
- `test.creevey.images` has entries → image diff mismatch → write `<failure>`
- `test.err` is set but no images → unexpected crash → write `<error>`

**`<failure>` element:**
```xml
<failure message="Images do not match">
header: expected and actual images differ
body: expected and actual images differ
</failure>
```
- `message` attribute: `"Images do not match"`
- Text body: one line per entry in `test.creevey.images`, formatted as `"${imageName}: ${image.error}"` (image names are screenshot step names, e.g. `"header"`, `"body"` for multi-step tests)

**`<error>` element:**
```xml
<error message="TypeError: Cannot read properties of null" type="Error">
TypeError: Cannot read properties of null
    at Object.&lt;anonymous&gt; (test.ts:12:5)
</error>
```
- `message` attribute: first line of `test.err`
- `type` attribute: `"Error"`
- Text body: full `test.err` string (XML-escaped)

**Counts:** `<testsuite>` and `<testsuites>` emit both `failures` and `errors` attributes, derived from the above distinction.

**Guard:** Only write `<failure>` or `<error>` when there is actual content. If `test.state === 'failed'` but both `test.creevey.images` is empty and `test.err` is undefined (defensive edge case), fall back to `<failure message="Test failed"/>`. No empty self-closing tags in the normal path.

---

### 3. Screenshot Attachments

For every `<testcase>` with `test.attachments` entries, write a `<properties>` block with one `<property name="attachment"/>` per file:

```xml
<testcase name="primary" classname="Button/primary" time="1.234">
  <failure message="Images do not match">chrome: ...</failure>
  <properties>
    <property name="attachment" value="Button/primary/chrome/button-actual-1.png"/>
    <property name="attachment" value="Button/primary/chrome/button-expect-1.png"/>
    <property name="attachment" value="Button/primary/chrome/button-diff-1.png"/>
  </properties>
</testcase>
```

- Paths are **relative to the XML file** (`path.relative(reportDir, absolutePath)`)
- `reportDir` is already available via constructor `options.reportDir`
- Passing tests also get their `actual` screenshot attached (for visual audit in CI)
- If `test.attachments` is empty or undefined, no `<properties>` block is written

---

### 4. Spec Attribute Additions

**`hostname` on `<testsuite>`**
```xml
<testsuite name="Button/primary" hostname="build-agent-01" ...>
```
- Value: `os.hostname()` from Node's built-in `os` module
- Required by Jenkins JUnit plugin schema; useful for distributed CI runs

**Sequential `id` on `<testsuite>`**
```xml
<testsuite name="Button/primary" id="0" ...>
<testsuite name="Button/hover" id="1" ...>
```
- Zero-indexed, derived from suite order in `onFinished()`

---

### 5. `writeElement` extension for text content

The current `writeElement` only supports attributes and child elements. Failure/error text bodies require writing escaped text content between tags.

Add an optional `textContent` parameter (or a dedicated `writeTextElement` helper) to `writeElement`:

```ts
private writeElement(
  name: string,
  attrs: Record<string, string | number | undefined>,
  children?: () => void,
  textContent?: string,
): void
```

When `textContent` is provided and no `children` callback is given, write the text between the open and close tags (XML-escaped).

---

## Data Flow

```
runner.ts emits TEST_FAIL/TEST_PASS with FakeTest
  │
  ├── FakeTest.creevey.images  → <failure> text body (image errors)
  ├── FakeTest.err             → <error> element (crash errors)
  ├── FakeTest.attachments     → <properties name="attachment"> (relative paths)
  ├── FakeTest.parent.title    → suite name (XML), part of internal key
  └── FakeTest.creevey.browserName → part of internal key + <property name="browser">
```

---

## What Is Not Changing

- `classnameTemplate` — deferred (no concrete use case yet)
- `<system-out>` / `<system-err>` — no console log capture in Creevey's test model
- Self-closing elements for passing tests — current approach is correct per spec
- `writeElement` indentation logic — unchanged

---

## Files Changed

| File | Change |
|------|--------|
| `src/server/reporters/junit.ts` | All changes above |

No changes to public API, config schema, or other reporters.
