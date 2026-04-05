import { JSX } from 'react';
export interface PagingProps {
    activePage: string;
    onPageChange: (pageNumber: number) => void;
    pagesCount: number;
}
export declare function Paging(props: PagingProps): JSX.Element;
