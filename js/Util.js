import * as log from "loglevel"

const util = {
    /**
     * Adds station to station array. Validates arguments
     * @param {Array} stations - Array to add station to if valid
     * @param {String} id - Id of station to add, must be unique.
     * @param {String} title - Display title (human readable).
     * @param {String} description - Description of station to be shown when selected.
     * @param {Array} source - Objects with src = url of audio stream and type to be injected into audio element.
     * @throws {Error} if arguments are invalid or station already existing.
     * @returns {undefined}
     */
    addStation(stations, id, title, description = "", source) {
        // Test if arguments are defined and of the correct type
        if(!stations || !Array.isArray(stations)) {
            throw Error("Invalid or missing stations array");
        }

        // Test if station object is valid
        this.validateStation({id, title, description, source});

        // Test if station already existing
        if (this.getStationIndex(stations, id) !== -1) {
            throw new Error(`Station with id ${id} already existing!`);
        }

        stations.push({id, title, description, source});
    },

    /**
     * Validates station object.
     * @param {Object} station - Station object to validate.
     * @throws {Error} - If validation fails.
     * @returns {undefined}
     */
    validateStation(station) {
        if(!station.title || station.title === "") {
            throw new Error("Station title is mandatory");
        }
        if(!station.id || station.id === "") {
            throw new Error("Station ID is mandatory");
        }
        if(!station.source || !Array.isArray(station.source) || station.source.length === 0) {
            throw new Error("Station source info is mandatory");
        }

        //Validate source object
        for (let i = 0; i < station.source.length; i++) {
            if (!station.source[i].hasOwnProperty("src") || !station.source[i].hasOwnProperty("type") || station.source[i].src === ""
                || station.source[i].type === "") {
                //TODO: test if src contains valid url
                log.debug("Station source array", station.source);
                throw new Error("Invalid source info for station")
            }
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