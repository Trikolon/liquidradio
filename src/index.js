import * as loglevel from "loglevel"
import Vue from "vue"
import VueRouter from "vue-router"
import VueMaterial from "vue-material"
import 'vue-material/dist/vue-material.css'

import App from "./components/App.vue"

window.log = loglevel.getLogger("liquidradio"); // Get a custom logger to prevent webpack-dev-server from controlling it
log.setDefaultLevel(process.env.NODE_ENV === 'production' ? "INFO" : "DEBUG");
log.debug("%cDebug messages enabled", "background: red; color: yellow; font-size: x-large");

Vue.use(VueMaterial);
Vue.use(VueRouter);

const router = new VueRouter({});
const app = new Vue({
    components: {
        "App": App
    },
    router,
    el: "#app"
});