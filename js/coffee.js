Vue.use(VueMaterial);
const app = new Vue({
    el: "#app",
    data: {
        notSupportedMessage: "Your browser does not support audio streams, please update.",
        stream: {
            play: false,
            type: "audio/mpeg",
            src: "http://equinox.shoutca.st:8702/;stream/1",
            el: "streamEl"
        },
        twitterFeed: {
            heading: "Tweets by @thecoffeepanda",
            profile: "https://twitter.com/thecoffeepanda",
            theme: "dark"
        }
    },
    watch: {
        'stream.play': function (state) {
            this.updatePlayState(state);
        }
    },
    methods: {
        /**
         * Trigger play or pause for audio el depending on state
         * @param state - true if play, false if pause
         */
        updatePlayState: function (state) {
            const el = this.$refs[this.stream.el];
            console.debug("play state changed to", state);
            if (state) {
                console.debug("started el");
                el.play();
            }
            else {
                console.debug("stopped el");
                el.pause();
            }
        },
        /**
         * Reloads audio el to catch up in stream
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
        }
    }
});