import Vue from "vue";
import * as log from "loglevel";

export default () => {
    Vue.component("station-editor", {
        template: "<div><md-dialog ref='dialog'>" +
        "        <md-dialog-title>Edit Station" +
        "        </md-dialog-title>" +
        "        <md-dialog-content v-if='selectedStation'>" +
        "           <md-input-container>" +
        "               <label>Name</label>" +
        "               <md-input v-model=\"selectedStation.title\"></md-input>" +
        "           </md-input-container>" +
        "            <md-input-container>" +
        "                <label>Description</label>" +
        "                <md-input v-model=\"selectedStation.description\"></md-input>" +
        "            </md-input-container>" +
        "            <md-button class='md-icon-button' v-on:click='deleteHandler()'><md-icon>delete</md-icon></md-button>" +
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
                selectedStation: undefined
            }
        },
        mounted() {
            log.debug("StationEditor mounted. Stations", this.stations);
            if (stations.length > 0) {
                this.selectedStation = stations[0];
            }
        },
        methods: {
            //TODO: On new station convert title to id (replacing space with underscore and make all lowercase)
            open(id) {
                if (id) {
                    this.selectStation(id);
                }
                else {
                    let newStation = {
                        id: "new_station",
                        title: "New Station",
                        description: "This is a new station.",
                        source: [
                            {
                                src: "localhost",
                                type: "mp3"
                            }
                        ]

                    };
                    this.selectedStation = newStation;
                    stations.push(newStation); //TODO: Rather do this with addStation() on user input
                }
                this.$refs.dialog.open();
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
                this.stations.splice(stations.indexOf(this.selectedStation), 1);
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
                const index = this.getStationIndex(id);
                if (index === -1) {
                    throw new Error(`Station ${id} not found`);
                }
                this.stream.stations.splice(index, 1);
            },

            /**
             * Add station to station array
             * @param {String} id - Id of station to add, must be unique.
             * @param {String} title - Display title (human readable).
             * @param {String} description - Description of station to be shown when selected.
             * @param {Array} source - Objects with src = url of audio stream and type to be injected into audio element.
             * @throws {Error} if arguments are invalid or station already existing.
             * @returns {undefined}
             */
            addStation(id, title, description = "", source) {

                // Test if arguments are defined and of the correct type
                if (!id || !title || !source || !Array.isArray(source) || source.length === 0 || title === "" || id === "") {
                    log.debug(arguments);
                    throw new Error("Invalid arguments for adding station");
                }

                // Test if station already existing
                if (this.getStationIndex(id) !== -1) {
                    throw new Error(`Station with id ${id} already existing!`);
                }

                //Validate source object
                for (let i = 0; i < source.length; i++) {
                    if (!source[i].hasOwnProperty("src") || !source[i].hasOwnProperty("type") || source[i].src === ""
                        || source[i].type === "") {
                        //TODO: test if src contains valid url
                        log.debug("Station source array", source);
                        throw new Error("Invalid source array for station")
                    }
                }
                this.stream.stations.push({id, title, description, source});
            },

            /**
             * Get station index by id
             * @param {number} id - Id to query station array for.
             * @returns {number} - Index of station in array or -1 if not found.
             */
            getStationIndex(id) {
                if (id) {
                    for (let i = 0; i < this.stream.stations.length; i++) {
                        if (this.stream.stations[i].id === id) {
                            return i;
                        }
                    }
                }
                return -1;
            },
        }
    })
}