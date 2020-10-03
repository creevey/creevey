import { Response, Request, CreeveyUpdate, CreeveyStatus, noop } from '../../types';
import { getConnectionUrl } from './helpers';

export interface CreeveyClientApi {
  start: (ids: string[]) => void;
  stop: () => void;
  approve: (id: string, retry: number, image: string) => void;
  onUpdate: (fn: (update: CreeveyUpdate) => void) => () => void;
  readonly status: Promise<CreeveyStatus>;
}

export async function initCreeveyClientApi(): Promise<CreeveyClientApi> {
  let clientApiResolver: (api: CreeveyClientApi) => void = noop;
  const updateListeners = new Set<(update: CreeveyUpdate) => void>();
  let statusRequest: Promise<CreeveyStatus> | null = null;
  let statusResolver: (status: CreeveyStatus) => void = noop;

  const ws = new WebSocket(`ws://${getConnectionUrl()}`);

  function send(request: Request): void {
    ws.send(JSON.stringify(request));
  }

  ws.addEventListener('open', () => {
    clientApiResolver({
      start(ids: string[]) {
        send({ type: 'start', payload: ids });
      },
      stop() {
        send({ type: 'stop' });
      },
      approve(id: string, retry: number, image: string) {
        send({ type: 'approve', payload: { id, retry, image } });
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
  ws.addEventListener('message', (message: MessageEvent) => {
    const data = JSON.parse(message.data) as Response;

    if (data.type == 'update') updateListeners.forEach((fn) => fn(data.payload));
    if (data.type == 'status') {
      statusResolver(data.payload);
      statusResolver = noop;
      statusRequest = null;
    }
  });
  // TODO Reconnect

  return new Promise((resolve) => (clientApiResolver = resolve));
}
