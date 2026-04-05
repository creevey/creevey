import { JSX } from 'react';
interface ToggleProps {
    value?: boolean;
    onChange: (val: boolean) => void;
}
export declare const Toggle: ({ value, onChange }: ToggleProps) => JSX.Element;
export {};
