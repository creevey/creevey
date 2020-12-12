import Header from './Header.svelte';

export default {
  title: 'Example/Header',
  component: Header,
  argTypes: {
    onLogin: { action: 'onLogin' },
    onLogout: { action: 'onLogout' },
    onCreateAccount: { action: 'onCreateAccount' },
  },
};

const Template = ({ onLogin, onLogout, onCreateAccount, ...args }) => ({
  Component: Header,
  props: args,
  on: {
    login: onLogin,
    logout: onLogout,
    createAccount: onCreateAccount,
  },
});

export const LoggedIn = Template.bind({});
LoggedIn.args = {
  user: {},
};

export const LoggedOut = Template.bind({});
LoggedOut.args = {};
