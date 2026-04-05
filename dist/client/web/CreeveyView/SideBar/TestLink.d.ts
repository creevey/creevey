import { JSX } from 'react';
import { CreeveyTest } from '../../../../types.js';
export interface TestLinkProps {
    title: string;
    opened: boolean;
    test: CreeveyTest;
}
export declare function TestLink({ title, opened, test }: TestLinkProps): JSX.Element;
