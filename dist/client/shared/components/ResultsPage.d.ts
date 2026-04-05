import React, { JSX } from 'react';
import { Theme } from 'storybook/theming';
import { TestResult } from '../../../types.js';
interface ResultsPageProps {
    path: string[];
    results?: TestResult[];
    approved?: Partial<Record<string, number>> | null;
    showTitle?: boolean;
    theme: Theme;
    height?: string;
    retry: number;
    imageName: string;
    onImageChange: (image: string) => void;
    onRetryChange: (retry: number) => void;
}
export declare function ResultsPageInternal({ path, results, approved, theme, height, retry, imageName, onImageChange, onRetryChange, }: ResultsPageProps): JSX.Element;
export declare const ResultsPage: React.ForwardRefExoticComponent<Pick<ResultsPageProps, "approved" | "results" | "path" | "height" | "retry" | "imageName" | "onImageChange" | "onRetryChange" | "showTitle"> & {
    theme?: Theme;
}>;
export {};
