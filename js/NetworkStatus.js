export default {
    template:
    "<div>" +
    "    <md-tooltip md-direction='left'>Network Status</md-tooltip>" +
    "    <md-icon>{{status ? 'cloud_queue' : 'cloud_off'}}</md-icon>" +
    "</div>",
    data() {
        return {
            status: navigator.onLine
        }
    },
    beforeDestroy() {
        log.debug("NetworkStatus DESTROY", this);
    },
    mounted() {
        log.debug("NetworkStatus MOUNTED", this);

        window.addEventListener('online',  () => this.statusHandler(true));
        window.addEventListener('offline', () => this.statusHandler(false));
    },
    methods: {
        statusHandler(status) {
            this.status = status;
            this.$emit("status-change", status);
        }
    }
}