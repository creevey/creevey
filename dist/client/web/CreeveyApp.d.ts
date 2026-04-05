import { JSX } from 'react';
import { CreeveySuite } from '../../types.js';
import { CreeveyClientApi } from '../shared/creeveyClientApi.js';
export interface CreeveyAppProps {
    api?: CreeveyClientApi;
    initialState: {
        tests: CreeveySuite;
        isRunning: boolean;
        isReport: boolean;
        isUpdateMode: boolean;
    };
}
export declare function CreeveyApp({ api, initialState }: CreeveyAppProps): JSX.Element;
