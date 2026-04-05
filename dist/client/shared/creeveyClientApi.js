"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initCreeveyClientApi = initCreeveyClientApi;
const types_js_1 = require("../../types.js");
const helpers_js_1 = require("./helpers.js");
async function initCreeveyClientApi() {
    let clientApiResolver = types_js_1.noop;
    let clientApiRejecter = types_js_1.noop;
    const updateListeners = new Set();
    let statusRequest = null;
    let statusResolver = types_js_1.noop;
    let isUpdateMode = false;
    const ws = new WebSocket(`ws://${(0, helpers_js_1.getConnectionUrl)()}`);
    function send(request) {
        ws.send(JSON.stringify(request));
    }
    ws.addEventListener('error', (event) => {
        clientApiRejecter(event);
    });
    ws.addEventListener('open', () => {
        clientApiResolver({
            start(ids) {
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
            approve(id, retry, image) {
                send({ type: 'approve', payload: { id, retry, image } });
            },
            approveAll() {
                send({ type: 'approveAll' });
            },
            onUpdate(fn) {
                updateListeners.add(fn);
                return () => updateListeners.delete(fn);
            },
            get status() {
                if (statusRequest)
                    return statusRequest;
                send({ type: 'status' });
                return (statusRequest = new Promise((resolve) => (statusResolver = resolve)));
            },
        });
    });
    ws.addEventListener('message', (message) => {
        const data = JSON.parse(message.data);
        if (data.type == 'update')
            updateListeners.forEach((fn) => {
                fn(data.payload);
            });
        if (data.type == 'status') {
            isUpdateMode = data.payload.isUpdateMode;
            statusResolver(data.payload);
            statusResolver = types_js_1.noop;
            statusRequest = null;
        }
    });
    // TODO Reconnect
    return new Promise((resolve, reject) => {
        clientApiResolver = resolve;
        clientApiRejecter = reject;
    });
}
//# sourceMappingURL=creeveyClientApi.js.map