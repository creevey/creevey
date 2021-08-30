import React from 'react';
import { PageHeader } from '../src/client/shared/components/PageHeader/PageHeader';
import { noop } from '../src/types';

export default { title: 'PageHeader' };

export const Simple = (): JSX.Element => (
  <PageHeader
    showTitle
    title={['chrome', 'title', '1']}
    showViewModes
    viewMode={'side-by-side'}
    onImageChange={noop}
    onViewModeChange={noop}
  />
);

export const WithError = (): JSX.Element => (
  <PageHeader
    showTitle
    title={['chrome', 'title', '2']}
    errorMessage={'errorMessage'}
    showViewModes={false}
    viewMode={'swap'}
    onImageChange={noop}
    onViewModeChange={noop}
  />
);
export const WithImagePreview = (): JSX.Element => (
  <PageHeader
    showTitle
    title={['chrome', 'title', '3']}
    showViewModes={false}
    viewMode={'swap'}
    onImageChange={noop}
    onViewModeChange={noop}
    images={{ click: { actual: '1' }, idle: { actual: '2', error: 'error' } }}
    imagesWithError={['idle']}
  />
);

export const Full = (): JSX.Element => (
  <PageHeader
    showTitle
    title={['chrome', 'title', '4']}
    showViewModes
    viewMode={'swap'}
    onImageChange={noop}
    onViewModeChange={noop}
    images={{ click: { actual: '1', error: 'error' }, idle: { actual: '2', error: 'error' } }}
    imagesWithError={['idle', 'click']}
  />
);
