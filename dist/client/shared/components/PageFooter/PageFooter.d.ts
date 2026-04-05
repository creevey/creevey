import { JSX } from 'react';
export interface PageFooterProps {
    retriesCount: number;
    retry: number;
    onRetryChange: (retry: number) => void;
}
export declare function PageFooter({ retriesCount, retry, onRetryChange }: PageFooterProps): JSX.Element;
