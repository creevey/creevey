import { RefObject } from 'react';
import { TestData, TestStatus, CreeveySuite, CreeveyTest, CreeveyStatus } from '../../types.js';
export interface CreeveyViewFilter {
    status: TestStatus | null;
    subStrings: string[];
}
export interface CreeveyTestsStatus {
    successCount: number;
    failedCount: number;
    pendingCount: number;
    approvedCount: number;
}
export declare function calcStatus(oldStatus?: TestStatus, newStatus?: TestStatus): TestStatus | undefined;
export declare function getTestPath(test: Pick<TestData, 'browser' | 'testName' | 'storyPath'>): string[];
export declare function getSuiteByPath(suite: CreeveySuite, path: string[]): CreeveySuite | CreeveyTest | undefined;
export declare function getTestByPath(suite: CreeveySuite, path: string[]): CreeveyTest | null;
export declare function getTestsByStoryId(suite: CreeveySuite, storyId: string): CreeveyTest[];
export declare function checkSuite(suite: CreeveySuite, path: string[], checked: boolean): void;
export declare function treeifyTests(testsById: CreeveyStatus['tests']): CreeveySuite;
export declare function getCheckedTests(suite: CreeveySuite): CreeveyTest[];
export declare function getFailedTests(suite: CreeveySuite): CreeveyTest[];
export declare function updateTestStatus(suite: CreeveySuite, path: string[], update: Partial<TestData>): void;
export declare function removeTests(suite: CreeveySuite, path: string[]): void;
export declare function filterTests(suite: CreeveySuite, filter: CreeveyViewFilter): CreeveySuite;
export declare function openSuite(suite: CreeveySuite, path: string[], opened: boolean): void;
export declare function flattenSuite(suite: CreeveySuite): {
    title: string;
    suite: CreeveySuite | CreeveyTest;
}[];
export declare function countTestsStatus(suite: CreeveySuite): CreeveyTestsStatus;
export declare function getConnectionUrl(): string;
export declare function getImageUrl(path: string[], imageName: string, isReport?: boolean): string;
export declare function getBorderSize(element: HTMLElement): number;
export declare function useLoadImages(s1: string, s2: string, s3: string): boolean;
/**
 * Uses the ResizeObserver API to observe changes within the given HTML Element DOM Rect.
 *
 * @returns dimensions of element's content box (which means without paddings and border width)
 */
export declare function useResizeObserver<T extends Element>(elementRef: RefObject<T>, onResize: () => void, debounceTimeout?: number): void;
export declare function useApplyScale(imageRef: RefObject<HTMLImageElement>, scale: number, dependency?: unknown): void;
export declare function useCalcScale(diffImageRef: RefObject<HTMLImageElement>, loaded: boolean): number;
export declare function setSearchParams(testPath: string[]): void;
export declare function getTestPathFromSearch(): string[];
export declare function useForceUpdate(): () => void;
