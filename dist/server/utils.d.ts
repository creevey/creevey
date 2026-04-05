import { SkipOptions, SkipOption, TestData, ServerTest, Worker } from '../types.js';
export declare const isShuttingDown: {
    current: boolean;
};
export declare const configExt: string[];
declare const browserTypes: {
    readonly chromium: "chromium";
    readonly 'chromium-headless-shell': "chromium";
    readonly chrome: "chromium";
    readonly 'chrome-beta': "chromium";
    readonly msedge: "chromium";
    readonly 'msedge-beta': "chromium";
    readonly 'msedge-dev': "chromium";
    readonly 'bidi-chromium': "chromium";
    readonly firefox: "firefox";
    readonly webkit: "webkit";
};
export declare const skipOptionKeys: string[];
export declare function getClientDir(): string;
export declare function ensureClientStatics(): Promise<string>;
export declare function shouldSkip(browser: string, meta: {
    title: string;
    name: string;
}, skipOptions: SkipOptions, test?: string): string | boolean;
export declare function shouldSkipByOption(browser: string, meta: {
    title: string;
    name: string;
}, skipOption: SkipOption | SkipOption[], reason: string, test?: string): string | boolean;
export declare function shutdownOnException(reason: unknown): void;
export declare function shutdownWorkers(): Promise<void>;
export declare function gracefullyKill(worker: Worker): void;
export declare function killTree(rootPid: number): Promise<void>;
export declare function shutdownWithError(): void;
export declare function resolvePlaywrightBrowserType(browserName: string): (typeof browserTypes)[keyof typeof browserTypes];
export declare function getCreeveyCache(): Promise<string | undefined>;
export declare function runSequence(seq: (() => unknown)[], predicate: () => boolean): Promise<boolean>;
export declare function getTestPath(test: ServerTest): string[];
export declare function testsToImages(tests: (TestData | undefined)[]): Set<string>;
export declare const isInsideDocker: boolean;
export declare const downloadBinary: (downloadUrl: string, destination: string) => Promise<void>;
export declare function readDirRecursive(dirPath: string): string[];
export declare function tryToLoadTestsData(filename: string): Partial<Record<string, ServerTest>> | undefined;
export declare function loadThroughTSX<T>(callback: (load: (modulePath: string) => Promise<T>) => Promise<T>): Promise<T>;
export declare function waitOnUrl(waitUrl: string, timeout: number, delay: number): Promise<void>;
/**
 * Copies static assets to the report directory
 * @param reportDir Directory where the report will be generated
 */
export declare function copyStatics(reportDir: string): Promise<void>;
export {};
