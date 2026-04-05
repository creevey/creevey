import { JSX } from 'react';
import { Images, ImagesViewMode } from '../../../../types.js';
interface ImagesViewProps {
    url?: string;
    image: Images;
    canApprove: boolean;
    mode: ImagesViewMode;
}
export declare function ImagesView({ url, image, canApprove, mode }: ImagesViewProps): JSX.Element;
export {};
