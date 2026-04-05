import type { Container } from 'dockerode';
export declare function setWorkerContainer(container: Container): void;
export declare function removeWorkerContainer(): Promise<void>;
