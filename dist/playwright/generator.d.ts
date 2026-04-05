import type { PixelmatchOptions } from 'pixelmatch';
import type { ODiffOptions } from 'odiff-bin';
export interface TestsConfig {
    /**
     * Define pixelmatch diff options
     * @default { threshold: 0.1, includeAA: false }
     */
    diffOptions: PixelmatchOptions;
    /**
     * Define odiff diff options
     * @default { threshold: 0.1, antialiasing: true }
     */
    odiffOptions: ODiffOptions;
    /**
     * Define matcher for visual regression assertion
     * @default 'pixelmatch'
     */
    comparisonLibrary: 'pixelmatch' | 'odiff';
    /**
     * Enables page context reuse across tests for faster execution, though this breaks test isolation.
     * @default true
     */
    reusePageContext: boolean;
    /**
     * Enables trace recording for each test.
     * @default false
     */
    trace: boolean | {
        screenshots?: boolean;
        snapshots?: boolean;
        sources?: boolean;
    };
}
export declare function definePlaywrightTests(config?: Partial<TestsConfig>): void;
