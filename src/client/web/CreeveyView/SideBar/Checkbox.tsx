import React from 'react';

import { styled, withTheme } from '@storybook/theming';
import { Icons } from '@storybook/components';
import { transparentize } from 'polished';

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

    input: {
      display: 'inline-block',
      opacity: '0',
      width: 0,
      height: 0,
      position: 'absolute',
      zIndex: -1,

      '&:focus + span': {
        outline: 'none',
        boxShadow: `${transparentize(0.5, theme.color.defaultText)} 0 0 0 1px inset`,
      },
    },
  })),
);

const Box = withTheme(
  styled.span(({ theme }) => ({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '16px',
    height: '16px',
    border: theme.appBorderColor,
    borderRadius: theme.input.borderRadius,
    margin: '2px',

    boxShadow: `${transparentize(0.8, theme.color.defaultText)} 0 0 0 1px inset`,
    color: transparentize(0.3, theme.color.defaultText),
    background: theme.background.content,

    '&:hover, &:focus': {
      outline: 'none',
      boxShadow: `${transparentize(0.5, theme.color.defaultText)} 0 0 0 1px inset`,
    },
  })),
);

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
        <Box>
          {indeterminate ? (
            <Icons icon="circle" width="8" height="8" />
          ) : checked ? (
            <Icons icon="check" stroke="currentColor" strokeWidth="30" width="12" height="12" />
          ) : (
            ' '
          )}
        </Box>
      </Label>
    );
  }
}
