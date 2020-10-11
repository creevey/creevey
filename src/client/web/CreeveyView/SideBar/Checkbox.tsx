import React from 'react';

import { styled, withTheme } from '@storybook/theming';
import { Icons } from '@storybook/components';

const Label = withTheme(
  styled.label(({ theme }) => ({
    display: 'inline-flex',
    alignItems: 'baseline',
    lineHeight: theme.typography.size.l1,
    position: 'relative',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    fontSize: theme.typography.size.s1,
    padding: '0px',

    '&:hover span': {
      boxShadow: `${theme.appBorderColor} 0 0 0 1px inset`, // opacity 0.3
    },

    input: {
      display: 'inline-block',
      opacity: '0',
      width: 0,
      height: 0,
      position: 'absolute',
      zIndex: -1,

      '&:focus + span': {
        outline: 'none',
        boxShadow: `${theme.color.secondary} 0 0 0 1px inset`,
      },
    },
  })),
);

const Box = withTheme(
  styled.span(({ theme }) => ({
    display: 'inline-block',
    boxSizing: 'border-box',
    width: '16px',
    height: '16px',
    color: theme.input.color,
    border: 'none',
    borderRadius: theme.input.borderRadius,
    boxShadow: 'rgba(0, 0, 0, 0.15) 0px 0px 0px 1px',
    background: 'linear-gradient(rgb(253, 253, 253), rgb(237, 237, 237))',
    margin: '0px',

    '&:focus': {
      outline: 'none',
      boxShadow: `${theme.color.secondary} 0 0 0 1px inset !important`,
    },
  })),
);

const CheckIcon = styled(Icons)({
  width: 10,
  height: 10,
  margin: 3,
});

const CircleIcon = styled(Icons)({
  width: 8,
  height: 8,
  margin: 4,
});

interface BooleanProps {
  checked?: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}
interface CheckboxState {
  indeterminate: boolean;
}

export class Checkbox extends React.Component<BooleanProps, CheckboxState> {
  state: CheckboxState = { indeterminate: false };

  handleIndeterminateChange = (value: boolean): void => {
    this.setState({
      indeterminate: value,
    });
  };
  public setIndeterminate = (): void => this.handleIndeterminateChange(true);
  public resetIndeterminate = (): void => this.handleIndeterminateChange(false);
  render(): JSX.Element {
    const { checked, onValueChange } = this.props;
    const { indeterminate } = this.state;
    return (
      <Label>
        <input type="checkbox" onChange={(e) => onValueChange(e.target.checked)} checked={checked || false} />
        <Box>{indeterminate ? <CircleIcon icon="circle" /> : checked ? <CheckIcon icon="check" /> : ' '}</Box>
      </Label>
    );
  }
}
