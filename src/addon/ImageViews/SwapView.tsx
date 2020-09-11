import React, { useState } from 'react';
import { ViewProps, borderColors } from './ImagesView';
import { styled } from '@storybook/theming';

type ImageState = keyof typeof borderColors;

const Container = styled.div({
  margin: '20px',
  position: 'relative',
});

const Button = styled.button({
  position: 'absolute',
  width: '100%',
  height: '100%',
  appearance: 'none',
  background: 'none',
  color: 'inherit',
  border: 'none',
  padding: '0',
  font: 'inherit',
  cursor: 'pointer',
  outline: 'none',
  zIndex: 1,
});

const Image = styled.img<{ borderColor: string }>(({ borderColor }) => ({
  maxWidth: '100%',
  border: `1px solid ${borderColor}`,
}));

export function SwapView(props: ViewProps): JSX.Element {
  const [image, setImage] = useState<ImageState>('actual');

  const handleChangeView = (): void => setImage(image == 'actual' ? 'expect' : 'actual');
  const colors: ViewProps = borderColors;
  return (
    <Container>
      <Button onClick={handleChangeView}>
        <Image borderColor={colors[image]} alt={image} src={props[image]} />
      </Button>
      <Image borderColor={'transparent'} style={{ opacity: 0 }} alt="diff" src={props.diff} />
    </Container>
  );
}
