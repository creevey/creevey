import React, { Component, JSX } from 'react';
import { styled, Theme, withTheme } from '@storybook/theming';
import { CircleIcon, CheckIcon } from '@storybook/icons';
import { transparentize } from 'polished';

const Label = withTheme(
  styled.label<{ theme: Theme; disabled?: boolean }>(({ theme, disabled }) => ({
    display: 'inline-flex',
    alignItems: 'baseline',
    position: 'relative',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    fontSize: theme.typography.size.s1,
    padding: '0px',
    pointerEvents: disabled ? 'none' : 'auto',

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
    display: 'inline-block',
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

const CircleIconStyled = styled(CircleIcon)({
  margin: '4px',
  verticalAlign: 'baseline',
});

const CheckIconStyled = styled(CheckIcon)({
  margin: '2px',
  verticalAlign: 'baseline',
});

interface CheckboxProps {
  checked?: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}
interface CheckboxState {
  indeterminate: boolean;
}

export const CheckboxContainer = styled.span({
  paddingLeft: '8px',
  verticalAlign: 'middle',
  alignSelf: 'center',
  lineHeight: '18px',
});

export class Checkbox extends Component<CheckboxProps, CheckboxState> {
  state: CheckboxState = { indeterminate: false };

  handleIndeterminateChange = (value: boolean): void => {
    this.setState({
      indeterminate: value,
    });
  };
  public setIndeterminate = (): void => {
    this.handleIndeterminateChange(true);
  };
  public resetIndeterminate = (): void => {
    this.handleIndeterminateChange(false);
  };
  render(): JSX.Element {
    const { checked, disabled, onValueChange } = this.props;
    const { indeterminate } = this.state;
    return (
      <Label disabled={disabled}>
        <input
          type="checkbox"
          onChange={(e) => {
            onValueChange(e.target.checked);
          }}
          checked={checked ?? false}
        />
        <Box>
          {indeterminate ? (
            <CircleIconStyled width="8" height="8" />
          ) : checked ? (
            <CheckIconStyled width="12" height="12" />
          ) : (
            ' '
          )}
        </Box>
      </Label>
    );
  }
}
