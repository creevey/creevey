import { Config } from '../../types.js';
import { ImageContext } from '../compare.js';
export declare function getMatchers(ctx: ImageContext, config: Config): Promise<{
    matchImage: (image: Buffer | string, imageName?: string) => Promise<void>;
    matchImages: (images: Record<string, Buffer | string>) => Promise<void>;
}>;
export declare function getOdiffMatchers(ctx: ImageContext, config: Config): Promise<{
    matchImage: (image: Buffer | string, imageName?: string) => Promise<void>;
    matchImages: (images: Record<string, Buffer | string>) => Promise<void>;
}>;
