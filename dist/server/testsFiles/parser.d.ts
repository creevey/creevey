import { CreeveyStoryParams, CreeveyTestFunction } from '../../types.js';
export type CreeveyParamsByStoryId = Record<string, CreeveyStoryParams>;
export default function parse(files: string[]): Promise<CreeveyParamsByStoryId>;
export declare const kind: (title: string, kindFn: () => void) => void;
export declare const story: (title: string, storyFn: (arg: {
    setStoryParameters: (params: CreeveyStoryParams) => void;
}) => void) => void;
export declare const test: (title: string, testFn: CreeveyTestFunction) => void;
