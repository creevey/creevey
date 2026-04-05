import { JSX } from 'react';
interface SearchProps {
    onChange: (arg: string) => void;
    value: string;
}
export declare const Search: ({ onChange, value }: SearchProps) => JSX.Element;
export {};
