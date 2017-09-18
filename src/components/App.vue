<template>
    <div class="phone-viewport" v-cloak>
        <md-whiteframe md-tag="md-toolbar" md-elevation="2" class="md-small">
            <md-button class="md-icon-button" v-on:click="$refs.nav.toggle()">
                <md-icon>menu</md-icon>
            </md-button>
            <h2 class="md-title" style="flex: 1">{{title}}</h2>
            <network-status online-icon="" tooltip="Network Offline"></network-status>
        </md-whiteframe>
        <md-sidenav class="md-left" ref="nav" v-on:close="stationEditMode = false">
            <md-toolbar class="md-small">
                <div class="md-toolbar-container">
                    <h3 class="md-title">{{title}} <sup id="versionInfo">{{version}}</sup></h3>
                    <md-avatar class="md-avatar-icon">
                        <md-icon>invert_colors</md-icon>
                    </md-avatar>
                </div>
            </md-toolbar>
            <md-list>
                <!-- Station list -->
                <md-list-item ref="stationList" class="md-primary">
                    <md-icon>music_note</md-icon>
                    <span>Stations</span>
                    <md-button class="md-icon-button"
                               v-on:click="stationEditMode = !stationEditMode;
                            stationEditMode ? openStationList(true) : undefined">
                        <md-icon>{{stationEditMode ? "done" : "mode_edit"}}</md-icon>
                    </md-button>
                    <md-list-expand>
                        <md-list>
                            <div v-if="stationEditMode">
                                <md-list-item class="md-inset" v-on:click="$refs.stationEditor.open()">
                                    <md-icon>add_circle_outline</md-icon>
                                    <span>Add Station</span>
                                </md-list-item>
                                <md-list-item class="md-inset" v-on:click="resetStations()">
                                    <md-icon>restore</md-icon>
                                    <span>Reset Stations</span>
                                </md-list-item>
                                <md-list-item class="md-inset" v-for="station in stream.stationList.arr"
                                              :key="station.id"
                                              v-on:click="$refs.stationEditor.open(station.id)">
                                    <span>{{station.title}}</span>
                                    <md-icon>reorder</md-icon>
                                </md-list-item>
                            </div>
                            <md-list-item v-if="!stationEditMode" class="md-inset"
                                          v-for="station in stream.stationList.arr"
                                          :key="station.id" :disabled="station.id === stream.currentStation.id"
                                          v-on:click="updateRoute(station.id); $refs.nav.toggle()">
                                <span>{{station.title}}</span>
                            </md-list-item>
                        </md-list>
                    </md-list-expand>
                </md-list-item>
                <md-list-item class="md-primary">
                    <md-icon>graphic_eq</md-icon>
                    <span>Visualizer</span>
                    <md-switch :disabled="!visualizer.supported" v-model="visualizer.enabled"
                               class="md-primary"></md-switch>
                </md-list-item>
            </md-list>
            <md-list>
                <!-- Social links -->
                <md-list-item class="md-primary">
                    <md-icon>favorite</md-icon>
                    <span>Follow Us</span>
                    <md-list-expand>
                        <md-list>
                            <md-list-item class="md-inset" v-for="link in socialLinks" :key="link.name"
                                          :href="link.url" target="_blank" v-on:click="$refs.nav.toggle()">
                                <span>{{link.name}}</span>
                            </md-list-item>
                        </md-list>
                    </md-list-expand>
                </md-list-item>
                <md-list-item v-if="shareSupported" v-on:click="openShareDialog()" class="md-primary">
                    <md-icon>share</md-icon>
                    <span>Share</span>
                </md-list-item>
                <md-list-item v-on:click="$refs.nav.toggle()" :href="repoLink" class="md-primary" target="_blank">
                    <md-icon>code</md-icon>
                    <span>Source</span>
                </md-list-item>
            </md-list>
        </md-sidenav>
        <div class="main-content" v-if="stream.currentStation">
            <h3>Now playing: {{stream.currentStation.title}}</h3>
            <p style="white-space: pre-wrap;">{{stream.currentStation.description}}</p>
        </div>
        <div id="streamCtrl">
            <md-button class="md-icon-button md-raised md-dense" v-on:click="$refs.player.changeVolume(-0.1)"
                       :disabled="player.volume === 0">
                <md-icon>remove</md-icon>
            </md-button>
            <md-button class="md-icon-button md-raised md-dense" v-on:click="$refs.player.changeVolume(0.1)"
                       :disabled="player.volume === 1">
                <md-icon>add</md-icon>
            </md-button>
            <md-button class="md-fab md-primary" :disabled="player.offline"
                       v-on:click="$refs.player.play = !player.play">
                <md-icon>{{player.play ? "pause" : "play_arrow"}}</md-icon>
                <md-tooltip md-delay="400" md-direction="top">{{player.play ? "Pause" : "Play"}}</md-tooltip>
            </md-button>
            <md-button class="md-fab" v-on:click="$refs.player.reload()">
                <md-icon>refresh</md-icon>
                <md-tooltip md-delay="400" md-direction="top">Reload</md-tooltip>
            </md-button>
        </div>
        <station-editor ref="stationEditor" :stations="stream.stationList"></station-editor>
        <stream-player
                ref="player"
                :station="stream.currentStation"
                v-on:error="streamError"
                v-on:state-change="playerStateChange"
        ></stream-player>
        <transition name="vf">
            <visualizer v-if="visualizer.enabled && visualizer.supported && player.play"
                        id="visualizer"
                        design="square"
                        barcolor="#E91E63"
                        :audio-context="$refs.player.audioContext"
                        :media-el-src="$refs.player.mediaElSrc"
            ></visualizer>
        </transition>
        <md-progress id="volumeBar" class="md-accent" :md-progress="player.volume*100"
                     :md-indeterminate="player.loading">
        </md-progress>
        <md-snackbar ref="notification-bar" :md-position="notification.position" :md-duration="notification.duration">
            <span>{{notification.message}}</span>
            <md-button v-if="notification.trigger" class="md-accent" @click="notification.trigger.func">
                {{notification.trigger.text}}
            </md-button>
        </md-snackbar>
    </div>
