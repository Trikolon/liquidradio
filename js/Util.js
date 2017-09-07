import Station from "./Station"

const util = {
    /**
     * Adds station to station array. Validates station arguments.
     * @param {Array} stations - Array to add station to if valid.
     * @param {String} id - Id of station to add, must be unique.
     * @param {String} title - Display title (human readable).
     * @param {String} description - Description of station to be shown when selected.
     * @param {Array} source - Objects with src = url of audio stream and type to be injected into audio element.
     * @param {Boolean} overwrite - Overwrite if duplicate
     * @throws {Error} if arguments are invalid or station already existing.
     * @returns {undefined}
     */
    addStation(stations, id, title, description = "", source, overwrite = false) {
        this.addStationObject(stations, new Station(id, title, description, source), overwrite);
    },

    /**
     * Adds station object to station array.
     * @param {Array} stations - Array to add station to.
     * @param {Station} station - Station object to add to stations array.
     * @param {Boolean} overwrite - Overwrite if duplicate
     * @returns {undefined}
     */
    addStationObject(stations, station, overwrite = false) {
        // Test if arguments are defined and of the correct type
        if (!stations || !Array.isArray(stations)) {
            throw new Error("Invalid or missing stations array");
        }
        if (!station || !station instanceof Station) {
            throw new Error("Invalid or missing station object");
        }

        const stationIndex = this.getStationIndex(stations, station.id);
        if (stationIndex !== -1) {
            if (overwrite) {
                stations[stationIndex] = station;
                log.debug(`Station ${station.id} already existing => Replacing`);
            }
            else {
                throw new Error(`Station with id ${station.id} already existing!`);
            }
        }
        else {
            stations.push(station);
        }
    },


    /**
     * Get station index by id
     * @param {Array} stations - Array of stations to query.
     * @param {String} id - Id to query station array for.
     * @returns {number} - Index of station in array or -1 if not found.
     */
    getStationIndex(stations, id) {
        if (id && stations && Array.isArray(stations)) {
            for (let i = 0; i < stations.length; i++) {
                if (stations[i].id === id) {
                    return i;
                }
            }
            return -1;
        }
        else {
            log.debug(arguments);
            throw new Error("Invalid arguments");
        }
    },

    /**
     * Creates copy of JSON object
     * @param {Object} obj - Object to create copy of
     * @returns {Object} - Copy of obj
     */
    copyObject(obj) {
        return JSON.parse(JSON.stringify(obj));
    }
};

export default util;