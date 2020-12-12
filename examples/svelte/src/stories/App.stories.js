import AppComponent from '../App.svelte';

export default {
  title: 'App',
  component: AppComponent,
};

export const App = () => ({
  Component: AppComponent,
  props: {
		name: 'world'
	}
});
