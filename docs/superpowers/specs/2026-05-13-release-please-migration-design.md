# Design: Migrate Release Workflow to release-please

**Date:** 2026-05-13  
**Status:** Approved  
**Goal:** Replace the manual direct-push release workflow with a protected-branch-compatible release-please setup.

## Problem

The current release workflow (`.github/workflows/release.yml`) pushes version bumps and changelog updates directly to `master`. The `master` branch is now protected and requires changes through a pull request. The release workflow fails with:

```
remote: error: GH006: Protected branch update failed for refs/heads/master.
remote: - Changes must be made through a pull request.
error: failed to push some refs to 'https://github.com/creevey/creevey'
```

## Solution: release-please

Google's [release-please](https://github.com/googleapis/release-please) is designed specifically for protected branches.

### How It Works

1. On every push to `master`, release-please scans conventional commits since the last release (`feat:`, `fix:`, etc.)
2. If there are releasable changes, it opens (or updates) a **"Release PR"** targeting `master`
3. The Release PR contains bumped `package.json`, regenerated `CHANGELOG.md`, and manifest updates
4. A maintainer merges the Release PR normally (through the PR workflow, satisfying branch protection)
5. On merge, release-please creates the git tag and GitHub Release via GitHub API
6. The tag push triggers the existing `publish.yml` workflow to publish to npm

### Key Benefits

- **No direct push to protected branch** — everything goes through PR review/CI
- **Native protected branch support** — never pushes to `master`, uses GitHub API for tags
- **Familiar conventional commit workflow** — the project already uses `git-cz` and conventional commits
- **Minimal disruption to publish pipeline** — `publish.yml` stays as-is

## Architecture

```
Push to master (feat: or fix: commit)
  |
  v
Release Please workflow (automatic)
  |
  v
Creates/updates Release PR
  |
  v
Maintainer merges PR (branch protection rules satisfied)
  |
  v
release-please creates tag + GitHub Release (via GitHub API)
  |
  v
tag push triggers publish.yml
  |
  v
Build -> Verify -> npm publish
```

## New Configuration Files

### `release-please-config.json`

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

- `release-type: "node"` — bumps `package.json` version, handles `CHANGELOG.md`
- `include-component-in-tag: false` — tags will be `v0.10.36` not `creevey-v0.10.36`
- `changelog-sections` — maps commit types to changelog sections (similar to git-cliff config)

### `.release-please-manifest.json`

```json
{
  ".": "0.10.35"
}
```

- Records the last released version
- release-please uses this to calculate the next version
- Must match the current `package.json` version

### `.github/workflows/release.yml` (new)

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

## Files Changed

| File                            | Action  | Reason                                                   |
| ------------------------------- | ------- | -------------------------------------------------------- |
| `.github/workflows/release.yml` | Replace | Old manual workflow incompatible with protected branches |
| `release-please-config.json`    | Create  | release-please package-level configuration               |
| `.release-please-manifest.json` | Create  | Tracks last released version                             |

## Files Potentially Removed Later

| File                                                              | Action                  | Reason                                              |
| ----------------------------------------------------------------- | ----------------------- | --------------------------------------------------- |
| `cliff.toml`                                                      | Can remove              | git-cliff becomes unused in release-please workflow |
| `package.json` devDependency `git-cliff`                          | Can remove (eventually) | Only used in old release workflow                   |
| `package.json` scripts `changelog:preview` / `changelog:generate` | Can remove (eventually) | Only used with git-cliff                            |

## Dependencies

- Node.js 20+ (same as current)
- No new npm dependencies needed (uses GitHub Action, not npm package)

## Authentication & Tokens

**Required Secret:** `RELEASE_PLEASE_TOKEN`

- release-please **must** use a PAT or GitHub App token, not `secrets.GITHUB_TOKEN`
- Reason: `GITHUB_TOKEN`-triggered events do not cascade — `publish.yml` (triggers on tags) would not run when release-please creates a tag with `GITHUB_TOKEN`
- Using a PAT ensures the tag push triggers downstream workflows

**Token permissions needed:**

- `contents: write` (create tags, create release)
- `pull-requests: write` (create/update Release PR)

## Manual Setup Required

1. Create a GitHub Personal Access Token (classic) or GitHub App:
   - If PAT: scope `repo` (full control of private repositories)
   - If GitHub App: create app, generate private key, install on repo
2. Add the token as repository secret: `Settings → Secrets and variables → Actions → New repository secret`
   - Name: `RELEASE_PLEASE_TOKEN`
   - Value: your PAT or App token
3. In repository settings, enable: `Settings → Actions → General → Allow GitHub Actions to create and approve pull requests` (required for release-please to create PRs)

## Behaviors to Note

- If a Release PR is already open and new commits land on `master`, the PR is automatically updated
- Closing the Release PR cancels the pending release
- `release-please` uses the commit messages to determine version bump (minor for `feat:`, patch for `fix:`)
- It follows semantic versioning by parsing conventional commits
- The `chore(release):` commits will be correctly excluded from the changelog (release-lease's default `skip-github-release` logic skips bot commits)

## Rollback Plan

If release-please causes issues:

1. Revert the `.github/workflows/release.yml` to the previous version (from git history)
2. Delete `release-please-config.json` and `.release-please-manifest.json`
3. Remove the `RELEASE_PLEASE_TOKEN` secret
4. The old `publish.yml` continues working independently

## Testing

After deployment:

1. Merge a `feat:` or `fix:` commit to `master`
2. Check that a Release PR is created automatically
3. Review the Release PR for correct version bump and changelog
4. Merge the Release PR
5. Verify that a tag `vX.Y.Z` is created
6. Verify that the `publish.yml` workflow triggers and publishes to npm

## Appendix: Comparison with Alternatives

| Approach                      | Complexity                       | Protected Branch Compatible | Preserves git-cliff | Automation Level  |
| ----------------------------- | -------------------------------- | --------------------------- | ------------------- | ----------------- |
| **release-please** (selected) | Low (1 workflow, 2 config files) | Native                      | No (uses built-in)  | Automatic on push |
| PR + Auto-Merge (custom)      | Medium (2 workflows)             | Yes                         | Yes                 | Manual dispatch   |
| Ruleset Bypass                | Low admin overhead               | Yes with setup              | Yes                 | Direct push       |
