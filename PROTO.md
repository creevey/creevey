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
