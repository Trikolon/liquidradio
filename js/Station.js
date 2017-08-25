export default class Station {
    /**
     * The Station class holds data for an individual radio station.
     * @param {String} id - Internal id used in url and as an identifier, e.g. for queries.
     * @param {String} title - Human readable name of station.
     * @param {String} description - Further info about station shown in main view when station is active.
     * @param {Array} source - Array containing info about audio stream source urls and type for station.
     */
    constructor(id = "", title = "", description = "", source = []) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.source = source;
    }

    get id() {
        return this._id;
    }

    set id(id) {
        if (!id || id === "") {
            throw new Error("Station ID is mandatory");
        }
        this._id = id;
    }

    get title() {
        return this._title;
    }

    set title(title) {
        if (!title || title === "") {
            throw new Error("Station title is mandatory");
        }
        this._title = title;
    }

    get description() {
        return this._description;
    }

    set description(description) {
        this._description = description;
    }

    get source() {
        return this._source;
    }

    set source(source) {
        if (!source || !Array.isArray(source) || source.length === 0) {
            throw new Error("Station source info is mandatory");
        }
        //Validate source object
        for (let i = 0; i < source.length; i++) {
            if (!source[i].hasOwnProperty("src") || !source[i].hasOwnProperty("type") || source[i].src === "") {
                throw new Error("Invalid source info for Station");
            }
            if(!Station.isValidSourceUrl(source[i].src)) {
                throw new Error("Invalid source url");
            }
        }

        this._source = source;
    }


    /**
     * Clone station object.
     * @returns {Station} copy of object.
     */
    clone() {
        return Station.fromJSON(JSON.stringify(this));
    }

    /**
     * Test if string is a valid station source url
     * @param {String} url - Url to be tested.
     */
    static isValidSourceUrl(url)  {
        let regex = new RegExp("https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{2,256}\\.[a-z]{2,6}\\b([-a-zA-Z0-9@:%_\\+.~#?&//=]*)");
        return url.match(regex);
    }


    /**
     * Converts JSON string or already parsed JSON string to station object.
     * @param {String | Object} obj - Object to construct station object from.
     * @returns {Station} - Station object parsed from obj.
     */
    static fromJSON(obj) {
        let parsed;
        if (typeof obj === "string") {
            parsed = JSON.parse(obj);
        }
        else {
            parsed = obj;
        }
        return new Station(parsed._id, parsed._title, parsed._description, parsed._source);
    }
}
