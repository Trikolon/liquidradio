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
            this.attachErrorHandler(); // When station changes, re-attach error handler to new error element
        },
        "play"(state) {
            if (!state) {
                this.loading = false;
            }
            this.updatePlayState(state);
        },
        "offline"(state) {
            if (state) {
                log.debug("Stream went offline");
                this.play = false;
            }
        },
        "volume"() {
            // Save volume setting to config
            if (localStorage) localStorage.setItem("volume", this.volume);
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
            this.$emit("play", true);
        });
        audioEl.addEventListener("pause", () => {
            this.loading = false;
            this.$emit("play", false);
        });
        audioEl.addEventListener("volumechange", () => {
            this.$emit("volumechange");
        });

        //TODO: Integrate this into error event
        audioEl.addEventListener("stalled", (error) => {
            // this.$emit("stalled", error);
            this.$emit("error", error);
        });

        // Audio stream has sufficiently buffered and starts playing
        audioEl.addEventListener("playing", () => {
            this.loading = false;
            this.$emit("playing");
        });
        audioEl.addEventListener("error", (error) => {
            this.$emit("error", error);
        });

        // Source tag special case
        this.attachErrorHandler();

        // Audio API
        // Check if AudioContext is supported by browser
        const AudioContext = window.AudioContext || window.webkitAudioContext || false;
        if (AudioContext) {
            try {
                this.audioContext = new AudioContext(); // Create audio context for visualizer
                log.debug("this.$refs.audioEl", this.$refs.audioEl, this.$refs.audioEl.attributes);
                this.mediaElSrc = this.audioContext.createMediaElementSource(this.$refs.audioEL); // for visualizer
                this.mediaElSrc.connect(this.audioContext.destination); // connect so we have audio
            }
            catch(error) {
                log.error("StreamPlayer: Error while setting up AudioAPI", error);
            }
        }
        // Set initial volume of audio element
        this.$refs.audioEl.volume = this.volume;

    },
    methods: {
        /**
         * Attaches Listener to last source tag in html audio element and emits error event on error from el
         * @returns {undefined}
         */
        attachErrorHandler() {
            const sources = Array.from(this.$refs.audioEl.getElementsByTagName("source"));
            sources[sources.length - 1].addEventListener("error", (error) => {
                log.debug("networkState property access", this.$refs.audioEl, this.$refs);
                this.$emit("error", error, this.$refs.audioEl.networkState);
            });
        },
        /**
         * Trigger play or pause for audio el depending on state.
         * @param {Boolean} state - true if play, false if pause.
         * @returns {undefined}
         */
        updatePlayState(state) {
            log.debug("play state changed to", state);
            if (state) {
                this.$refs.audioEl.play();
                log.debug("started stream");
            }
            else {
                this.$refs.audioEl.pause();
                log.debug("stopped stream");
            }
        },
        /**
         * Reloads audio element to catch up in stream.
         * @param {Boolean} play - Flag whether play should be triggered after audio el reload
         * @returns {undefined}
         */
        reload(play = true) {
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
        },
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
        },
    }
}