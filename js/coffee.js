Vue.use(VueMaterial);
const app = new Vue({
    el: "#app",
    data: {
        loglevel: "DEBUG",
        title: "Liquid Radio",
        notSupportedMessage: "Your browser does not support audio streams, please update.",
        repoLink: "https://github.com/Trikolon/cfp-radio",
        version: "0.4",
        stream: {
            play: false,
            offline: false,
            loading: false,
            volume: 0.6,
            el: "streamEl",
            currentStation: undefined,
            stations
        },
        twitterFeed: {
            profile: "https://twitter.com/thecoffeepanda",
            theme: "dark"
        },
        notification: {
            message: "",
            duration: 4000,
            position: "bottom center",
            el: "notification-bar"
        }
    },
    watch: {
        "stream.play" (state) {
            if (!state) {
                this.stream.loading = false;
            }
            this.updatePlayState(state);
        },
        "stream.offline" (state) {
            if (state) {
                log.debug("Stream went offline");
                this.stream.play = false;
            }
        },
        "stream.volume" () {
            this.$refs[this.stream.el].volume = this.stream.volume;
        }

    },
    mounted() {
        const audioEl = this.$refs[this.stream.el];


        // Watch external changes
        audioEl.addEventListener("play", () => {
            this.stream.play = true;
            this.stream.loading = true;
        });
        audioEl.addEventListener("pause", () => {
            this.stream.play = false;
        });
        audioEl.addEventListener("volumechange", () => {
            this.stream.volume = this.$refs[this.stream.el].volume;
        });
        audioEl.addEventListener("stalled", () => {
            this.notify("Stream stalled, check your connection.");
        });

        // Audio stream has sufficiently buffered and starts playing
        audioEl.addEventListener("playing", () => {
            this.stream.loading = false;
            this.notify(`Now playing ${this.stream.currentStation.title}`, 2000);
        });


        Array.from(audioEl.getElementsByTagName("source")).forEach((source) => {
            source.addEventListener("error", this.streamError);
        });
        //Attach error handler to audio stream element
        audioEl.addEventListener("error", this.streamError);
    },
    beforeMount() {
        //Set default station to first in station list.
        //This has to be done after data init but before dom-bind.
        this.stream.currentStation = this.stream.stations[0];
    },
    methods: {
        /**
         * Toggles visibility of left side navigation
         */
        toggleNav() {
            this.$refs.nav.toggle();
        },
        /**
         * Switches to a different station in stream object and changes play state to true.
         * No action if station id is invalid
         * @param id - Identifier of station to switch to.
         */
        switchStation(id) {
            if (id === this.stream.currentStation.id) return;
            for (let i = 0; i < this.stream.stations.length; i++) {
                if (this.stream.stations[i].id === id) {
                    this.stream.currentStation = this.stream.stations[i];
                    this.stream.currentStationSource = 0;
                    this.stream.play = false;
                    // Wait for vue to update src url in audio element before triggering play()
                    Vue.nextTick(() => {
                        this.catchUp();
                        // this.stream.offline = false;
                        // this.stream.play = true;
                    });
                    log.debug("Switched station to", this.stream.currentStation.title, this.stream.currentStation);
                    return;
                }
            }
            log.error("Attempted to switch to station with invalid station id", id);
        },
        /**
         * Modify stream volume by modifier value. Bounds of volume are 0 - 1
         * @param value - Positive or negative number that will be added.
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
         * @param state - true if play, false if pause.
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
         */
        catchUp() {
            const el = this.$refs[this.stream.el];
            el.load();
            if (this.stream.play) {
                this.updatePlayState(true);
            }
            else {
                this.stream.play = true;
            }
            this.stream.offline = false;
        },
        /**
         * Error handler audio stream.
         * @param e - Event fired including error information.
         */
        streamError(e) {
            log.error("Error in stream", e);
            let msg = "Error: ";
            let error;


            if(e.target.nodeName === "SOURCE") {
                //error = this.$refs[this.stream.el].networkState;
            }
            else if (e.target.nodeName === "AUDIO") {

            }

            switch (error) {
                case e.target.error.MEDIA_ERR_ABORTED:
                    msg += "Playback aborted by user.";
                    break;
                case e.target.error.MEDIA_ERR_NETWORK:
                    msg += "Network error. Check your connection.";
                    break;
                case e.target.error.MEDIA_ERR_DECODE:
                    msg += "Decoding error.";
                    break;
                case e.target.error.MEDIA_ERR_SRC_NOT_SUPPORTED:
                case e.target.error.NETWORK_NO_SOURCE: //FIXME only source el?
                    msg = "Stream offline.";
                    break;
                default:
                    msg += "Unknown error";
                    break;
            }
            this.stream.offline = true;
            this.notify(msg);
        },
        /**
         * Shows notification
         * @param message - Text for notification.
         * @param duration - Duration of visibility.
         */
        notify(message, duration) {
            const el = this.$refs[this.notification.el];
            if (duration) {
                this.notification.duration = duration;
            }
            this.notification.message = message;
            el.open();
        }
    }
});
log.setDefaultLevel(app.loglevel);