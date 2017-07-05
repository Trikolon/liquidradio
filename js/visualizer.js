Vue.component("audio-visualizer", {
    template: "<canvas width='1024' height='1024' style='border:1px solid #000000;' ></canvas>",
    props: ["audioel"],
    data (){
        return {
            divider: 16, // data "resolution" divider
            isInitialized: false
        }
    },
    computed: {
        dividerHalf() {
            return this.divider / 2;
        }
    },
    watch: {
        audioel(el) {
            if (!this.isInitialized && el) {
                this.init();
                this.isInitialized = true;
            }
        }
    },
    methods: {
        init() {
            this.audio = this.audioel;
            const ctx = new window.AudioContext();
            // this.audio.crossOrigin= "anonymous";
            this.audio = ctx.createMediaElementSource(this.audio);
            this.analyser = ctx.createAnalyser();
            this.analyser.fftSize = this.analyser.fftSize / this.divider;
            this.analyser.smoothingTimeConstant = 0.98;
            this.audio.connect(this.analyser);
            this.audio.connect(ctx.destination);
            this.canvas = this.$el;
            this.context = this.canvas.getContext("2d");
            const bufferLength = this.analyser.frequencyBinCount;
            this.dataArray = new Uint8Array(bufferLength);

            console.log("fftSize:", this.analyser.fftSize);
            console.log("this.divider:", this.divider);
            console.log("dataArray length:", this.dataArray.length);

            // Start animation
            requestAnimationFrame(this.draw);
        },
        draw() {
            // get data for bars
            this.analyser.getByteFrequencyData(this.dataArray);

            // clear before redraw
            this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.context.beginPath();

            // loop through data, draw bars
            for (let i = 0; i < this.dataArray.length; i++) {
                this.context.beginPath();
                this.context.lineWidth = this.divider - 2; // -2 to have small gap
                // offset by half because linewith goes both directions
                this.context.moveTo(this.dividerHalf + i * this.divider, this.canvas.height);
                this.context.lineTo(this.dividerHalf + i * this.divider, (this.canvas.height - Math.pow(this.dataArray[i] / 255, 3) * this.canvas.height));
                this.context.stroke();
            }
            requestAnimationFrame(this.draw);
        }
    }
});
