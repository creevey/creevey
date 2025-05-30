# PROJECT BRIEF: CREEVEY

## PROJECT OVERVIEW

**Creevey** is a cross-browser screenshot testing tool specifically designed for Storybook with a fancy UI Runner. It enables visual regression testing by capturing screenshots of Storybook stories and comparing them across different browsers and environments.

### PROJECT IDENTITY

- **Name**: Creevey
- **Version**: 0.10.0-beta.47
- **Type**: Testing Tool / Storybook Addon
- **License**: MIT
- **Repository**: github.com:creevey/creevey
- **Author**: Dmitriy Lazarev <w@kich.dev>

### CORE PURPOSE

Enable developers to automatically detect visual regressions in their UI components by comparing screenshots across different browsers and versions. The tool integrates seamlessly with Storybook, using existing stories as the foundation for visual tests.

## KEY FEATURES

### PRIMARY CAPABILITIES

- 📚 **Storybook Integration**: Native integration with Storybook >= 7.x.x
- 📜 **Story-based Testing**: Uses existing Storybook stories as test cases
- ✏️ **Interactive Tests**: Supports writing interaction tests for complex UI scenarios
- ✨ **Fancy UI Runner**: Provides an intuitive web-based interface for test management
- 🐳 **Docker Support**: Built-in Docker integration for consistent testing environments
- ⚔️ **Cross-browser Testing**: Supports multiple browsers (Chrome, Firefox, Safari, etc.)
- 🔥 **Hot Reloading**: Tests automatically reload when code changes
- ⚙️ **CI Ready**: Designed for continuous integration workflows

### TESTING CAPABILITIES

- Visual regression detection through screenshot comparison
- Cross-browser compatibility testing
- Interaction testing for dynamic UI components
- Batch test execution with approval workflows
- Custom capture element selection
- Configurable difference thresholds
- Test retry mechanisms for flaky tests

## TECHNICAL ARCHITECTURE

### CORE COMPONENTS

1. **CLI Tool** (`dist/cli.js`) - Command-line interface for test execution
2. **Storybook Addon** - Manager, preview, and preset components
3. **Server Components** - Master/worker architecture for test execution
4. **Client Components** - Web UI for test management and results viewing
5. **Browser Drivers** - Playwright and Selenium WebDriver support

### BROWSER SUPPORT

- **Playwright**: Primary driver for modern browser testing
- **Selenium WebDriver**: Legacy support and grid integration
- **Docker**: Containerized browser environments
- **Grid Support**: LambdaTest, BrowserStack, SauceLabs integration

### TECHNOLOGY STACK

- **Runtime**: Node.js >= 18.x.x
- **TypeScript**: Full TypeScript support
- **React**: UI components built with React 18
- **Vite**: Build tool and development server
- **Storybook**: Integration platform
- **Testing**: Vitest for unit tests

## DEVELOPMENT WORKFLOW

### BUILD SYSTEM

- **Build**: TypeScript compilation with Vite
- **Development**: Concurrent client, Storybook, and Creevey servers
- **Testing**: Vitest for unit tests, ESLint for code quality
- **Distribution**: npm package with CLI, addon, and library exports

### EXPORT STRUCTURE

- Main library entry (`./dist/index.js`)
- Playwright integration (`./playwright`)
- Selenium integration (`./selenium`)
- Storybook addon components (`./manager`, `./preview`, `./preset`)
- CLI tool (`creevey` command)

## PROJECT GOALS

### PRIMARY OBJECTIVES

1. **Visual Quality Assurance**: Prevent visual regressions in UI components
2. **Developer Experience**: Provide intuitive tools for visual testing
3. **CI/CD Integration**: Enable automated visual testing in build pipelines
4. **Cross-browser Compatibility**: Ensure consistent UI across browsers
5. **Storybook Ecosystem**: Enhance Storybook with visual testing capabilities

### QUALITY STANDARDS

- Comprehensive visual regression detection
- Fast and reliable test execution
- User-friendly test management interface
- Robust error handling and retry mechanisms
- Extensive browser and environment support

## INSTALLATION & USAGE

### PREREQUISITES

- Node.js >= 18.x.x
- Storybook >= 7.x.x
- Docker (for containerized testing)

### BASIC SETUP

1. Install package: `yarn add -D creevey`
2. Add addon to Storybook configuration
3. Start UI Runner: `yarn creevey test -s --ui`
4. Open browser to [http://localhost:3000](http://localhost:3000)

### CONFIGURATION

- Config files in `.creevey/` directory
- Support for GitHub, GitLab, and hybrid configurations
- Customizable capture elements and test parameters
- Configurable difference detection thresholds

## SUCCESS METRICS

### ADOPTION INDICATORS

- npm download statistics (tracked via shields.io)
- Community contributions and issues
- Integration with popular UI libraries
- Usage by notable companies (Whisk, SKB Kontur, ABBYY)

### QUALITY METRICS

- Test execution speed and reliability
- False positive rate in visual comparisons
- User satisfaction with UI Runner interface
- CI/CD pipeline integration success rate

---

**Named after Colin Creevey** - A character from the Harry Potter universe known for his enthusiasm for photography, reflecting the tool's focus on capturing and comparing visual elements.
