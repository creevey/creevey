# Using webpack to load stories

- Prototype to require config from storybook
- How to extract
- Write webpack plugin to remove unnecessary code
  - (???) Plugin should modify code before any loaders
  - delete stories functions body content
  - delete all unused variables/imports in tests
  - Stories file should contains only stories meta and tests
- Load stories from webpack bundle
  - Create addons channel
- Watch ability
  - Output webpack bundle in nodejs cache
  - Watch original files by chokidar => collect changed files
  - webpack watch => build done => load stories, reset test only for changed files
- Optional
  - Watch and build bundle only in master process or separate process
  - Workers should watch bundle directory and load test from where

Issues:

- `isBrowser` check in @storybook/core/src/client/preview/start.js
- Dependency on jsdom
