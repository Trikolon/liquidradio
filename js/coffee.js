Vue.use(VueMaterial);
const app = new Vue({
    el: "#app",
    data: {
        loglevel: "INFO",
        title: "CFP Radio",
        notSupportedMessage: "Your browser does not support audio streams, please update.",
        stream: {
            play: false,
            type: "audio/mpeg",
            src: "http://s45.myradiostream.com:12036/listen.mp3",
            title: "CFP Radio",
            offline: false,
            el: "streamEl"
        },
        twitterFeed: {
            profile: "https://twitter.com/thecoffeepanda",
            theme: "dark"
        },
        notification: {
            message: "",
            duration: 4000,
            position: "top center",
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
        }
    },
    mounted: function () {
        //Attach error handler to audio stream element
        this.$refs[this.stream.el].addEventListener("error", this.streamError);
    },
    methods: {
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
                this.notify("Now playing " + this.stream.title, 2000);
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
                    this.stream.offline = true;
                    break;
                default:
                    msg += "Unkown error";
                    break;
            }
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