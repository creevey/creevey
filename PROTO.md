# Using webpack to load stories

- Write webpack plugin to remove unnecessary code
  - (???) Plugin should modify code before any loaders
  - delete stories functions body content
  - delete all unused variables/imports in tests
  - Stories file should contains only stories meta and tests

Issues:

- `isBrowser` check in @storybook/core/src/client/preview/start.js
- Dependency on jsdom

```js
const path = require('path');
const Docker = require('dockerode');

const docker = new Docker();

// docker.pull("aerokube/selenoid:latest-release", (error, stream) => {
//   if (error) {
//     console.log(error);
//     process.exit(-1);
//   }
//   // TODO How to check progress finish?
//   // docker.modem.followProgress(stream, onFinished, onProgress);
//   stream.pipe(process.stdout);
// });

// TODO Create config file `config/browsers.json`
/*
{
  "firefox": {
    "default": "75.0",
    "versions": {
      "75.0": {
        "image": "selenoid/vnc:firefox_75.0",
        "port": "4444",
        "path": "/wd/hub"
      }
    }
  }
}

 */

docker.run(
  'aerokube/selenoid:latest-release',
  [],
  process.stdout,
  {
    name: 'selenoid-manual',
    Volumes: {
      '//var/run/docker.sock': {},
      [path.join(__dirname, 'config')]: {},
    },
    ExposedPorts: {
      '4444/tcp': {},
    },
    HostConfig: {
      Binds: [`${path.join(__dirname, 'config')}/:/etc/selenoid/:ro`, '//var/run/docker.sock:/var/run/docker.sock'],
      PortBindings: { '4444/tcp': [{ HostPort: '4444' }] },
    },
  },
  function (err, data, container) {
    console.log(err);
    console.log(data);
  },
);

// TODO Need to check already created container
// TODO platform??
// TODO See how jest or lokijs starting
```