</template>

<style>
    #streamCtrl {
        z-index: 1;
        padding: 20px;
        position: fixed;
        bottom: 0;
        right: 0;
        display: flex;
        align-items: center;
    }
    .main-content {
        padding: 20px;
        display: flex;
        flex-direction: column;
        align-items: center;
        height: 90vh;
        overflow-y: auto;
        overflow-x: hidden;
    }
    #versionInfo {
        font-size: x-small;
    }
    #volumeBar, #visualizer {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
    }
    #visualizer {
        width: 100%;
        z-index: -1;
        opacity: 0.5;
        max-height: 55vh;
    }
    .vf-enter-active {
        animation: vf .5s;
    }
    .vf-leave-active {
        animation: vf .5s reverse;
    }
    @keyframes vf {
        0% {
            opacity: 0;
        }
        100% {
            opacity: .5;
        }
    }
    .md-dialog {
        min-width: 70vw;
    }
</style>

<script>
    import Vue from "vue"

    import StationList from "../StationList"

    import StreamPlayer from "./StreamPlayer.vue"
    import StationEditor from "./StationEditor.vue"
    import Visualizer from "./Visualizer.vue"
    import NetworkStatus from "./NetworkStatus.vue"

    export default {
        components: {
            StreamPlayer,
            StationEditor,
            Visualizer,
            NetworkStatus
        },
        data() {
            return {
                loglevel: process.env.NODE_ENV === 'production' ? "INFO" : "DEBUG",
                title: "Liquid Radio",
                repoLink: "https://github.com/Trikolon/liquidradio",
                version: "1.3.0",
                stream: {
                    currentStation: undefined,
                    stationList: new StationList()
                },
                player: {
                    offline: false,
                    loading: false,
                    play: false,
                    volume: 0
                },
                stationEditMode: false,
                notification: {
                    message: "",
                    duration: 4000,
                    position: "bottom center",
                    trigger: undefined,
                    el: "notification-bar"
                },
                visualizer: {
                    enabled: JSON.parse(localStorage ? localStorage.getItem("visualizer") || "true" : "true"),
                    supported: true
                },
                shareSupported: navigator.share !== undefined,
                socialLinks: [
                    {
                        name: "Facebook",
                        url: "https://facebook.com/liquidradio.pro"
                    },
                    {
                        name: "Instagram",
                        url: "https://instagram.com/liquidradio.pro"
                    }
                ]
            }
        },
        watch: {
            "$route"(to) {
                log.debug("ROUTE CHANGED");
                try {
                    this.switchStation(to.path.substring(1));
                }
                catch (e) {
                    this.$router.push(this.stream.stationList.arr[0].id);
                }
            },
            "stream.stationList.arr": {
                handler() {
                    //Whenever stations array changes save it to local browser storage
                    this.stream.stationList.save();
                },
                deep: true
            },
            "stream.currentStation"() {
                document.title = `${this.stream.currentStation.title} |️ ${this.title}`;
            },
            "visualizer.enabled"() {
                log.debug("visualizer watch, new value:", this.visualizer.enabled);
                if (localStorage) localStorage.setItem("visualizer", this.visualizer.enabled);
            }
        },
        beforeMount() {
            log.debug("Application BEFORE MOUNT", this);

            // Load station config from local storage and add them to stations array
            this.stream.stationList.load();

            // Add / refresh stations from server
            this.stream.stationList.addStations(stations, true);

            //Set initial station according to url parameter or liquid_radio as fallback
            //This has to be done after data init but before dom-bind.
            if (this.$route.path === "/") {
                this.switchStation(this.stream.stationList.arr[0].id, false);
            }
            else {
                try {
                    this.switchStation(this.$route.path.substring(1), false);
                }
                catch (e) {
                    log.debug(`Route url ${this.$route.path} doesn't contain valid station id, fallback to default.`);
                    this.switchStation(this.stream.stationList.arr[0].id, false);
                    this.$router.push(this.stream.stationList.arr[0].id);
                }
            }
        },
        mounted() {
            log.debug("Application MOUNTED", this);

            // If player does not provide audio api data for visualizer, disable visualizer
            if (!this.$refs.player.audioContext || !this.$refs.player.mediaElSrc) {
                log.debug("Audio API not supported, disabling Visualizer");
                this.visualizer.enabled = false;
                this.visualizer.supported = false;
            }


            // // Bind hotkey events
            window.onkeydown = (e) => {
                if (this.$refs.player && e.keyCode === 32) { // Spacebar toggles play state

                    const tagName = document.activeElement.tagName.toLowerCase();
                    if (tagName === "input" || tagName === "textarea") {
                        return;
                    }
                    if (this.$refs.player.offline) {
                        return;
                    }

                    this.$refs.player.play = !this.$refs.player.play;
                    e.preventDefault();
                }
            };
        },
        methods: {
            /**
             * Called for player state-change events. Updates variables for gui components.
             * @param {String} key - Name of player attribute (e.g. volume)
             * @param {Object} state - Value of player attribute (e.g. 0.4)
             * @returns {undefined}
             */
            playerStateChange(key, state) {
                this.player[key] = state;
                if (key === "play" && state === true) {
                    this.notify(`Now playing: ${this.stream.currentStation.title}`, 2000);
                }
            },
            /**
             * Expands or collapses station list depending on state
             * @param {Boolean} state - Expand if true, else collapse
             * @returns {undefined}
             */
            openStationList(state) {
                if (!this.$refs.stationList.mdExpandMultiple) {
                    this.$refs.stationList.resetSiblings();
                }
                this.$refs.stationList.calculatePadding();
                this.$refs.stationList.active = state;
            },
            /**
             * Switches to a different station in stream object and changes play state to true.
             * No action if station id is invalid
             * @param {String} id - Identifier of station to switch to.
             * @param {Boolean} play - Flag whether play should be triggered after station switch
             * @throws {Error} - If id is invalid or not found
             * @returns {undefined}
             */
            switchStation(id, play = true) {
                if (this.stream.currentStation && id === this.stream.currentStation.id) return;

                const station = this.stream.stationList.getStation(id);
                if (station === null) {
                    throw new Error(`Attempted to switch to station with invalid station id ${id}`);
                }
                this.stream.currentStation = station;

                // Wait for vue to update src url in audio element before triggering play()
                Vue.nextTick(() => {
                    this.$refs.player.reload(play);
                });
                log.debug("Switched station to", this.stream.currentStation.title, this.stream.currentStation);
            },
            /**
             * Resets station array and adds default stations from remote
             * @returns {undefined}
             */
            resetStations() {
                this.stream.stationList.clear();
                this.stream.stationList.addStations(stations);
            },
            /**
             * Helper method triggered by station switch from dom (navigation)
             * @param {String} path - Path to add to router
             * @returns {undefined}
             */
            updateRoute(path) {
                this.$router.push(path);
            },
            /**
             * Error handler audio stream.
             * @param {Event} event - Event fired including error information.
             * @param {String} message - Human readable error message.
             * @returns {undefined}
             */
            streamError(event, message = "Unknown Error") {
                log.error("Error in stream", event, message);
                this.notify(`Error: ${message}`, undefined, {
                    text: "Switch Station", func: () => {
                        this.openStationList(true);
                        this.$refs.nav.open();
                    }
                });
            },
            /**
             * Shows notification
             * @param {String} message - Text for notification.
             * @param {Number|undefined} duration - Duration of visibility.
             * @param {Object} trigger - If set: trigger.text: Button text, trigger.func: Function for button to trigger.
             * @returns {undefined}
             */
            notify(message, duration = 4000, trigger) {
                const el = this.$refs[this.notification.el];
                this.notification.duration = duration;
                this.notification.message = message;
                this.notification.trigger = trigger; // May be undefined if argument is not provided
                el.open();
            },

            /**
             * Open Android share dialog on supported devices
             * @returns {undefined}
             */
            openShareDialog() {
                if (window.navigator.share) {
                    window.navigator.share({
                        title: document.title,
                        text: `Listen to ${this.stream.currentStation.title} on ${this.title}.`,
                        url: window.location.href
                    })
                        .then(() => log.debug("Shared successfully"))
                        .catch(error => log.error("Error while sharing", error));
                }
                else {
                    log.error("Share dialog not supported by browser");
                }
            }
        }
    }
</script>
