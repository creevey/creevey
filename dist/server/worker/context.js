"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setWorkerContainer = setWorkerContainer;
exports.removeWorkerContainer = removeWorkerContainer;
let workerContainer = null;
function setWorkerContainer(container) {
    workerContainer = container;
}
async function removeWorkerContainer() {
    if (workerContainer) {
        await workerContainer.remove({ force: true });
        workerContainer = null;
    }
}
//# sourceMappingURL=context.js.map