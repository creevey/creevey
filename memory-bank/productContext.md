# Product Context

## Market Context

Creevey operates in the visual regression testing space for frontend development, specifically targeting Storybook users. This space includes several competing tools such as:

- **Loki**: Screenshot testing tool for Storybook, but lacks cross-browser testing capabilities and UI runner
- **Storyshots**: Part of Storybook, provides snapshot testing but not visual regression
- **Chromatic**: SaaS solution for visual testing with cloud-based infrastructure
- **Percy/Happo**: SaaS platforms for visual testing with cloud infrastructure
- **BackstopJS**: Generic visual regression testing tool, not specifically for Storybook
- **Hermione**: Visual regression testing framework based on WebdriverIO

## Competitive Advantages

1. **UI Runner**: Creevey offers a dedicated UI for test management and result visualization
2. **Cross-browser Testing**: Supports multiple browsers via Selenium or Playwright
3. **Docker Integration**: Built-in Docker support for isolated browser environments
4. **Hot-reloading**: Supports test hot-reloading for rapid development
5. **Interactive Tests**: Allows writing complex interaction tests with WebDriver API
6. **Open Source**: Fully open-source solution with no usage limits
7. **Integration**: Tight integration with Storybook as an addon
8. **Flexibility**: Supports both Selenium and Playwright WebDrivers

## User Needs

Creevey addresses several key needs for frontend developers:

1. **Visual Consistency**: Ensuring components look the same across browsers and devices
2. **Regression Prevention**: Catching unintended visual changes during development
3. **Interaction Testing**: Testing interactive components beyond static appearance
4. **Developer Experience**: Providing a seamless workflow for visual testing
5. **CI Integration**: Supporting automated visual testing in CI pipelines
6. **Cross-browser Validation**: Ensuring consistency across different browsers
7. **Workflow Integration**: Fitting into existing Storybook-based development workflows

## Use Cases

1. **Component Development**: Testing new component variants during development
2. **Refactoring**: Ensuring visual consistency when refactoring component code
3. **Browser Compatibility**: Verifying components work across different browsers
4. **Responsive Design**: Testing components at different viewport sizes
5. **Theme Testing**: Validating components with different themes/styles
6. **Interaction Flows**: Testing multi-step interactions within components
7. **CI Validation**: Automated visual regression testing in CI pipelines

## Product Evolution

Based on the TODO.md file, Creevey has evolved through multiple iterations with significant feature additions:

- Starting as a basic screenshot testing tool
- Adding parallel test execution capabilities
- Developing the UI Runner interface
- Integrating with Storybook as an addon
- Supporting multiple WebDriver implementations
- Adding Docker support for browser isolation
- Improving performance and reliability

## User Demographics

Creevey targets:

- Frontend developers working with component-based architectures
- Teams using Storybook for component development and documentation
- QA engineers responsible for UI testing
- Development teams concerned with visual consistency across browsers
- Organizations preferring open-source tools over SaaS solutions
