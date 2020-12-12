import Page from './Page.svelte';
import * as HeaderStories from './Header.stories';

export default {
  title: 'Example/Page',
  component: Page,
  argTypes: {
    onLogin: { action: 'onLogin' },
    onLogout: { action: 'onLogout' },
    onCreateAccount: { action: 'onCreateAccount' },
  },
};

const Template = ({ onLogin, onLogout, onCreateAccount, ...args }) => ({
  Component: Page,
  props: args,
  on: {
    login: onLogin,
    logout: onLogout,
    createAccount: onCreateAccount,
  },
});

export const LoggedIn = Template.bind({});
LoggedIn.args = {
  ...HeaderStories.LoggedIn.args,
};

export const LoggedOut = Template.bind({});
LoggedOut.args = {
  ...HeaderStories.LoggedOut.args,
};
