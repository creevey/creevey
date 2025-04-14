// NOTE: This file is a modified version of the makeDecorator function from Storybook.
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Addon_StoryContext, Addon_LegacyStoryFn, Addon_StoryWrapper } from '@storybook/types';

export interface MakeDecoratorOptions {
  name: string;
  parameterName: string;
  skipIfNoParametersOrOptions?: boolean;
  wrapper: Addon_StoryWrapper;
}

export type MakeDecoratorResult = (...args: any) => any;

export const makeDecorator = ({
  name,
  parameterName,
  wrapper,
  skipIfNoParametersOrOptions = false,
}: MakeDecoratorOptions): MakeDecoratorResult => {
  const decorator = (options?: object) => (storyFn: Addon_LegacyStoryFn, context: Addon_StoryContext) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unnecessary-condition
    const parameters = context.parameters?.[parameterName];

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (parameters?.disable) {
      return storyFn(context);
    }

    if (skipIfNoParametersOrOptions && !options && !parameters) {
      return storyFn(context);
    }

    // @ts-expect-error - decorator is a function that returns a function
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-assignment
    return wrapper(storyFn, context, { options, parameters });
  };

  return (...args: any) => {
    // Used without options as .addDecorator(decorator)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (typeof args[0] === 'function') {
      // @ts-expect-error - decorator is a function that returns a function
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument
      return decorator()(...args);
    }

    return (...innerArgs: any): any => {
      // Used as [.]addDecorator(decorator(options))
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (innerArgs.length > 1) {
        // Used as [.]addDecorator(decorator(option1, option2))
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (args.length > 1) {
          // @ts-expect-error - decorator is a function that returns a function
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          return decorator(args)(...innerArgs);
        }
        // @ts-expect-error - decorator is a function that returns a function
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        return decorator(...args)(...innerArgs);
      }

      throw new Error(
        `Passing stories directly into ${name}() is not allowed,
        instead use addDecorator(${name}) and pass options with the '${parameterName}' parameter`,
      );
    };
  };
};
