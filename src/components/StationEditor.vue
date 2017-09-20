<template>
    <div>
        <md-dialog ref='dialog' v-on:close="validationError=undefined">
            <md-dialog-title v-if="selectedStation">
                <div>{{selectedStation.isNew ? "Add Station" : "Edit Station"}}</div>
                <md-button style="position: absolute; right: 10px; top: 10px;" class="md-icon-button"
                           v-on:click="$refs.dialog.close()">
                    <md-icon>close</md-icon>
                </md-button>
            </md-dialog-title>
            <md-dialog-content v-if="selectedStation">
                <md-input-container>
                    <label>Name</label>
                    <md-input required maxlength="20" v-model="selectedStation.title"></md-input>
                </md-input-container>
                <md-input-container>
                    <label>Description</label>
                    <md-textarea v-model="selectedStation.description"></md-textarea>
                </md-input-container>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <h3>Sources</h3>
                    <md-button v-on:click="selectedStation.source.push({src: ``, type: ``})"
                            class="md-icon-button md-raised md-dense">
                        <md-icon>add</md-icon>
                    </md-button>
                </div>
                <md-whiteframe v-for="source in selectedStation.source" key="{{source.src}}" md-elevation="2"
                               style="padding: 10px 20px; margin-bottom: 5px;">
                    <md-input-container md-clearable>
                        <label>URL</label>
                        <md-input required v-model="source.src"></md-input>
                    </md-input-container>
                    <md-input-container>
                        <label>Type</label>
                        <md-input v-model="source.type"></md-input>
                    </md-input-container>
                    <md-button v-show="selectedStation.source.length > 1"
                               v-on:click="selectedStation.source.splice(selectedStation.source.indexOf(source),1)"
                               class="md-icon-button md-dense">
                        <md-icon>delete</md-icon>
                    </md-button>
                </md-whiteframe>
                <span v-if="validationError" style="color: red">{{validationError}}</span>
                <md-dialog-actions>
                    <md-button v-show="!selectedStation.isNew" class="md-accent" v-on:click="deleteHandler()">delete
                    </md-button>
                    <md-button v-show="!selectedStation.isNew" class="md-primary md-raised"
                               v-on:click="saveStationEdit()">save
                    </md-button>
                    <md-button v-show="selectedStation.isNew" class="md-primary md-raised" v-on:click="addStation()">
                        add
                    </md-button>
                </md-dialog-actions>
            </md-dialog-content>
        </md-dialog>
    </div>
</template>

<script>
    import StationList from "../StationList"

    export default {
        props: {
            stations: {
                default: [],
                type: StationList
            }
        },
        data() {
            return {
                selectedStation: undefined,
                validationError: undefined
            }
        },
        beforeDestroy() {
            log.debug("StationEditor DESTROY", this);
        },
        mounted() {
            log.debug("Station editor MOUNTED", this);
        },
        methods: {

            /**
             * Opens station editor dialog. Creates new station if id not given
             * @param {String} id - Id of station to show
             * @returns {undefined}
             */
            open(id) {
                if (id) {
                    const s = this.stations.getStation(id);
                    if (s === null) {
                        throw new Error("StationEditor: Open called with invalid station id");
                    }
                    const station = s.clone();
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
                                src: "",
                                type: ""
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
                    this.stations.addStation(this.selectedStation.id, this.selectedStation.title,
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
                // Reset error field
                this.validationError = undefined;
                try {
                    const station = this.stations.getStation(this.selectedStation.id);
                    if (station === null) {
                        log.error("Attempted to save station data but could not find station in array by id");
                    }
                    const dst = station;
                    const src = this.selectedStation;
                    dst.id = src.id;
                    dst.title = src.title;
                    dst.description = src.description;
                    dst.source = src.source;
                }
                catch (error) {
                    log.error("User attempted to edit station but it failed", this.selectedStation, error);
                    this.validationError = error.message;
                    return;
                }
                this.$refs.dialog.close();
            },
            /**
             * Deletes currently selected station from stations array and closes StationEditor dialog
             * @returns {undefined}
             */
            deleteHandler() {
                try {
                    // Station removed via id because selectedStation isn't a proper Station object (validation constraints)
                    this.stations.removeStation(this.selectedStation.id);
                    this.$refs.dialog.close();
                }
                catch (error) {
                    log.error("Error while removing station", error, this.selectedStation);
                }
            }
        }
    }
</script>