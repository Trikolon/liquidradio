import * as loglevel from "loglevel"
import Vue from "vue"
import VueRouter from "vue-router"
import VueMaterial from "vue-material"
import 'vue-material/dist/vue-material.css'

import "../css/app.css"
import StationList from "./StationList"

import StreamPlayer from "./components/StreamPlayer.vue"
import Visualizer from "./components/Visualizer.vue"
import StationEditor from "./components/StationEditor.vue"
import NetworkStatus from "./components/NetworkStatus.vue"

window.log = loglevel.getLogger("liquidradio"); // Get a custom logger to prevent webpack-dev-server from controlling it
log.setDefaultLevel(process.env.NODE_ENV === 'production' ? "INFO" : "DEBUG");
log.debug("%cDebug messages enabled", "background: red; color: yellow; font-size: x-large");


Vue.component("StreamPlayer", StreamPlayer);
Vue.component("StationEditor", StationEditor);
Vue.component("Visualizer", Visualizer);
Vue.component("NetworkStatus", NetworkStatus);
Vue.use(VueMaterial);
Vue.use(VueRouter);

const router = new VueRouter({});
const app = new Vue({
    router,
    el: "#app",
    data: {
        loglevel: process.env.NODE_ENV === 'production' ? "INFO" : "DEBUG",
        title: "Liquid Radio",
        repoLink: "https://github.com/Trikolon/liquidradio",
        version: "1.2.0",
        stream: {
            currentStation: undefined,
            stationList: new StationList()
        },
        player: {
            offline: false,
            loading: false,
            play: false,
            volume: 0
        },
        stationEditMode: false,
        notification: {
            message: "",
            duration: 4000,
            position: "bottom center",
            trigger: undefined,
            el: "notification-bar"
        },
        visualizer: {
            enabled: JSON.parse(localStorage ? localStorage.getItem("visualizer") || "true" : "true"),
            supported: true
        },
        shareSupported: navigator.share !== undefined,
        socialLinks: [
            {
                name: "Facebook",
                url: "https://facebook.com/liquidradio.pro"
            },
            {
                name: "Instagram",
                url: "https://instagram.com/liquidradio.pro"
            }
        ]
    },
    watch: {
        "$route"(to) {
            log.debug("ROUTE CHANGED");
            try {
                this.switchStation(to.path.substring(1));
            }
            catch (e) {
                router.push(this.stream.stationList.arr[0].id);
            }
        },
        "stream.stationList.arr": {
            handler() {
                //Whenever stations array changes save it to local browser storage
                this.stream.stationList.save();
            },
            deep: true
        },
        "stream.currentStation"() {
            document.title = `${this.stream.currentStation.title} |️ ${this.title}`;
        },
        "visualizer.enabled"() {
            log.debug("visualizer watch, new value:", this.visualizer.enabled);
            if (localStorage) localStorage.setItem("visualizer", this.visualizer.enabled);
        }
    },
    beforeMount() {
        log.debug("Application BEFORE MOUNT", this);

        // Load station config from local storage and add them to stations array
        this.stream.stationList.load();

        // Add / refresh stations from server
        this.stream.stationList.addStations(stations, true);

        //Set initial station according to url parameter or liquid_radio as fallback
        //This has to be done after data init but before dom-bind.
        if (this.$route.path === "/") {
            this.switchStation(this.stream.stationList.arr[0].id, false);
        }
        else {
            try {
                this.switchStation(this.$route.path.substring(1), false);
            }
            catch (e) {
                log.debug(`Route url ${this.$route.path} doesn't contain valid station id, fallback to default.`);
                this.switchStation(this.stream.stationList.arr[0].id, false);
                router.push(this.stream.stationList.arr[0].id);
            }
        }
    },
    mounted() {
        log.debug("Application MOUNTED", this);

        // If player does not provide audio api data for visualizer, disable visualizer
        if (!this.$refs.player.audioContext || !this.$refs.player.mediaElSrc) {
            log.debug("Audio API not supported, disabling Visualizer");
            this.visualizer.enabled = false;
            this.visualizer.supported = false;
        }


        // // Bind hotkey events
        window.onkeydown = (e) => {
            if (this.$refs.player && e.keyCode === 32) { // Spacebar toggles play state

                const tagName = document.activeElement.tagName.toLowerCase();
                if (tagName === "input" || tagName === "textarea") {
                    return;
                }
                if (this.$refs.player.offline) {
                    return;
                }

                this.$refs.player.play = !this.$refs.player.play;
                e.preventDefault();
            }
        };
    },
    methods: {
        /**
         * Called for player state-change events. Updates variables for gui components.
         * @param {String} key - Name of player attribute (e.g. volume)
         * @param {Object} state - Value of player attribute (e.g. 0.4)
         * @returns {undefined}
         */
        playerStateChange(key, state) {
            this.player[key] = state;
            if(key === "play" && state === true){
                this.notify(`Now playing: ${this.stream.currentStation.title}`, 2000);
            }
        },
        /**
         * Expands or collapses station list depending on state
         * @param {Boolean} state - Expand if true, else collapse
         * @returns {undefined}
         */
        openStationList(state) {
            if (!this.$refs.stationList.mdExpandMultiple) {
                this.$refs.stationList.resetSiblings();
            }
            this.$refs.stationList.calculatePadding();
            this.$refs.stationList.active = state;
        },
        /**
         * Switches to a different station in stream object and changes play state to true.
         * No action if station id is invalid
         * @param {String} id - Identifier of station to switch to.
         * @param {Boolean} play - Flag whether play should be triggered after station switch
         * @throws {Error} - If id is invalid or not found
         * @returns {undefined}
         */
        switchStation(id, play = true) {
            if (this.stream.currentStation && id === this.stream.currentStation.id) return;

            const station = this.stream.stationList.getStation(id);
            if (station === null) {
                throw new Error(`Attempted to switch to station with invalid station id ${id}`);
            }
            this.stream.currentStation = station;

            // Wait for vue to update src url in audio element before triggering play()
            Vue.nextTick(() => {
                this.$refs.player.reload(play);
            });
            log.debug("Switched station to", this.stream.currentStation.title, this.stream.currentStation);
        },
        /**
         * Resets station array and adds default stations from remote
         * @returns {undefined}
         */
        resetStations() {
            this.stream.stationList.clear();
            this.stream.stationList.addStations(stations);
        },
        /**
         * Helper method triggered by station switch from dom (navigation)
         * @param {String} path - Path to add to router
         * @returns {undefined}
         */
        updateRoute(path) {
            router.push(path);
        },
        /**
         * Error handler audio stream.
         * @param {Event} event - Event fired including error information.
         * @param {String} message - Human readable error message.
         * @returns {undefined}
         */
        streamError(event, message) {
            log.error("Error in stream", event, message);
            this.notify(`Error: ${message}`, undefined, {
                text: "Switch Station", func: () => {
                    this.openStationList(true);
                    this.$refs.nav.open();
                }
            });
        },
        /**
         * Shows notification
         * @param {String} message - Text for notification.
         * @param {Number} duration - Duration of visibility.
         * @param {Object} trigger - If set: trigger.text: Button text, trigger.func: Function for button to trigger.
         * @returns {undefined}
         */
        notify(message, duration = 4000, trigger) {
            const el = this.$refs[this.notification.el];
            this.notification.duration = duration;
            this.notification.message = message;
            this.notification.trigger = trigger; // May be undefined if argument is not provided
            el.open();
        },

        /**
         * Open Android share dialog on supported devices
         * @returns {undefined}
         */
        openShareDialog() {
            if (window.navigator.share) {
                window.navigator.share({
                    title: document.title,
                    text: `Listen to ${this.stream.currentStation.title} on ${this.title}.`,
                    url: window.location.href
                })
                    .then(() => log.debug("Shared successfully"))
                    .catch(error => log.error("Error while sharing", error));
            }
            else {
                log.error("Share dialog not supported by browser");
            }
        }
    }
});