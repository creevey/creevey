# Release Please Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use **superpowers:subagent-driven-development** (recommended) or **superpowers:executing-plans** to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the manual direct-push release workflow with a protected-branch-compatible release-please setup.

**Architecture:** Google's release-please-action runs on every push to master, automatically opening/updating a Release PR. Merging the PR creates the tag and GitHub Release via API — no direct push to protected branch. The existing `publish.yml` triggers on tags as before.

**Tech Stack:** GitHub Actions, release-please-action@v4, Node.js (project already uses Node 20)

---

## Files Changed

| File                            | Action  | Purpose                                                   |
| ------------------------------- | ------- | --------------------------------------------------------- |
| `.release-please-manifest.json` | Create  | Tracks last released version for release-please           |
| `release-please-config.json`    | Create  | Configures release-please packages and changelog sections |
| `.github/workflows/release.yml` | Replace | Old manual workflow → release-please automatic workflow   |
| `memories/workflow.md`          | Modify  | Update documentation to describe new release process      |

---

### Task 1: Create `.release-please-manifest.json`

**Files:**

- Create: `.release-please-manifest.json`

- [ ] **Step 1: Write the manifest file**

```json
{
  ".": "0.10.35"
}
```

- [ ] **Step 2: Verify the version matches package.json**

Run:

```bash
node -p "require('./package.json').version"
```

Expected output: `0.10.35`  
The manifest value MUST match. If it doesn't, update the manifest.

- [ ] **Step 3: Commit**

```bash
git add .release-please-manifest.json
git commit -m "chore(release): add release-please manifest"
```

---

### Task 2: Create `release-please-config.json`

**Files:**

- Create: `release-please-config.json`

- [ ] **Step 1: Write the config file**

```json
{
  "packages": {
    ".": {
      "release-type": "node",
      "package-name": "creevey",
      "changelog-sections": [
        { "type": "feat", "section": "Features", "hidden": false },
        { "type": "fix", "section": "Bug Fixes", "hidden": false },
        { "type": "docs", "section": "Documentation", "hidden": false },
        { "type": "perf", "section": "Performance Improvements", "hidden": false },
        { "type": "refactor", "section": "Code Refactoring", "hidden": false },
        { "type": "test", "section": "Tests", "hidden": false },
        { "type": "chore", "section": "Miscellaneous", "hidden": true }
      ],
      "include-component-in-tag": false
    }
  }
}
```

- [ ] **Step 2: Validate JSON syntax**

Run:

```bash
node --check release-please-config.json 2>/dev/null || node -e "JSON.parse(require('fs').readFileSync('release-please-config.json', 'utf8')); console.log('Valid JSON')"
```

Expected output: `Valid JSON`

- [ ] **Step 3: Commit**

```bash
git add release-please-config.json
git commit -m "chore(release): add release-please config"
```

---

### Task 3: Replace `.github/workflows/release.yml`

**Files:**

- Modify: `.github/workflows/release.yml` (full replacement)

- [ ] **Step 1: Replace the workflow file**

Write `.github/workflows/release.yml`:

```yaml
name: Release

on:
  push:
    branches:
      - master

permissions:
  contents: write
  pull-requests: write

jobs:
  release-please:
    runs-on: ubuntu-latest
    steps:
      - uses: googleapis/release-please-action@v4
        id: release
        with:
          token: ${{ secrets.RELEASE_PLEASE_TOKEN }}
          release-type: node
```

- [ ] **Step 2: Validate YAML syntax**

Run:

```bash
node -e "require('yaml')" 2>/dev/null && node -e "const yaml = require('yaml'); console.log('YAML module found')" || echo "Install yaml globally: npm install -g yaml"

# Alternative validation:
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/release.yml')); print('Valid YAML')"
```

Expected output: `Valid YAML`

- [x] **Step 3: Verify old git-cliff steps are removed**

Run:

```bash
grep -E "git-cliff|bump_type|workflow_dispatch|manual" .github/workflows/release.yml || echo "Old patterns not found — good"
```

