import { ImagesViewMode } from '../../types.js';

export const VIEW_MODE_KEY = 'Creevey_view_mode';

export const viewModes: ImagesViewMode[] = ['side-by-side', 'swap', 'slide', 'blend', 'diff'];

export const getViewMode = (): ImagesViewMode => {
  const item = localStorage.getItem(VIEW_MODE_KEY);
  return item && viewModes.includes(item as ImagesViewMode) ? (item as ImagesViewMode) : 'side-by-side';
};
