import type { ODiffOptions } from 'odiff-bin';
import type { PixelmatchOptions } from 'pixelmatch';
import { Images } from '../types';
export interface ImageContext {
    attachments: string[];
    testFullPath: string[];
    images: Partial<Record<string, Images>>;
}
export declare function getPixelmatchAssert(pixelmatch: typeof import('pixelmatch'), ctx: ImageContext, config: {
    screenDir: string;
    reportDir: string;
    diffOptions: PixelmatchOptions;
    reportOnlyFailedTests?: boolean;
}): (actual: Buffer, imageName?: string) => Promise<string | undefined>;
export declare function getOdiffAssert(compare: (typeof import('odiff-bin'))['compare'], ctx: ImageContext, config: {
    screenDir: string;
    reportDir: string;
    odiffOptions?: ODiffOptions;
}): (image: Buffer, imageName?: string) => Promise<string | undefined>;
