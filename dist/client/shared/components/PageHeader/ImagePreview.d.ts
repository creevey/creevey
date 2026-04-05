import React from 'react';
import { Theme } from 'storybook/theming';
interface ImageSwapProps {
    url: string;
    isActive: boolean;
    onClick: (imageName: string) => void;
    imageName: string;
    theme: Theme;
    error?: boolean;
}
export declare const ImagePreview: React.ForwardRefExoticComponent<Pick<ImageSwapProps, "error" | "url" | "imageName" | "onClick" | "isActive"> & {
    theme?: Theme;
}>;
export {};
