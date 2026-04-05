import { DockerAuth } from '../types.js';
export declare function findDockerSocket(): string | undefined;
export declare function pullImages(images: string[], { auth, platform }?: {
    auth?: DockerAuth;
    platform?: string;
}): Promise<void>;
export declare function buildImage(imageName: string, version: string, dockerfile: string): Promise<void>;
export declare function runImage(image: string, args: string[], options: Record<string, unknown>, debug: boolean): Promise<string>;
