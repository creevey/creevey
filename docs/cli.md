## Creevey CLI Options

There are several options available for the Creevey CLI:

- `--ui` — Starts Creevey UI Runner, which allows to run tests individually, compare screenshots and approve them without hesitation
- `-s, --storybookStart` — Starts Storybook for you by using `storybook dev` command
- `-c, --config` — Specify path to the config file. Default `.creevey/config.ts` or `creevey.config.ts`
- `-p, --port` — Specify port in which UI Runner should be started. Default `3000`
- `-d, --debug` — Enable debug output. It also enables recording video and traces if Playwright is used
- `-u, --update` — Approve all images from `report` directory. But it's recommended to do it from the UI Runner
- `--reportDir` — Path where reports will be stored
- `--screenDir` — Path where reference images are located
