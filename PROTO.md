## Move creevey config inside storybook decorator

?? How to pass config from decorator to master/workers

1. Load storybook config
1. if nodejs env try to read creevey config
1. If creevey config arg defined, it must be loaded
1. creevey config has higher priority than config from decorator (maybe merge configs)

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

Framework agnostic PoC
forceReRender dont work cause bug.

So, rough plan is:
subscribe once `storyMissing`
emit `setCurrentStory` with don't existed storyId
subscribe once `storyRendered`
emit `setCurrentStory` with target storyId

Optional subscribe storyError or something

- Check new framework agnostic api in repo
- Check E2E
  - 4.x/5.x/6.x Storybook versions
  - Angular support
  - Addons register
  - Declarative configs for 6.x
