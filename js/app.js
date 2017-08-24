import * as loglevel from "loglevel";
import Vue from "vue";
import VueRouter from "vue-router";
import VueMaterial from "vue-material";
import 'vue-material/dist/vue-material.css'
import "../css/app.css";
import Util from "./Util"
import Visualizer from "./Visualizer.js";
import StationEditor from "./StationEditor.js"
import Station from "./Station"

window.log = loglevel.getLogger("liquidradio"); // Get a custom logger to prevent webpack-dev-server from controlling it
log.setDefaultLevel(process.env.NODE_ENV === 'production' ? "INFO" : "DEBUG");
log.debug("%cDebug messages enabled", "background: red; color: yellow; font-size: x-large");

Visualizer();
StationEditor();
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
        version: "1.1.1",
        stream: {
            play: false,
            offline: false,
            loading: false,
            volume: parseFloat(localStorage ? localStorage.getItem("volume") || "0.6" : "0.6"),
            el: "streamEl",
            dom: undefined,
            audioContext: undefined,
            mediaElSrc: undefined,
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
        "stream.play"(state) {
            if (!state) {
                this.stream.loading = false;
            }
            this.updatePlayState(state);
        },
        "stream.offline"(state) {
            if (state) {
                log.debug("Stream went offline");
                this.stream.play = false;
            }
        },
        "stream.volume"() {
            this.$refs[this.stream.el].volume = this.stream.volume;
            // Save volume setting to config
            if (localStorage) localStorage.setItem("volume", this.stream.volume);
        },
        "stream.stations": {
            handler() {
                //Whenever stations array changes save it to local browser storage
                if (localStorage) localStorage.setItem("stations", JSON.stringify(this.stream.stations));
            },
            deep: true
        },
        "visualizer.enabled"() {
            log.debug("visualizer watch, new value:", this.visualizer.enabled);
            if (localStorage) localStorage.setItem("visualizer", this.visualizer.enabled);
        }
    },
    beforeMount() {

        // 1. Add stations from server to local array
        const failedStations = [];
        stations.forEach((station) => {
            try {
                this.stream.stations.push(new Station(station.id, station.title, station.description, station.source));
            }
            catch(error) {
                failedStations.push(station);
            }
        });
        if(failedStations.length > 0) {
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
        this.updateDocumentTitle();
    },
    mounted() {
        this.stream.dom = this.$refs[this.stream.el]; // Get and save dom for further use

        // JS Audio API preparations for Visualizer
        const AudioContext = window.AudioContext || window.webkitAudioContext || false;

        // Check if AudioContext is supported by browser
        if (AudioContext) {
            this.stream.audioContext = new AudioContext(); // Create audio context for visualizer
            this.stream.mediaElSrc = this.stream.audioContext.createMediaElementSource(this.stream.dom); // for visualizer
            this.stream.mediaElSrc.connect(this.stream.audioContext.destination); // connect so we have audio
        }
        else {
            // If not supported by browser disable visualizer
            this.visualizer.enabled = false;
            this.visualizer.supported = false;
        }


        // Attach event listeners to stream dom to watch external changes
        this.stream.dom.addEventListener("play", () => {
            this.stream.play = true;
            this.stream.loading = true;
        });
        this.stream.dom.addEventListener("pause", () => {
            this.stream.play = false;
        });
        this.stream.dom.addEventListener("volumechange", () => {
            this.stream.volume = this.$refs[this.stream.el].volume;
        });
        this.stream.dom.addEventListener("stalled", (e) => {
            log.error("Stream stalled", e);
            this.notify("Stream stalled, check your connection.");
        });

        // Audio stream has sufficiently buffered and starts playing
        this.stream.dom.addEventListener("playing", () => {
            this.stream.loading = false;
            this.notify(`Now playing ${this.stream.currentStation.title}`, 2000);
        });

        // Attach error handler to source tag
        this.attachErrorHandler();
        // Attach error handler to audio stream element
        this.stream.dom.addEventListener("error", this.streamError);

        // Set initial volume of audio element
        this.$refs[this.stream.el].volume = this.stream.volume;

        // // Bind hotkey events // FIXME: Conflict with user input, only trigger if not in input field
        // window.onkeydown = (e) => {
        //     if (e.keyCode === 32) { // Spacebar toggles play state
        //         this.stream.play = !this.stream.play;
        //         e.preventDefault();
        //     }
        // };
    },
    methods: {
        /**
         * Attached error handler to last source element, this has to be re-triggered on station switch
         * @returns {undefined}
         */
        attachErrorHandler() {
            const sources = Array.from(this.stream.dom.getElementsByTagName("source"));
            sources[sources.length - 1].addEventListener("error", this.streamError);
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

            const index = Util.getStationIndex(this.stream.stations, id);
            if (index === -1) {
                throw new Error(`Attempted to switch to station with invalid station id ${id}`);
            }
            this.stream.currentStation = this.stream.stations[index];
            this.updateDocumentTitle();
            this.stream.play = false;
            // Wait for vue to update src url in audio element before triggering play()
            Vue.nextTick(() => {
                this.attachErrorHandler();
                this.catchUp(play);
            });
            router.push(id);
            log.debug("Switched station to", this.stream.currentStation.title, this.stream.currentStation);
        },


        resetStations() {
            log.debug("(TODO) Reset stations triggered");
            // TODO
        },

        updateDocumentTitle() {
            document.title = `${this.stream.currentStation.title} |️ ${this.title}`;
        },
        /**
         * Modify stream volume by modifier value. Bounds of volume are 0 - 1
         * @param {Number} value - Positive or negative number that will be added.
         * @returns {undefined}
         */
        changeVolume(value) {
            if (this.stream.volume + value > 1) {
                this.stream.volume = 1;
                log.debug("Hit upper bound for volume ctrl");
            }
            else if (this.stream.volume + value < 0) {
                this.stream.volume = 0;
                log.debug("Hit lower bound for volume ctrl");
            }
            else {
                this.stream.volume = Math.round((this.stream.volume + value) * 10) / 10;
                log.debug(`Modified volume by ${value} to ${this.stream.volume}`);
            }
        },
        /**
         * Trigger play or pause for audio el depending on state.
         * @param {Boolean} state - true if play, false if pause.
         * @returns {undefined}
         */
        updatePlayState(state) {
            const el = this.$refs[this.stream.el];
            log.debug("play state changed to", state);
            if (state) {
                el.play();
                log.debug("started stream");
            }
            else {
                el.pause();
                log.debug("stopped stream");
            }
        },
        /**
         * Reloads audio element to catch up in stream.
         * @param {Boolean} play - Flag whether play should be triggered after audio el reload
         * @returns {undefined}
         */
        catchUp(play = true) {
            this.stream.dom.load();

            if (play) {
                if (this.stream.play) {
                    this.updatePlayState(true);
                }
                else { // Stream play state was false before, set it to true (watcher will handle the dom play)
                    this.stream.play = true;
                }
            }

            this.stream.offline = false;
        },
        /**
         * Error handler audio stream.
         * @param {Event} e - Event fired including error information.
         * @returns {undefined}
         */
        streamError(e) {
            log.error("Error in stream", e);
            let msg = "Unknown Error";
            let trigger;

            // Error from source tag
            if (e.target.nodeName === "SOURCE") {
                log.debug("Error originates from SOURCE tag");

                log.debug("NetworkState", this.stream.dom.networkState);
                //NETWORK_NO_SOURCE
                if (this.stream.dom.networkState === 3) {
                    msg = "Station offline";
                    trigger = {text: "Switch Station", func: this.$refs.nav.open};
                }
            }
            // Error from audio tag
            else if (e.target.nodeName === "AUDIO") {
                log.debug("Error originates from AUDIO tag");
                log.error(e.target.error.code, e.target.error.message);
                msg = "Error: ";

                switch (e.target.error.code) {
                    case e.target.error.MEDIA_ERR_ABORTED:
                        msg += "Playback aborted by user.";
                        break;
                    case e.target.error.MEDIA_ERR_NETWORK:
                        msg += "Network error. Check your connection.";
                        break;
                    case e.target.error.MEDIA_ERR_DECODE:
                        msg += "Decoding error.";
                        break;
                    default:
                        msg += `Unknown error code ${e.target.code}`;
                        break;
                }
            }
            this.stream.offline = true;
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
        }
    }
});