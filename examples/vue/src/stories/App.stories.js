import AppComponent from '../App.vue';

export default {
  title: 'App',
  component: AppComponent,
};

export const App = () => ({
  components: { App: AppComponent },
  template: '<App />',
});
