import Vue from 'vue';
import routes from './routes';

const app = new Vue({
  el: '#app',
  data: {
    currentRoute: window.location.pathname,
  },
  computed: {
    ViewComponent() {
      const matchingView = routes[this.currentRoute];
      console.log('./pages/' + matchingView + '.vue');
      return matchingView
        ? require('./pages/' + matchingView + '.vue').default
        : require('./pages/404.vue').default;
    },
  },
  render(h) {
    console.log(this.ViewComponent);
    return h(this.ViewComponent);
  },
});

window.addEventListener('popstate', () => {
  app.currentRoute = window.location.pathname;
});
