import { runImage } from '../docker';
import { emitWorkerMessage, subscribeOn } from '../messages';
import { isInsideDocker } from '../utils';
import { LOCALHOST_REGEXP } from '../webdriver';

export async function startPlaywrightContainer(imageName: string, debug: boolean): Promise<string> {
  const port = await new Promise<number>((resolve) => {
    subscribeOn('worker', (message) => {
      if (message.type == 'port') {
        resolve(message.payload.port);
      }
    });
    emitWorkerMessage({ type: 'port', payload: { port: -1 } });
  });

  const host = await runImage(
    imageName,
    [],
    {
      ExposedPorts: { [`${port}/tcp`]: {} },
      HostConfig: {
        PortBindings: { ['4444/tcp']: [{ HostPort: `${port}` }] },
      },
    },
    debug,
  );

  const gridUrl = `ws://localhost:${port}/creevey`;

  return isInsideDocker ? gridUrl.replace(LOCALHOST_REGEXP, host) : gridUrl;
}
