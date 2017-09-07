import Station from "./Station"

export default {
    template:
    "<div>" +
    "     <audio ref='audioEl' v-if='station' preload=\"metadata\" crossorigin=\"anonymous\">" +
    "         <source v-for=\"source in station.source\" :key=\"source.src\" :src=\"source.src\" :type=\"source.type\">" +
    "     </audio>" +
    "</div>",
    props: {
        station: {
            type: Station
        }
    },
    data() {
        return {
            volume: parseFloat(localStorage ? localStorage.getItem("volume") || "0.6" : "0.6"),
            play: false,
            offline: false,
            loading: false,
            audioContext: undefined,
            mediaElSrc: undefined
        }
    },
    watch: {
        "station"() {
            this.attachSourceErrorHandler(); // When station changes, re-attach error handler to new error element
        },
        "play"(state) {
            if (!state) {
                this.loading = false;
            }
            this.updatePlayState(state);
            this.$emit("state-change", "play", state);
        },
        "offline"(state) {
            if (state) {
                log.debug("Stream went offline");
                this.play = false;
            }
            this.$emit("state-change", "offline", state);
        },
        "loading"(state) {
            this.$emit("state-change", "loading", state);
        },
        "volume"(state) {
            this.$refs.audioEl.volume = state;
            // Save volume setting to config
            if (localStorage) localStorage.setItem("volume", state);
            this.$emit("state-change", "volume", state);
        }
    },
    beforeDestroy() {
        log.debug("StreamPlayer DESTROY", this);
    },
    mounted() {
        log.debug("StreamPlayer MOUNTED", this);
        const audioEl = this.$refs.audioEl;

        // Attach event listeners to stream dom to watch external changes
        audioEl.addEventListener("play", () => {
            this.loading = true;
            this.play = true;
        });
        audioEl.addEventListener("pause", () => {
            this.loading = false;
            this.play = false;
        });
        audioEl.addEventListener("volumechange", () => {
            this.volume = this.$refs.audioEl.volume;
        });
        // Audio stream has sufficiently buffered and starts playing
        audioEl.addEventListener("playing", () => {
            this.loading = false;
        });

        // Attach error handlers
        audioEl.addEventListener("error", this.errorHandler);
        audioEl.addEventListener("stalled", this.errorHandler);

        // Source tag special case
        this.attachSourceErrorHandler();

        // Audio API
        // Check if AudioContext is supported by browser
        const AudioContext = window.AudioContext || window.webkitAudioContext || false;
        if (AudioContext) {
            try {
                this.audioContext = new AudioContext(); // Create audio context for visualizer
                this.mediaElSrc = this.audioContext.createMediaElementSource(this.$refs.audioEl); // for visualizer
                this.mediaElSrc.connect(this.audioContext.destination); // connect so we have audio
            }
            catch (error) {
                log.error("StreamPlayer: Error while setting up AudioAPI", error);
            }
        }
        // Set initial volume of audio element
        this.$refs.audioEl.volume = this.volume;


        // Send events for initial state
        this.$emit("state-change", "play", this.play);
        this.$emit("state-change", "offline", this.offline);
        this.$emit("state-change", "loading", this.loading);
        this.$emit("state-change", "volume", this.volume);
    },
    methods: {
        /**
         * Attaches Listener to last source tag in html audio element and emits error event on error from el
         * @returns {undefined}
         */
        attachSourceErrorHandler() {
            const sources = Array.from(this.$refs.audioEl.getElementsByTagName("source"));
            sources[sources.length - 1].addEventListener("error", this.errorHandler);
        },

        /**
         * Called on error events of the audio element, emits error event with human readable message for parent
         * @param {Event} event - Event emitted by audio element
         * @returns {undefined}
         */
        errorHandler(event) {
            let message = "Unknown Error";

            const networkState = this.$refs.audioEl.networkState;
            // Check Network State
            if (networkState === 3) {
                message = "Stream offline";
                this.offline = true;
            }
            // Check stalled property
            else if (event.type === "stalled") {
                message = "Network stalled"
            }
            // Check error codes
            else if (event.target.error && event.target.error.code) {
                switch (event.target.error.code) {
                    case event.target.error.MEDIA_ERR_ABORTED:
                        message = "Playback aborted by user.";
                        break;
                    case event.target.error.MEDIA_ERR_NETWORK:
                        message = "Network error. Check your connection.";
                        break;
                    case event.target.error.MEDIA_ERR_DECODE:
                        message = "Decoding error.";
                        break;
                    default:
                        message = `Unknown error code ${event.target.code}`;
                        break;
                }
                this.offline = true;
            }
            // Emit event containing event info and human readable error
            this.$emit("error", event, message);
        },
        /**
         * Trigger play or pause for audio el depending on state.
         * @param {Boolean} state - true if play, false if pause.
         * @returns {undefined}
         */
        updatePlayState(state) {
            if (state) {
                this.$refs.audioEl.play();
                log.debug("Started playback");
            }
            else {
                this.$refs.audioEl.pause();
                log.debug("Stopped playback");
            }
        }
        ,
        /**
         * Reloads audio element to catch up in stream.
         * @param {Boolean} play - Flag whether play should be triggered after audio el reload
         * @returns {undefined}
         */
        reload(play = true) {
            log.debug("Reloading audio element. Current play state", this.play);
            this.$refs.audioEl.load();

            if (play) {
                if (this.play) {
                    this.updatePlayState(true);
                }
                else { // Stream play state was false before, set it to true (watcher will handle the dom play)
                    this.play = true;
                }
            }

            this.offline = false;
        }
        ,
        /**
         * Modify stream volume by modifier value. Bounds of volume are 0 - 1
         * @param {Number} value - Positive or negative number that will be added.
         * @returns {undefined}
         */
        changeVolume(value) {
            if (this.volume + value > 1) {
                this.volume = 1;
                log.debug("Hit upper bound for volume ctrl");
            }
            else if (this.volume + value < 0) {
                this.volume = 0;
                log.debug("Hit lower bound for volume ctrl");
            }
            else {
                this.volume = Math.round((this.volume + value) * 10) / 10;
                log.debug(`Modified volume by ${value} to ${this.volume}`);
            }
        }
        ,
    }
}