Expected output: `Old patterns not found — good` (the file should have no references to the old workflow)

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/release.yml
git commit -m "chore(release): migrate to release-please workflow"
```

---

### Task 4: Update `memories/workflow.md`

**Files:**

- Read first: `memories/workflow.md`
- Modify: `memories/workflow.md` (release section)

- [ ] **Step 1: Read current memories/workflow.md**

Run:

```bash
cat memories/workflow.md
```

- [ ] **Step 2: Update the release process documentation**

Insert or replace the release process section. If no release section exists, add one near the top or in a "Release Process" section.

Add to `memories/workflow.md`:

```markdown
## Release Process

The project uses [release-please](https://github.com/googleapis/release-please) for automated releases.

### How it works

1. When a `feat:` or `fix:` commit is pushed to `master`, the release-please workflow (`.github/workflows/release.yml`) automatically creates or updates a Release PR.
2. The Release PR bumps `package.json` version, updates `CHANGELOG.md`, and tracks the version in `.release-please-manifest.json`.
3. A maintainer reviews and merges the Release PR through the normal PR review process.
4. On merge, release-please creates a git tag and GitHub Release via GitHub API.
5. The tag push triggers `.github/workflows/publish.yml` to build and publish to npm.

### Setup

- Requires a `RELEASE_PLEASE_TOKEN` repository secret (PAT with `repo` scope, or GitHub App token).
- Enable: `Settings → Actions → General → Allow GitHub Actions to create and approve pull requests`.

### Legacy release workflow

The previous manual release workflow (using `git-cliff` and `workflow_dispatch`) has been replaced. The `git-cliff` configuration (`cliff.toml`) and related scripts were removed during the cleanup.
```

- [ ] **Step 3: Commit**

```bash
git add memories/workflow.md
git commit -m "docs: update release process in memories"
```

---

## Verification Steps

After all commits are complete:

### Pre-merge checks

- [ ] Verify all three config files exist:

```bash
ls -la .release-please-manifest.json release-please-config.json .github/workflows/release.yml
```

Expected: All three files exist.

- [ ] Verify the manifest version matches package.json:

```bash
jq -r '.["."]' .release-please-manifest.json
node -p "require('./package.json').version"
```

Expected: Both output `0.10.35`.

- [ ] Lint the YAML workflow:

```bash
yamllint .github/workflows/release.yml 2>/dev/null || echo "yamllint not installed, skipping"
```

Or use Python yaml check.

### Post-deployment (after merging to master)

- [ ] Push the changes to a new branch and open a PR:

```bash
git checkout -b chore/release-please-migration
git push origin chore/release-please-migration
```

Then open a PR manually or:

```bash
gh pr create --title "chore(release): migrate to release-please" --body "Migrates the release workflow to use Google release-please for protected branch compatibility."
```

- [ ] After the PR merges to `master`, verify:
  - A Release PR is created automatically (within a few minutes)
  - The Release PR includes the correct version bump
  - Merging the Release PR creates a tag `v0.10.36`
  - The `publish.yml` workflow triggers and publishes successfully

---

## Spec Coverage Checklist

| Spec Requirement                                                     | Task                     |
| -------------------------------------------------------------------- | ------------------------ |
| Create `.release-please-manifest.json` with version 0.10.35          | Task 1                   |
| Create `release-please-config.json` with node release-type           | Task 2                   |
| Replace `.github/workflows/release.yml` with release-please workflow | Task 3                   |
| Update project documentation (memories)                              | Task 4                   |
| Trigger on push to master (not manual)                               | Task 3                   |
| Use `RELEASE_PLEASE_TOKEN` (not `GITHUB_TOKEN`)                      | Task 3                   |
| Keep `publish.yml` unchanged                                         | Not modified in any task |
| `include-component-in-tag: false` for clean tags                     | Task 2                   |

---

## Placeholder Scan

- No "TBD", "TODO", or "implement later" strings in any task.
- All file paths are exact.
- All commands include expected output.
- No steps reference undefined variables.

---

## Rollback Instructions

If the migration causes issues after deployment:

```bash
# Revert the three commits
git revert HEAD~2  # manifest commit
git revert HEAD~1  # config commit
git revert HEAD    # workflow commit
# Note: memories commit is last, revert manually if needed
```

Then restore the old `release.yml` from git history:

```bash
git show <old-commit>:.github/workflows/release.yml > .github/workflows/release.yml
git commit -m "revert: restore old release workflow"
```
