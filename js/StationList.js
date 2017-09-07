import Station from "./Station"

export default class StationList {
    constructor(stations = []) {
        if (!Array.isArray(stations)) {
            throw new Error("Argument 'stations' must be an array");
        }
        this._stations = stations;
    }

    get stations() {
        return this._stations;
    }

    get arr() {
        return this.stations;
    }

    /**
     * Adds station to station array. Validates station arguments.
     * @param {String} id - Id of station to add, must be unique.
     * @param {String} title - Display title (human readable).
     * @param {String} description - Description of station to be shown when selected.
     * @param {Array} source - Objects with src = url of audio stream and type to be injected into audio element.
     * @param {Boolean} overwrite - Overwrite if duplicate
     * @throws {Error} if arguments are invalid or station already existing.
     * @returns {undefined}
     */
    addStation(id, title, description = "", source, overwrite = false) {
        this.addStationObject(new Station(id, title, description, source), overwrite);
    }

    /**
     * Adds station object to station array.
     * @param {Station} station - Station object to add to stations array.
     * @param {Boolean} overwrite - Overwrite if duplicate
     * @returns {undefined}
     */
    addStationObject(station, overwrite = false) {
        // Test if arguments are defined and of the correct type
        if (!station || !station instanceof Station) {
            throw new Error("Invalid or missing station object");
        }

        const stationIndex = this.getStationIndex(station.id);
        log.debug("addStationObject: stationIndex", stationIndex);
        if (stationIndex === -1) {
            this.stations.push(station);
        }
        else if (overwrite) {
            this.stations[stationIndex] = station;
            log.debug(`Station ${station.id} already existing => Replacing`);
        }
        else {
            throw new Error(`Station with id ${station.id} already existing!`);
        }
    }


    /**
     * Get station index by id
     * @param {String} id - Id to query station array for.
     * @returns {number} - Index of station in array or -1 if not found.
     */
    getStationIndex(id) {
        if (id && typeof id === "string") {
            for (let i = 0; i < this.stations.length; i++) {
                if (this.stations[i].id === id) {
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

    /**
     * Get station object by id
     * @param {String} id - ID to query station for in station array
     * @returns {Station|null} - Station with corresponding id or null if not found
     */
    getStation(id) {
        const index = this.getStationIndex(id);
        if (index === -1) {
            return null;
        }
        else {
            return this.stations[index];
        }
    }

    /**
     * Remove Station from array
     * @param {Station|String} station - Station id or station object to be removed from array
     */
    removeStation(station) {
        let index;

        if (station instanceof Station) {
            index = this.stations.indexOf(station);
        }
        else if (typeof station === "string") {
            index = this.getStationIndex(station);
        }
        else {
            throw new Error("Invalid argument 'station'. Must either be string (station-id) or Station object");
        }
        if (index === -1) {
            throw new Error("Can't remove station, station not found");
        }
        this.stations.splice(index, 1);
    }

    /**
     * Adds stations from remote to station array
     * @param {Array} stations - Array of stations to add
     * @param {Boolean} overwrite - If true, overwrite existing stations with duplicate id.
     * @returns {undefined}
     */
    addStations(stations = [], overwrite = false) {
        if (!Array.isArray(stations)) {
            throw new Error("Invalid argument 'stations' must be array of Station objects");
        }
        const failedStations = [];
        stations.forEach((station) => {
            try {
                if (station instanceof Station) { // Either array contains station objects
                    this.addStationObject(station, overwrite);
                }
                else { // or plain objects
                    this.addStation(station.id, station.title, station.description, station.source, overwrite);
                }
            }
            catch (e) {
                log.debug(e);
                failedStations.push(station);
            }
        });
        if (failedStations.length > 0) {
            log.error("Some stations failed to parse / add", failedStations);
        }
    }

    clear() {
        this._stations = [];
    }

    /**
     * Save stations to localStorage (if supported)
     */
    save() {
        if (localStorage) {
            localStorage.setItem("stations", JSON.stringify(this.stations));
        }
    }

    /**
     * Adds stations from local storage to station array
     * @param {Boolean} overwrite - If true, overwrite existing stations with duplicate id.
     * @returns {undefined}
     */
    load(overwrite = false) {
        if (localStorage) {
            let storedStations = localStorage.getItem("stations");

            if (storedStations) {
                let failed = false;
                try {
                    storedStations = JSON.parse(storedStations);
                }
                catch (e) {
                    log.error("Could not parse station config from local storage");
                    localStorage.removeItem("stations"); // localStorage contains invalid data, lets remove it
                    failed = true;
                }

                // This ensures the format is correct. localStorage could
                // contain invalid data; Also it prevents duplicates and default stations from being overwritten
                if (!failed) {
                    log.debug("Loaded stations object from localstorage", storedStations);

                    // Parse into Station objects
                    for (let i = 0; i < storedStations.length; i++) {
                        try {
                            storedStations[i] = Station.fromJSON(storedStations[i]);
                        }
                        catch (error) {
                            log.debug("load(): Failed to parse", storedStations[i]);
                        }
                    }

                    // Add to stations array
                    this.addStations(storedStations);
                }
            }
        }
    }
}