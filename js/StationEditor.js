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
        "            <md-button class='md-icon-button'><md-icon>delete</md-icon></md-button>" +
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
            open(id) {
                if (id) {
                    this.selectStation(id);
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
            }
        }
    })
}