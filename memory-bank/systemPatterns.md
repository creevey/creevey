# System Patterns

## Key Architectural Patterns

### 1. Client-Server Architecture

- Clear separation between browser clients and Node.js server
- Communication via WebSockets for real-time updates
- API design follows request/response pattern

### 2. Plugin Architecture

- Storybook addon integration
- Support for multiple WebDriver implementations (Selenium/Playwright)
- Extensible reporter system based on Mocha reporters

### 3. Worker-based Execution

- Cluster-based worker pool for parallel test execution
- Each browser configuration can have multiple parallel sessions
- Master process orchestrates workers and aggregates results

### 4. Event-driven Communication

- WebSocket events for real-time status updates
- Event emitters for intra-process communication
- Message-based protocol between master and worker processes

### 5. Configuration-driven Behavior

- Extensive configuration options via config files
- Browser configurations defined declaratively
- Customizable test execution parameters

### 6. Component-based UI Architecture

- React components with clear responsibilities
- Context API for state management
- Functional components with hooks for business logic

## Code Patterns and Conventions

### TypeScript Usage

- Extensive type definitions in `types.ts`
- Interface-based design for clear contracts
- Generic types for reusable components

### Asynchronous Code

- Promise-based async operations
- Async/await for readable control flow
- Error handling with try/catch patterns

### Testing Approach

- Visual regression testing methodology
- Screenshot capture and comparison
- Support for interactive test scripts

### Docker Integration

- Container-based browser isolation
- Docker API for container management
- Support for custom browser images

### State Management

- Centralized state in server process
- UI state managed through React contexts
- Persistent state via file system (screenshots, reports)

## Performance Patterns

### Parallel Execution

- Concurrent browser sessions via worker processes
- Configurable concurrency limits per browser
- Load balancing across available resources

### Caching

- Storybook compilation caching
- Browser session reuse
- Image comparison result caching

### Optimized Image Processing

- Efficient image difference calculation
- Support for multiple diff algorithms
- Threshold-based comparison for reduced flakiness
