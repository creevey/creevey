# Creevey for Storybook

NOTE: This guide suggest that your project has been created by `create-react-app` command and you don't have outdated dependencies

## Pre-requisite

1. Install `Storybook` by using [this guide](https://storybook.js.org/docs/react/get-started/introduction)

## Setup

1. Install `Creevey`

```bash
yarn add -D creevey
```

2. Add Creevey addon to addons section into `main.js` file inside `.storybook` directory

```js
module.exports = { addons: ['creevey'] };
```
