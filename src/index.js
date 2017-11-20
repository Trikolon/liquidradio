import * as loglevel from 'loglevel';
import Vue from 'vue';
import VueRouter from 'vue-router';
import VueMaterial from 'vue-material';
import 'vue-material/dist/vue-material.css';
import * as OfflinePluginRuntime from 'offline-plugin/runtime';
import Raven from 'raven-js';
import RavenVue from 'raven-js/plugins/vue';

import App from './components/App.vue';

window.log = loglevel.getLogger('liquidradio'); // Get a custom logger to prevent webpack-dev-server from controlling it

if (process.env.NODE_ENV === 'production') {
  Raven
    .config('https://81882876703347e89790f8c3cc71362e@sentry.io/248115')
    .addPlugin(RavenVue, Vue)
    .install();
  log.setDefaultLevel('INFO');
  OfflinePluginRuntime.install();
} else {
  log.setDefaultLevel('DEBUG');
}
log.debug('%cDebug messages enabled', 'background: red; color: yellow; font-size: x-large');


Vue.use(VueMaterial);
Vue.use(VueRouter);

const router = new VueRouter({});
// eslint-disable-next-line no-unused-vars
const app = new Vue({
  components: {
    App,
  },
  router,
  el: '#app',
});
