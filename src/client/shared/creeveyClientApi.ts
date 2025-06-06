import { Response, Request, CreeveyUpdate, CreeveyStatus, noop } from '../../types.js';
import { getConnectionUrl } from './helpers.js';

export interface CreeveyClientApi {
  start: (ids: string[]) => void;
  stop: () => void;
  approve: (id: string, retry: number, image: string) => void;
  approveAll: () => void;
  onUpdate: (fn: (update: CreeveyUpdate) => void) => () => void;
  readonly status: Promise<CreeveyStatus>;
}

export async function initCreeveyClientApi(): Promise<CreeveyClientApi> {
  let clientApiResolver: (api: CreeveyClientApi) => void = noop;
  let clientApiRejecter: (error: Error | Event) => void = noop;
  const updateListeners = new Set<(update: CreeveyUpdate) => void>();
  let statusRequest: Promise<CreeveyStatus> | null = null;
  let statusResolver: (status: CreeveyStatus) => void = noop;
  let isUpdateMode = false;

  const ws = new WebSocket(`ws://${getConnectionUrl()}`);

  function send(request: Request): void {
    ws.send(JSON.stringify(request));
  }

  ws.addEventListener('error', (event) => {
    clientApiRejecter(event);
  });

  ws.addEventListener('open', () => {
    clientApiResolver({
      start(ids: string[]) {
        if (isUpdateMode) {
          console.warn('Tests cannot be started in Update Mode. This mode is for approving screenshots only.');
          return;
        }
        send({ type: 'start', payload: ids });
      },
      stop() {
        if (isUpdateMode) {
          console.warn('Tests cannot be stopped in Update Mode. This mode is for approving screenshots only.');
          return;
        }
        send({ type: 'stop' });
      },
      approve(id: string, retry: number, image: string) {
        send({ type: 'approve', payload: { id, retry, image } });
      },
      approveAll() {
        send({ type: 'approveAll' });
      },
      onUpdate(fn: (update: CreeveyUpdate) => void) {
        updateListeners.add(fn);
        return () => updateListeners.delete(fn);
      },
      get status() {
        if (statusRequest) return statusRequest;

        send({ type: 'status' });

        return (statusRequest = new Promise<CreeveyStatus>((resolve) => (statusResolver = resolve)));
      },
    });
  });
  ws.addEventListener('message', (message: MessageEvent<string>) => {
    const data = JSON.parse(message.data) as Response;

    if (data.type == 'update')
      updateListeners.forEach((fn) => {
        fn(data.payload);
      });
    if (data.type == 'status') {
      isUpdateMode = data.payload.isUpdateMode;
      statusResolver(data.payload);
      statusResolver = noop;
      statusRequest = null;
    }
  });
  // TODO Reconnect

  return new Promise((resolve, reject) => {
    clientApiResolver = resolve;
    clientApiRejecter = reject;
  });
}
