# Creevey Project Brief

## Overview

Creevey is a cross-browser screenshot testing tool for Storybook with a fancy UI Runner. Named after Colin Creevey character from the Harry Potter universe, the tool allows developers to create and maintain visual regression tests for Storybook components.

## Core Features

- 📚 Integrates with Storybook
- 📜 Uses stories as tests
- ✏️ Allows write interaction tests
- ✨ Has fancy UI Runner
- 🐳 Supports Docker
- ⚔️ Cross-browsers testing
- 🔥 Tests hot-reloading
- ⚙️ CI Ready

## Technical Requirements

- Supported Storybook versions: >= 7.x.x
- Supported Node.js versions: >= 18.x.x
- Docker for running browsers (optional if using Selenium Grid)

## Project Structure

- The project is organized as a Node.js application
- Uses TypeScript for type safety
- Integrates with Storybook as an addon
- Supports both Selenium WebDriver and Playwright for browser automation
- Features a web-based UI for test execution and result visualization

## Target Users

- Frontend developers who need visual regression testing
- QA engineers testing UI components
- Teams that use Storybook for component development

## Use Cases

1. Running visual regression tests across multiple browsers
2. Capturing screenshots of UI components in different states
3. Writing interactive tests to verify component behavior
4. Comparing visual changes between builds
5. Approving visual changes through the UI
