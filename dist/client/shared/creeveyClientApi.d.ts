import { CreeveyUpdate, CreeveyStatus } from '../../types.js';
export interface CreeveyClientApi {
    start: (ids: string[]) => void;
    stop: () => void;
    approve: (id: string, retry: number, image: string) => void;
    approveAll: () => void;
    onUpdate: (fn: (update: CreeveyUpdate) => void) => () => void;
    readonly status: Promise<CreeveyStatus>;
}
export declare function initCreeveyClientApi(): Promise<CreeveyClientApi>;
