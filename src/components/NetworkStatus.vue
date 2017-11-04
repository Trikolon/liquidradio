<template>
    <div v-if='isVisible()'>
        <md-tooltip md-direction='left'>{{this.tooltip}}</md-tooltip>
        <md-icon>{{status ? this.onlineIcon : this.offlineIcon}}</md-icon>
    </div>
</template>

<script>
  export default {
    props: {
      onlineIcon: {
        default: 'cloud_queue',
      },
      offlineIcon: {
        default: 'cloud_off',
      },
      tooltip: {
        default: 'Network Status',
      },
    },
    data() {
      return {
        status: navigator.onLine,
      };
    },
    beforeDestroy() {
      log.debug('NetworkStatus DESTROY', this);
    },
    mounted() {
      log.debug('NetworkStatus MOUNTED', this);

      window.addEventListener('online', () => this.statusHandler(true));
      window.addEventListener('offline', () => this.statusHandler(false));
    },
    methods: {
      isVisible() {
        if (this.status) {
          return this.onlineIcon !== '';
        }

        return this.offlineIcon !== '';
      },
      statusHandler(status) {
        this.status = status;
        this.$emit('status-change', status);
      },
    },
  };
</script>
