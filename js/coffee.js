Vue.use(VueMaterial);
const app = new Vue({
    el: "#app",
    data: {
        loglevel: "INFO",
        title: "Liquid Radio",
        notSupportedMessage: "Your browser does not support audio streams, please update.",
        repoLink: "https://github.com/Trikolon/cfp-radio",
        version: "0.3",
        stream: {
            play: false,
            offline: false,
            volume: 0.7,
            el: "streamEl",
            currentStation: undefined,
            stations: [
                {
                    id: "liquid_radio",
                    type: "audio/mpeg",
                    src: "http://s45.myradiostream.com:12036/listen.mp3",
                    title: "Liquid Radio"
                },
                {
                    id: "bassdrive",
                    type: "audio/mpeg",
                    src: "http://equinox.shoutca.st:8702/;stream/1",
                    title: "Bassdrive"
                }
            ],
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
        "stream.play": function (state) {
            this.updatePlayState(state);
        },
        "stream.offline": function (state) {
            if (state) {
                this.stream.play = false;
            }
        },
        "stream.volume": function () {
            this.$refs[this.stream.el].volume = this.stream.volume;
        }
    },
    mounted: function () {
        let audioEl = this.$refs[this.stream.el];

        audioEl.addEventListener("play", () => {
            this.stream.play = true;
        });
        audioEl.addEventListener("pause", () => {
            this.stream.play = false;
        });
        audioEl.addEventListener("stalled", () => {
            this.notify("Stream stalled, check your connection.");
        });
        //Attach error handler to audio stream element
        audioEl.addEventListener("error", this.streamError);
    },
    beforeMount: function () {
        //Set default station to first in station list.
        //This has to be done after data init but before dom-bind.
        this.stream.currentStation = this.stream.stations[0];
    },
    methods: {
        /**
         * Toggles visibility of left side navigation
         */
        toggleNav: function () {
            this.$refs.nav.toggle();
        },
        switchStation: function (id) {
            if (id === this.stream.currentStation.id) return;
            for (let i = 0; i < this.stream.stations.length; i++) {
                if (this.stream.stations[i].id === id) {
                    this.stream.currentStation = this.stream.stations[i];
                    // Wait for vue to update src url in audio element before triggering play()
                    Vue.nextTick(() => {
                        this.stream.offline = false;
                        this.stream.play = true;
                    });
                    return;
                }
            }
            log.error("Attempted to switch to station with invalid station id", id);
        },
        /**
         * Modify stream volume by modifier value. Bounds of volume are 0 - 1
         * @param value - Positive or negative number that will be added.
         */
        changeVolume: function (value) {
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
                log.debug("Modified volume by " + value + " to " + this.stream.volume);
            }
        },
        /**
         * Trigger play or pause for audio el depending on state.
         * @param state - true if play, false if pause.
         */
        updatePlayState: function (state) {
            const el = this.$refs[this.stream.el];
            log.debug("play state changed to", state);
            if (state) {
                el.play();
                log.debug("started stream");
                this.notify("Now playing " + this.stream.currentStation.title, 2000);
            }
            else {
                el.pause();
                log.debug("stopped stream");
            }
        },
        /**
         * Reloads audio element to catch up in stream.
         */
        catchUp: function () {
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
        streamError: function (e) {
            log.error("Error in stream", e);
            let msg = "Error: ";
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
                case e.target.error.MEDIA_ERR_SRC_NOT_SUPPORTED:
                    msg += "Stream offline.";
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
        notify: function (message, duration) {
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