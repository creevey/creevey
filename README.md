[<img width="274" alt="Creevey" src="https://user-images.githubusercontent.com/4607770/220418756-89cf4f54-ccb7-4086-a74c-a044ea1d2a61.png">](https://harrypotter.fandom.com/wiki/Colin_Creevey)

Cross-browser screenshot testing tool for [Storybook](https://storybook.js.org/) with fancy UI Runner.

[![Creevey downloads](https://img.shields.io/npm/dt/creevey)](https://www.npmjs.com/package/creevey)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2FwKich%2Fcreevey.svg?type=shield)](https://app.fossa.com/projects/git%2Bgithub.com%2FwKich%2Fcreevey?ref=badge_shield)

![Creevey Demo](https://user-images.githubusercontent.com/6397708/100863723-cd6b8500-34b6-11eb-94e1-849590bc8066.gif)

## Core features

- 📚 Integrates with Storybook
- 📜 Uses stories as tests
- ✏️ Allows write interaction tests
- ✨ Has fancy UI Runner
- 🐳 Supports Docker
- ⚔️ Cross-browsers testing
- 🔥 Tests hot-reloading
- ⚙️ CI Ready

It named after [Colin Creevey](https://harrypotter.fandom.com/wiki/Colin_Creevey) character from the Harry Potter universe.

## Contents

- [Pre-requisites](#pre-requisites)
- [How to Start](#how-to-start)
- [Comparison with other tools](#comparison-with-other-tools)
- [Config](docs/config.md)
- [CLI commands](docs/cli.md)
- [Playwright reporter](docs/playwright-reporter.md)
- [Storybook parameters](docs/storybook.md)
- [Write interactive tests](docs/tests.md)
- [Use your Selenium Grid (LambdaTest/BrowserStack/SauceLabs/etc)](docs/grid.md)
- [Future plans](#future-plans)
- [Known issues](#known-issues)
- [Used by](#used-by)

## Pre-requisites

- Make sure you have installed [Docker](https://www.docker.com/products/docker-desktop). If you are going to use Selenium Grid or run screenshot tests exclusively in CI you don't need Docker in that case.
- Supported Storybook versions: >= 7.x.x
- Supported Node.js versions: >= 18.x.x

## How to start

- Install `creevey` package

```bash
yarn add -D creevey
```

- Start Creevey Web UI Runner. With `-s` flag Creevey will start Storybook automatically. (To run headless from CLI, omit the `--ui` flag)

```bash
yarn creevey test -s --ui
```

- Open [http://localhost:3000](http://localhost:3000) in your browser. And that's it.

**NOTE:** In first run you may noticed, that all your tests are failing, it because you don't have source screenshot images yet. If you think, that all images are acceptable, you can approve them all from UI.

**NOTE:** Creevey captures screenshot of the `#storybook-root` element and sometimes you need to capture a whole browser viewport. To achieve this you could define `captureElement` Creevey parameter for story or kind. Or you may pass any different css selector. No Storybook addon is required — Creevey reads parameters directly from your stories/config.

```tsx
// stories/MyModal.stories.tsx
export default {
  title: 'MyModal',
  component: MyModal,
};

export const MyModalStory = { creevey: { captureElement: null } };
```

## Comparison with other tools

| Features\Tools        | Creevey            | Loki               | Storyshots         | Hermione           | BackstopJS         | Percy/Happo        | Chromatic          |
| --------------------- | ------------------ | ------------------ | ------------------ | ------------------ | ------------------ | ------------------ | ------------------ |
| Easy-to-Setup         | :heavy_check_mark: | :heavy_check_mark: | :warning:          | :no_entry:         | :no_entry:         | :heavy_check_mark: | :heavy_check_mark: |
| Storybook Support     | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :no_entry:         | :no_entry:         | :heavy_check_mark: | :heavy_check_mark: |
| Run tests from Web UI | :heavy_check_mark: | :no_entry:         | :no_entry:         | :no_entry:         | :no_entry:         | :no_entry:         | :no_entry:         |
| Cross-browser         | :heavy_check_mark: | :warning:          | :no_entry:         | :heavy_check_mark: | :no_entry:         | :heavy_check_mark: | :heavy_check_mark: |
| Test Interaction      | :heavy_check_mark: | :no_entry:         | :warning:          | :heavy_check_mark: | :heavy_check_mark: | :no_entry:         | :no_entry:         |
| UI Test Runner        | :heavy_check_mark: | :no_entry:         | :no_entry:         | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: |
| Built-in Docker       | :heavy_check_mark: | :heavy_check_mark: | :no_entry:         | :no_entry:         | :heavy_check_mark: | :warning:          | :warning:          |
| Tests hot-reload      | :heavy_check_mark: | :no_entry:         | :no_entry:         | :no_entry:         | :no_entry:         | :no_entry:         | :no_entry:         |
| OSS/SaaS              | OSS                | OSS                | OSS                | OSS                | OSS                | SaaS               | SaaS               |

## Future plans

- Allow to define different viewport sizes for specific stories or capture story with different args.
- And more, check [TODO](TODO.md) for more details. Also feel free to ask about feature that you want

## Known issues

### Docker-in-Docker

Currently it's not possible to run Creevey in this configuration. I'll fix this in later versions.
If you use `CircleCI` or another CI that use docker to run jobs. Try to configure to use virtual machine executor

**Update** I added support to use local browsers. So it should be possible run Creevey inside docker.
The only issue, that you need to find or build docker image with node, browser and selenium-webdriver. I'll add special images for Creevey later.

### Chrome webdriver + 1px border with border-radius.

This cause to flaky screenshots. Possible solutions:

- Increase threshold ratio in Creevey config `diffOptions: { threshold: 0.1 }`
- Replace border to box-shadow `border: 1px solid red` -> `box-shadow: 0 0 0 1px red`
- Set max retries to more than 5

## Used by

| [![Whisk](https://raw.githubusercontent.com/wKich/creevey/master/.github/images/whisk.svg)](https://whisk.com/) | [![SKB Kontur](https://kontur.ru/Files/userfiles/image/brandbook/logo-skb-kontur-eng.png)](https://kontur.ru/) | [![ABBYY](https://raw.githubusercontent.com/wKich/creevey/master/.github/images/abbyy.svg)](https://www.abbyy.com/) |
| --------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |

## License

[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2FwKich%2Fcreevey.svg?type=large)](https://app.fossa.com/projects/git%2Bgithub.com%2FwKich%2Fcreevey?ref=badge_large)
