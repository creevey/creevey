```ts
type Tests = {
    [id: string]: {
      path: string[]
      ...restTest
    }
  }

type CreeveyStat = {
    topLevelSuites: string[],
    suites: {
      [suiteId]: {
        name: string,
        parent: string,
        children: string[],
        tests: string[],
      }
    }
    tests: {
      [id: string]: {
        suiteId: string,
        ...Test
      }
    }
  }
```

```ts
const tests = {
  name(api) {
    const element = api.find("selector");
    api.findAll("selector");
    api.click(element);
    api.capture("name");
  }
};
```

TODO Support only Component Story Format (CSF)
Check load stories in nodejs enviroment

TODO nodejs require.context
TODO Creevey master load storybook config
TODO Default path to storybook config
TODO withCreevey if nodejs env export config else export decorator

CLI => Stories Loader => Tests => Master/Worker
CLI => Tests Loader => ----//-----

Tests — Plain object with functions and meta
Master cut functions and use only meta
Worker add tests to mocha/jest

Tests CLI

- Load creevey.config
- Load tests
- Run

Storybook CLI

- Load storybook config
- Load tests
- Run

Do we nned support e2e screenshot tests?
TODO Extract mocha hooks
TODO use forceReRender function from storybook

```tsx
const tests
require.context = function() {
  traverse stories => require
  tests.add()
}
require(storybookConfig)
const config = require('./storybook').default
```

NOTE Storybook CLI

```tsx
const defaultConfig = { ... } || require(parse(args).configPath || process.cwd() + 'creevey.config')
const config = { ...defaultConfig }

export function withCreevey(additionalConfig) {
  if (nodejs) {
    Object.assign(config, additionalConfig)
    return dummyDecorator
  } else {
    return decorator
  }
}

export default config
```
