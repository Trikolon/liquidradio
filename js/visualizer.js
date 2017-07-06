Vue.component("audio-visualizer", {
    template: "<canvas width='512' height='512'></canvas>",
    props: ["audioel"],
    data (){
        return {
            divider: 16, // data "resolution" divider
            isInitialized: false
        }
    },
    computed: {},
    watch: {
        audioel(el) {
            if (!this.isInitialized && el) {
                this.init();
                this.isInitialized = true;
            }
        }
    },
    mounted() {
        window.addEventListener("resize", this.resize);
    },
    methods: {
        init() {
            this.divider = 16; // data "resolution" divider
            // get audio element & build audio analyser
            this.ctx = new window.AudioContext();
            this.audio = this.ctx.createMediaElementSource(this.audioel); // FIXME don't reuse variable

            this.analyser = this.ctx.createAnalyser();
            this.analyser.fftSize = this.analyser.fftSize / this.divider;
            this.analyser.maxDecibels = -20;
            this.analyser.smoothingTimeConstant = 0.9;

            // connections to analyser and sound output
            this.audio.connect(this.analyser);
            this.audio.connect(this.ctx.destination); // disable when testing

            // setup data array
            this.bufferLength = this.analyser.frequencyBinCount;
            this.freqBytes = new Uint8Array(this.bufferLength);
            this.waveBytes = new Uint8Array(this.bufferLength);

            // setup canvas and canvas context variables
            this.canvas = this.$el;
            this.c = this.canvas.getContext("2d");

            this.resize();
            requestAnimationFrame(this.drawCircle);
        },
        /**
         * recalculate values needed by draw functions, supposed to be called on each resize event
         */
        recalc() {

            // calculate an upper bound, we want to skip the highest frequencies in the last third of the array
            this.upperbound = Math.round(this.freqBytes.length * 2 / 3);

            // for linear bars
            this.barWidth = Math.ceil(this.canvas.width / this.upperbound);
            this.offset = Math.floor(this.barWidth / 2);

            // for circle bars
            this.center = [this.canvas.width / 2, this.canvas.height / 2];
            this.minDim = Math.min(this.center[0], this.center[1]);
            this.cBarWith = (Math.min(this.center[0], this.center[1]) / this.upperbound);

            // grd = this.c.createRadialGradient(center[0], center[1], 0, center[0], center[1], Math.min(center[0], center[1]) - c.lineWidth / 2);
            this.grd = this.c.createLinearGradient(0, 0, 0, this.canvas.height); // alternative
            this.grd.addColorStop(0, "white");
            this.grd.addColorStop(1, "#1A237E");

            // this.c.strokeStyle = this.grd; // EXPENSIVE
            this.c.strokeStyle = "#3F51B5"; // material design primary

            console.debug("fftSize:           ", this.analyser.fftSize);
            console.debug("freqBytes length:  ", this.freqBytes.length);
            console.debug("upperbound:        ", this.upperbound);

            console.debug("offset:            ", this.offset);
            console.debug("cBarWith:          ", this.cBarWith);
        },

        /**
         * checks on window resize if canvas dimensions have changed. If so, update canvas client dimensions.
         * If step is skipped, canvas will be scaled and appears blurry.
         */
        resize() {
            console.log("resize event triggered");
            // Lookup the size the browser is displaying the canvas.
            const displayWidth = this.canvas.clientWidth;
            const displayHeight = this.canvas.clientHeight;

            // Check if the canvas is not the same size.
            if (this.canvas.width !== displayWidth ||
                this.canvas.height !== displayHeight) {

                // Make the canvas the same size
                this.canvas.width = displayWidth;
                this.canvas.height = displayHeight;

            }
            this.recalc();
        },

        /**
         * Draws vertical bars
         */
        draw() {
            // get data for bars
            this.analyser.getByteFrequencyData(this.freqBytes);
            // clear before redraw
            this.c.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.c.beginPath();


            // loop through data, draw bars
            for (let i = 0; i < this.freqBytes.length; i++) {
                this.c.beginPath();
                this.c.lineWidth = Math.max(this.barWidth - 1, 1); // -2 to have small gap
                // offset by half because linewith goes both directions
                this.c.moveTo(this.offset + i * this.barWidth, this.canvas.height);
                this.c.lineTo(this.offset + i * this.barWidth, (this.canvas.height - Math.pow(this.freqBytes[i] / 255, 3) * this.canvas.height));
                this.c.stroke();
            }

            requestAnimationFrame(this.draw);
        },


        /**
         * Draws circular bars
         */
        drawCircle() {
            // get data for bars
            this.analyser.getByteFrequencyData(this.freqBytes);

            this.c.clearRect(0, 0, this.canvas.width, this.canvas.height);

            // draw thin line from bottom to center, to hide render errors
            this.c.beginPath();
            this.c.moveTo(this.center[0], this.center[1]);
            this.c.lineTo(this.center[0], this.canvas.height);
            this.c.lineWidth = 1;
            this.c.stroke();

            this.c.lineWidth = Math.floor(this.cBarWith) + 2; // at least 2 extra pixels to prevent shimmering

            for (let i = 0; i <= this.upperbound; i++) {

                let powered = Math.pow(this.freqBytes[i] / 255, 2);
                // let powered = freqBytes[i] / 255; // To power, or not to power, that is the question

                // radius is minDim but take away half of linewidth, then decrease each step while going through array
                // -1 was added in order to contain outer bars inside circle outline
                let radius = Math.max(this.minDim - 1 - this.c.lineWidth / 2 - (this.minDim / this.upperbound) * i, 0);

                // draw first half
                this.c.beginPath();
                this.c.arc(this.center[0], this.center[1], radius, 0.5 * Math.PI, 0.5 * Math.PI + Math.PI * powered, false);
                this.c.stroke();

                // draw second half
                this.c.beginPath();
                this.c.arc(this.center[0], this.center[1], radius, 0.5 * Math.PI, 0.5 * Math.PI - Math.PI * powered, true);
                this.c.stroke();
            }

            // draw a thin outline of the circle
            this.c.beginPath();
            const origStyle = this.c.strokeStyle;
            this.c.strokeStyle = "#000000";
            this.c.lineWidth = 1;
            this.c.arc(this.center[0], this.center[1], this.minDim - 1, 0, 2 * Math.PI);
            this.c.stroke();
            this.c.strokeStyle = origStyle;

            requestAnimationFrame(this.drawCircle);
        }
    }
});