import Vue from "vue"
import Util from "./Util"
import Station from "./Station"

export default () => {
    Vue.component("station-editor", {
        template: "<div><md-dialog ref='dialog' v-on:close='validationError=undefined'>" +
        "        <md-dialog-title v-if='selectedStation'>" +
        "            <div>{{selectedStation.isNew ? 'Add Station' : 'Edit Station'}}</div>" +
        "            <md-button style='position: absolute; right: 10px; top: 10px;' class='md-icon-button'" +
        "                v-on:click='$refs.dialog.close()'><md-icon>close</md-icon></md-button></md-dialog-title>" +
        "        <md-dialog-content v-if='selectedStation'>" +
        "           <md-input-container>" +
        "               <label>Name</label>" +
        "               <md-input required v-model=\"selectedStation.title\"></md-input>" +
        "           </md-input-container>" +
        "            <md-input-container>" +
        "                <label>Description</label>" +
        "                <md-input v-model=\"selectedStation.description\"></md-input>" +
        "            </md-input-container>" +
        "            <h3>Sources</h3>" +
        "            <md-whiteframe v-for='source in selectedStation.source' key='{{source.src}}' md-elevation='2'" +
        "                style='padding: 10px 20px; margin-bottom: 5px;'>" +
        "                <md-input-container md-clearable>" +
        "                    <label>URL</label>" +
        "                    <md-input v-model='source.src'></md-input>" +
        "                </md-input-container>" +
        "                <md-input-container>" +
        "                    <label>Type</label>" +
        "                    <md-input v-model='source.type'></md-input>" +
        "                </md-input-container>" +
        "            </md-whiteframe>" +
        "            <span v-if='validationError' style='color: red'>{{validationError}}</span>" +
        "            <md-dialog-actions>" +
        "                <md-button v-show='!selectedStation.isNew' class='md-accent' v-on:click='deleteHandler()'>delete</md-button>" +
        "                <md-button v-show='!selectedStation.isNew' class='md-primary' v-on:click='saveStationEdit()'>save</md-button> " +
        "                <md-button v-show='selectedStation.isNew' class='md-primary' v-on:click='addStation()'>add</md-button> " +
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
                    const stationIndex = Util.getStationIndex(this.stations, id);
                    if (stationIndex === -1) {
                        throw new Error("StationEditor: Open called with invalid station id");
                    }
                    const station = this.stations[stationIndex].clone();
                    // this.selectedStation = station.clone();
                    this.selectedStation = {
                        id: station.id,
                        title: station.title,
                        description: station.description,
                        source: station.source
                    }
                }
                else {
                    // Provisional station object structure to be validated only on addStation trigger by user
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

                    };
                }
                this.$refs.dialog.open();
            },

            /**
             * Add selectedStation to stations array
             * Called by add button
             * @returns {undefined}
             */
            addStation() {
                // Reset error field
                this.validationError = undefined;
                // Create station id by lowercasing string and replacing space with underscore
                this.selectedStation.id = this.selectedStation.title.replace(" ", "_").toLowerCase();

                // Attempt to add it to stations array
                try {
                    Util.addStation(this.stations, this.selectedStation.id, this.selectedStation.title,
                        this.selectedStation.description, this.selectedStation.source);
                }
                catch (error) {
                    log.error("User attempted to add station but it failed", this.selectedStation, error);
                    this.validationError = error.message;
                    return;
                }
                this.$refs.dialog.close();
            },

            /**
             * Validates changes to currently selected station and applies them if valid
             * Called by save button
             * @returns {undefined}
             */
            saveStationEdit() {
                //FIXME: Vuejs doesn't detect object change because we replace it, we should rather copy fields one by one to *old* object or manually trigger change
                // Reset error field
                this.validationError = undefined;

                try {
                    const stationIndex = Util.getStationIndex(this.stations, this.selectedStation.id);
                    if (stationIndex === -1) {
                        log.error("Attempted to save station data but could not find station in array by id");
                    }
                    this.stations[stationIndex] = new Station(this.selectedStation.id, this.selectedStation.title,
                        this.selectedStation.description, this.selectedStation.source);
                }
                catch (error) {
                    log.error("User attempted to edit station but it failed", this.selectedStation, error);
                    this.validationError = error.message;
                    return;
                }
                this.$refs.dialog.close();
            },


            deleteHandler() {
                const index = Util.getStationIndex(this.stations, this.selectedStation.id);
                if (index !== -1) {
                    this.stations.splice(stations.indexOf(this.selectedStation), 1);
                    this.$refs.dialog.close();
                }
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