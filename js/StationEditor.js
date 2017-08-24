import Vue from "vue";
import * as log from "loglevel";
import Util from "./Util";

export default () => {
    Vue.component("station-editor", {
        template: "<div><md-dialog ref='dialog' v-on:close='validationError=undefined'>" +
        "        <md-dialog-title v-if='selectedStation'>{{selectedStation.isNew ? 'Add Station' : 'Edit Station'}}</md-dialog-title>" +
        "        <md-dialog-content v-if='selectedStation'>" +
        "           <md-input-container>" +
        "               <label>Name</label>" +
        "               <md-input required v-model=\"selectedStation.title\"></md-input>" +
        "           </md-input-container>" +
        "            <md-input-container>" +
        "                <label>Description</label>" +
        "                <md-input v-model=\"selectedStation.description\"></md-input>" +
        "            </md-input-container>" +
        "            <span v-if='validationError' style='color: red'>{{validationError}}</span>" +
        "            <md-dialog-actions>" +
        "                <md-button v-show='!selectedStation.isNew' class='md-icon-button' v-on:click='deleteHandler()'><md-icon>delete</md-icon></md-button>" +
        "                <md-button v-show='selectedStation.isNew' class='md-icon-button' v-on:click='addStation()'><md-icon>add</md-icon></md-button> " +
        "            </md-dialog-actions>" +
        "        </md-dialog-content>" +
        "    </md-dialog></div>",
        props: {
            stations: {
                default: [],
                type: Array
            }
        },
        data() {
            return {
                selectedStation: undefined,
                validationError: undefined
            }
        },
        methods: {

            /**
             * Opens station editor dialog. Creates new station if id not given
             * @param {String} id - Id of station to show
             * @returns {undefined}
             */
            open(id) {
                if (id) {
                    this.selectStation(id);
                }
                else {
                    this.selectedStation = {
                        isNew: true,
                        id: "",
                        title: "",
                        description: "",
                        source: [
                            {
                                src: "localhost",
                                type: "mp3"
                            }
                        ]

                    }
                }
                this.$refs.dialog.open();
            },

            /**
             * Add selectedStation to stations array
             * @returns {undefined}
             */
            addStation() {
                // Reset error field
                this.validationError = undefined;
                // Create station id by lowercasing string and replacing space with underscore
                this.selectedStation.id = this.selectedStation.title.replace(" ", "_").toLowerCase();

                // Attempt to add it to stations array
                try {
                    Util.addStation(this.stations, this.selectedStation.id, this.selectedStation.title, this.selectedStation.description, this.selectedStation.source);
                }
                catch (error) {
                    log.error("User attempted to add station but it failed", this.selectedStation, error);
                    this.validationError = error.message;
                }
            },

            selectStation(id) {
                for (let i = 0; i < this.stations.length; i++) {
                    if (this.stations[i].id === id) {
                        this.selectedStation = this.stations[i];
                        return;
                    }
                }
            },

            deleteHandler() {
                const index = stations.indexOf(this.selectedStation);
                if (index !== -1) {
                    this.stations.splice(stations.indexOf(this.selectedStation), 1);
                }
                this.$refs.dialog.close();
            },

            /**
             * Remove station from station array by id
             * @param {Number} id - Id to query station array for
             * @throws {Error} if station id not existing
             * @returns {undefined}
             */
            removeStation(id) {
                if (!id) {
                    throw new Error("Missing mandatory argument 'id'");
                }
                const index = Util.getStationIndex(this.stations, id);
                if (index === -1) {
                    throw new Error(`Station ${id} not found`);
                }
                this.stream.stations.splice(index, 1);
            }
        }
    })
}