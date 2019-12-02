import { Response, Request, CreeveyUpdate, CreeveyStatus } from "../types";

export interface CreeveyClientApi {
  start: (ids: string[]) => void;
  stop: () => void;
  approve: (id: string, retry: number, image: string) => void;
  onUpdate: (fn: (update: CreeveyUpdate) => void) => () => void;
  readonly status: Promise<CreeveyStatus>;
}

function noop() {}

export async function initCreeveyClientApi(): Promise<CreeveyClientApi> {
  let clientApiResolver: Function = noop
  const updateListeners: Set<(update: CreeveyUpdate) => void> = new Set();
  let statusRequest: Promise<CreeveyStatus> | null = null;
  let statusResolver: (status: CreeveyStatus) => void = noop;

  const ws = new WebSocket(`ws://${window.location.host}`);
  ws.addEventListener("open", () => {
    clientApiResolver({
      start(ids: string[]) {
        send({ type: "start", payload: ids });
      },
      stop() {
        send({ type: "stop" });
      },
      approve(id: string, retry: number, image: string) {
        send({ type: "approve", payload: { id, retry, image } });
      },
      onUpdate(fn: (update: CreeveyUpdate) => void) {
        updateListeners.add(fn);
        return () => updateListeners.delete(fn);
      },
      get status() {
        if (statusRequest) return statusRequest;

        send({type: "status"});

        return (statusRequest = new Promise<CreeveyStatus>(resolve => (statusResolver = resolve)));
      }
      });
  });
  ws.addEventListener("message", (message: MessageEvent) => {
    const data: Response = JSON.parse(message.data);

    if (data.type == "update") updateListeners.forEach(fn => fn(data.payload));
    if (data.type == "status") {
      statusResolver(data.payload);
      statusResolver = noop;
      statusRequest = null;
    }
  });

  // TODO Reconnect

  function send(request: Request) {
    ws.send(JSON.stringify(request));
  }

  return new Promise(resolve => clientApiResolver = resolve)
}
