# Creevey Development Guidelines

## Commands

- **Build**: `yarn build` (clean, build client, compile TypeScript, copy files)
- **Lint**: `yarn lint` (runs tsc, eslint, prettier checks)
- **Fix**: `yarn fix` (auto-fix eslint and prettier issues)
- **Test**: `yarn test` (run all tests with vitest)
- **Single test**: `yarn test path/to/test.test.ts` (run specific test file)
- **Test watch**: `yarn test:watch` (watch mode for development)
- **Start dev**: `yarn start` (runs client, storybook, and creevey UI)

## Code Style

- **TypeScript**: Strict mode enabled, unused vars/params not allowed
- **Imports**: Use eslint-plugin-import-x, prefer named exports
- **Formatting**: Prettier with single quotes, 120 width, trailing commas
- **React**: Functional components with hooks, prop-types disabled
- **Naming**: camelCase for variables, PascalCase for components/types
- **Error handling**: Use try/catch with proper typing, avoid any types
- **File structure**: Group by feature, use index files for exports
- **Testing**: Vitest with .test.ts extension in tests/ directory

## Notes

- Node.js >=18 required
- Uses yarn package manager
- Husky pre-commit hooks run lint-staged
- Storybook integration for visual testing

## Memory Synchronization

**CRITICAL**: After making any changes to the project, you MUST update the files in `memories/` to reflect the current project state. The memories should always provide an accurate, up-to-date description of the project.

- Do not document summary about every minor change in memories
- Keep memories fresh and relevant to current project state
- Update memories when architectural changes occur
- Update memories when new patterns are established
- Update memories when significant features are added/removed
- This includes, but not limited, to any internal changes, that might affect the project's behavior and functionality

## Related Documentation

- `memories/memory.md` - Primary AI knowledge base
- `memories/architecture.md` - Technical architecture details
- `memories/workflow.md` - Development workflows and processes
- `memories/testing.md` - Testing strategies and patterns
- `memories/troubleshooting.md` - Common issues and solutions
- `docs/` - User-facing documentation
