# UI Architecture

## Overview

Creevey provides a sophisticated web-based UI for test visualization and management. The UI is built using React and follows a component-based architecture with clear separation of concerns. It communicates with the server through WebSockets for real-time updates and provides an intuitive interface for running tests and reviewing results.

## Core Components

### 1. Main Application Structure

- **`CreeveyApp.tsx`**: The main application component that orchestrates the entire UI
- **`CreeveyContext.tsx`**: Provides context for sharing state across components
- **`KeyboardEventsContext.tsx`**: Handles keyboard interactions for navigation and actions
- **`CreeveyLoader.tsx`**: Handles initial loading and data fetching

### 2. Sidebar Navigation

- **`SideBar/`**: Directory containing sidebar components
  - **`SideBar.tsx`**: Main sidebar component for test navigation
  - **`SideBarHeader.tsx`**: Header with controls for test filtering and searching
  - **`SideBarFooter.tsx`**: Footer with status information and actions
  - **`TestLink.tsx`**: Component for individual test representation
  - **`SuiteLink.tsx`**: Component for test suite representation
  - **`Search.tsx`**: Search functionality for tests
  - **`TestStatusIcon.tsx`**: Visual indicator for test status
  - **`Toggle.tsx`**: Toggle switch UI component

### 3. Results Visualization

- **`ResultsPage.tsx`**: Main component for displaying test results
- **`ImagesView/`**: Directory with image comparison visualization components
  - **`ImagesView.tsx`**: Container for different image view modes
  - **`SideBySideView.tsx`**: Compare images side by side
  - **`SlideView.tsx`**: Slide between expected and actual images
  - **`SwapView.tsx`**: Toggle between expected and actual images
  - **`BlendView.tsx`**: Blend expected and actual images

### 4. Shared Components

- **`components/`**: Directory with shared UI components
  - **`PageHeader/`**: Header components
  - **`PageFooter/`**: Footer components

### 5. Client API

- **`creeveyClientApi.ts`**: Interface for communication with the server
- **`helpers.ts`**: Utility functions for data manipulation and state management
- **`viewMode.ts`**: Manages different visualization modes

## Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                             CreeveyApp                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌───────────────┐                              ┌────────────────┐      │
│  │   CreeveyAPI  │◀─────────WebSocket──────────▶│  Server API    │      │
│  └───────────────┘                              └────────────────┘      │
│         │                                                               │
│         │                                                               │
│         ▼                                                               │
│  ┌───────────────────────────────────────────────────────────────┐     │
│  │                       CreeveyContext                           │     │
│  └───────────────────────────────────────────────────────────────┘     │
│         │                                              │                │
│         │                                              │                │
│         ▼                                              ▼                │
│  ┌───────────────┐                              ┌────────────────┐     │
│  │    SideBar    │                              │  ResultsPage   │     │
│  └───────────────┘                              └────────────────┘     │
│         │                                              │                │
│         ▼                                              ▼                │
│  ┌───────────────┐                              ┌────────────────┐     │
│  │  Test Tree    │                              │   ImagesView   │     │
│  └───────────────┘                              └────────────────┘     │
│                                                        │                │
│                                                        ▼                │
│                                               ┌────────────────────┐    │
│                                               │ Visualization Modes │    │
│                                               └────────────────────┘    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Component Interaction

### State Management

- **React Context**: Used for shared state across components
- **Immer**: Used for immutable state updates with `useImmer` hook
- **Component State**: Local state for component-specific concerns

### Communication with Server

- **WebSocket**: Real-time communication with server
- **Request/Response**: API calls for specific actions
- **Event-based Updates**: Server pushes updates to UI

### User Interaction Flow

1. User navigates test tree in sidebar
2. Selecting a test loads and displays results
3. User can choose different visualization modes
4. User can approve or reject visual changes
5. User can start, stop, or filter tests

## Key Features

### 1. Test Navigation

- **Tree View**: Hierarchical representation of tests
- **Search**: Filter tests by name or criteria
- **Status Filtering**: Filter tests by status (failed, passed, etc.)
- **Collapsible Groups**: Expand/collapse test suites

### 2. Image Comparison

- **Side by Side**: Compare expected and actual images alongside each other
- **Slide View**: Slide between images to spot differences
- **Swap View**: Toggle between expected and actual images
- **Blend View**: Blend images to highlight differences

### 3. Test Management

- **Run Tests**: Start test execution
- **Stop Tests**: Stop ongoing test execution
- **Approve Changes**: Accept visual changes as new baseline
- **Approve All**: Batch approve all changes

### 4. Status Visualization

- **Status Icons**: Visual representation of test status
- **Real-time Updates**: Status updates as tests run
- **Error Display**: Detailed error information for failed tests
- **Test Statistics**: Summary of test results

## Styling and Theming

- **Storybook Theming**: Uses Storybook's theming system
- **Styled Components**: Component styling with CSS-in-JS
- **Light/Dark Modes**: Support for different color schemes
- **Responsive Design**: Adapts to different screen sizes

## Key Files

- `src/client/web/CreeveyApp.tsx`: Main application component
- `src/client/web/CreeveyView/SideBar/SideBar.tsx`: Test navigation sidebar
- `src/client/shared/components/ResultsPage.tsx`: Test results display
- `src/client/shared/components/ImagesView/ImagesView.tsx`: Image comparison
- `src/client/shared/creeveyClientApi.ts`: Server communication
- `src/client/shared/helpers.ts`: Utility functions

## Extension Points

The UI architecture provides several extension points:

1. **New Visualization Modes**: Add new ways to visualize image comparisons
2. **Additional Filters**: Extend test filtering capabilities
3. **Custom Actions**: Add new actions for test management
4. **Enhanced Reporting**: Add more detailed reporting views
5. **Keyboard Shortcuts**: Extend keyboard navigation and actions
