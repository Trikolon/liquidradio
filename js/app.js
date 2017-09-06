import * as loglevel from "loglevel";
import Vue from "vue";
import VueRouter from "vue-router";
import VueMaterial from "vue-material";
import 'vue-material/dist/vue-material.css'
import "../css/app.css";
import Util from "./Util"
import Station from "./Station"

import StreamPlayer from "./StreamPlayer"
import Visualizer from "./Visualizer.js";
import StationEditor from "./StationEditor.js"

window.log = loglevel.getLogger("liquidradio"); // Get a custom logger to prevent webpack-dev-server from controlling it
log.setDefaultLevel(process.env.NODE_ENV === 'production' ? "INFO" : "DEBUG");
log.debug("%cDebug messages enabled", "background: red; color: yellow; font-size: x-large");


Vue.component("StreamPlayer", StreamPlayer);
Vue.component("StationEditor", StationEditor);
Vue.component("Visualizer", Visualizer);
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
            defaultStation: "liquid_radio",
            stations: []
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
            try {
                this.switchStation(to.path.substring(1), false);
            }
            catch (e) {
                this.switchStation(this.stream.defaultStation, false);
            }
        },
        "stream.stations": {
            handler() {
                //Whenever stations array changes save it to local browser storage
                if (localStorage) localStorage.setItem("stations", JSON.stringify(this.stream.stations));
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
        // 1. Add stations from server to local array
        const failedStations = [];
        stations.forEach((station) => {
            try {
                this.stream.stations.push(new Station(station.id, station.title, station.description, station.source));
            }
            catch (error) {
                failedStations.push(station);
            }
        });
        if (failedStations.length > 0) {
            log.error("Some stations failed to parse", failedStations);
        }

        // 2. Load additional station config from local storage and add them to existing stations (duplicates will be discarded)
        if (localStorage) {
            let storedStations = localStorage.getItem("stations");

            if (storedStations) {
                let failed = false;
                try {
                    storedStations = JSON.parse(storedStations);
                }
                catch (e) {
                    log.error("Could not parse station config from local storage");
                    localStorage.removeItem("stations"); // localStorage contains invalid data, lets remove it
                    failed = true;
                }

                // This might not be the best performing way, but it ensures the format is correct. localStorage could
                // contain invalid data; Also it prevents duplicates and default stations from being overwritten
                if (!failed) {
                    log.debug("Loaded stations object from localstorage", storedStations);
                    storedStations.forEach((station) => {
                        try {
                            Util.addStationObject(this.stream.stations, Station.fromJSON(station));
                        }
                        catch (e) {
                            log.debug("addStation() for local storage station failed", e);
                        }
                    });
                }
            }
        }

        //FIXME: switchStation before mount could cause issues, only put station in currentStation object, do not fiddle with audio dom
        //Set initial station according to url parameter or liquid_radio as fallback
        //This has to be done after data init but before dom-bind.
        if (this.$route.path === "/") {
            this.switchStation(this.stream.defaultStation, false);
        }
        else {
            try {
                this.switchStation(this.$route.path.substring(1), false);
            }
            catch (e) {
                log.debug(`Route url ${this.$route.path} doesn't contain valid station id, fallback to default.`);
                this.switchStation(this.stream.defaultStation, false);
            }
        }
    },
    mounted() {
        log.debug("Application MOUNTED", this);
        //TODO: Why do all components are created => destroyed => created?

        // If player does not provide audio api data for visualizer, disable visualizer
        if (!this.$refs.player.audioContext || !this.$refs.player.mediaElSrc) {
            log.debug("Audio API not supported, disabling Visualizer");
            this.visualizer.enabled = false;
            this.visualizer.supported = false;
        }


        // // Bind hotkey events
        window.onkeydown = (e) => {
            if (this.$refs.player && e.keyCode === 32 && document.activeElement.tagName.toLowerCase() !== "input") { // Spacebar toggles play state
                if (this.$refs.player.offline === false) {
                    this.$refs.player.play = !this.$refs.player.play;
                    e.preventDefault();
                }
            }
        };
    },
    methods: {
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

            const index = Util.getStationIndex(this.stream.stations, id);
            if (index === -1) {
                throw new Error(`Attempted to switch to station with invalid station id ${id}`);
            }
            this.stream.currentStation = this.stream.stations[index];

            // Wait for vue to update src url in audio element before triggering play()
            Vue.nextTick(() => {
                this.$refs.player.reload(play);
            });
            router.push(id);
            log.debug("Switched station to", this.stream.currentStation.title, this.stream.currentStation);
        },
        /**
         * Error handler audio stream.
         * @param {Event} error - Event fired including error information.
         * @param {Object} networkState - Additional info for stream error, maybe undefined.
         * @returns {undefined}
         */
        streamError(error, networkState) {
            log.error("Error in stream", error);
            let msg = "Unknown Error";
            let trigger;

            // Error from source tag
            if (error.target.nodeName === "SOURCE" && networkState) {
                log.debug("Error originates from SOURCE tag");

                log.debug("NetworkState", networkState);
                //NETWORK_NO_SOURCE
                if (networkState === 3) {
                    msg = "Station offline";
                    trigger = {text: "Switch Station", func: this.$refs.nav.open};
                }
            }
            // Error from audio tag
            else if (error.target.nodeName === "AUDIO") {
                log.debug("Error originates from AUDIO tag");
                log.error(error.target.error.code, error.target.error.message);
                msg = "Error: ";

                switch (error.target.error.code) {
                    case error.target.error.MEDIA_ERR_ABORTED:
                        msg += "Playback aborted by user.";
                        break;
                    case error.target.error.MEDIA_ERR_NETWORK:
                        msg += "Network error. Check your connection.";
                        break;
                    case error.target.error.MEDIA_ERR_DECODE:
                        msg += "Decoding error.";
                        break;
                    default:
                        msg += `Unknown error code ${error.target.code}`;
                        break;
                }
            }
            this.$refs.player.offline = true;
            this.notify(msg, undefined, trigger);
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
        openShareDialog() {
            if (navigator.share) {
                navigator.share({
                    title: document.title,
                    text: this.title,
                    url: window.location.href
                })
                    .then(() => log.debug("Shared successfully"))
                    .catch(error => log.error("Error while sharing", error));
            }
            else {
                log.debug("Sharing not supported by browser");
            }
        }
    }
});