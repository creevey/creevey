import type { Container } from 'dockerode';

let workerContainer: Container | null = null;

export function setWorkerContainer(container: Container): void {
  workerContainer = container;
}

export async function removeWorkerContainer(): Promise<void> {
  if (workerContainer) {
    await workerContainer.remove({ force: true });
    workerContainer = null;
  }
}
