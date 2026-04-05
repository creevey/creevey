import { JSX } from 'react';
import { ImagesViewMode, Images } from '../../../../types.js';
interface PageHeaderProps {
    title: string[];
    imageName: string;
    images?: Partial<Record<string, Images>>;
    errorMessage?: string | null;
    showViewModes: boolean;
    viewMode: ImagesViewMode;
    imagesWithError?: string[];
    onImageChange: (name: string) => void;
    onViewModeChange: (viewMode: ImagesViewMode) => void;
}
export declare function PageHeader({ title, imageName, images, errorMessage, showViewModes, viewMode, imagesWithError, onImageChange, onViewModeChange, }: PageHeaderProps): JSX.Element | null;
export {};
