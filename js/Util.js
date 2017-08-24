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
        if(!title || title === "") {
            throw new Error("Station title is mandatory");
        }
        if(!id || id === "") {
            throw new Error("Station ID is mandatory");
        }
        if(!source || !Array.isArray(source) || source.length === 0) {
            throw new Error("Station source info is mandatory");
        }


        // Test if station already existing
        if (this.getStationIndex(stations, id) !== -1) {
            throw new Error(`Station with id ${id} already existing!`);
        }

        //Validate source object
        for (let i = 0; i < source.length; i++) {
            if (!source[i].hasOwnProperty("src") || !source[i].hasOwnProperty("type") || source[i].src === ""
                || source[i].type === "") {
                //TODO: test if src contains valid url
                log.debug("Station source array", source);
                throw new Error("Invalid source info for station")
            }
        }
        stations.push({id, title, description, source});
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
    }
};

export default util;