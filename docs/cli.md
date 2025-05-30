## Creevey CLI Commands and Options

Creevey provides two main commands for different purposes:

### Commands

#### `creevey test [options]`

Run visual regression tests.

**Options:**

- `--ui` — Launch web UI for running tests and reviewing test results
- `-s, --storybook-start [cmd]` — Start Storybook automatically (optional command can be specified)
- `-c, --config <config>` — Path to config file (default: `.creevey/config.ts` or `creevey.config.ts`)
- `-d, --debug` — Enable debug mode (also enables recording video and traces if Playwright is used)
- `-p, --port <port>` — Port for UI server (default: `3000`)
- `--fail-fast` — Stop tests after first failure
- `--report-dir <dir>` — Directory for test reports
- `--screen-dir <dir>` — Directory for reference images
- `--storybook-url <url>` — Storybook server URL
- `--storybook-port <port>` — Storybook server port
- `--reporter <reporter>` — **[DEPRECATED]** Use config file instead
- `--odiff` — Use odiff for image comparison
- `--trace` — Enable trace mode (more verbose than debug)
- `--no-docker` — Disable Docker usage

**Examples:**

```bash
# Run tests with UI
creevey test --ui

# Start Storybook automatically and run tests
creevey test -s --ui

# Run tests with custom config and debug mode
creevey test -c ./my-config.ts --debug

# Run tests with fail-fast mode
creevey test --fail-fast

# Run tests without Docker
creevey test --no-docker
```

#### `creevey report [reportDir]`

Launch web UI to review and approve test results from a previous test run.

**Options:**

- `-c, --config <config>` — Path to config file
- `-p, --port <port>` — Port for UI server (default: `3000`)
- `--screen-dir <dir>` — Directory for reference images

**Examples:**

```bash
# Launch report UI with default report directory
creevey report

# Launch report UI with specific report directory
creevey report ./custom-report

# Launch report UI on custom port
creevey report -p 8080
```

### Global Options

These options are available for all commands:

- `--help, -h` — Show help information
- `--version, -v` — Show version information

### Migration Notes

- The `--reporter` option has been deprecated. Configure reporters in your config file instead.
- The `-u, --update` option has been removed. Use the `report` command instead.
