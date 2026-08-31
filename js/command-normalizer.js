(function (root, factory) {
    "use strict";

    var api = factory();

    if (typeof module === "object" && module.exports) {
        module.exports = api;
    }

    if (root) {
        root.ScribCommandNormalizer = api;
    }
}(typeof self !== "undefined" ? self : this, function () {
    "use strict";

    var COMBINING_MARKS = /[\u0300-\u036f]/g;
    var ACCENTED_CHARACTERS = /[áàäâãåéèëêíìïîóòöôõúùüûñç]/g;
    var ACCENT_FALLBACKS = {
        "á": "a",
        "à": "a",
        "ä": "a",
        "â": "a",
        "ã": "a",
        "å": "a",
        "é": "e",
        "è": "e",
        "ë": "e",
        "ê": "e",
        "í": "i",
        "ì": "i",
        "ï": "i",
        "î": "i",
        "ó": "o",
        "ò": "o",
        "ö": "o",
        "ô": "o",
        "õ": "o",
        "ú": "u",
        "ù": "u",
        "ü": "u",
        "û": "u",
        "ñ": "n",
        "ç": "c"
    };

    function removeAccents(value) {
        if (typeof value.normalize === "function") {
            return value.normalize("NFD").replace(COMBINING_MARKS, "");
        }

        return value.replace(ACCENTED_CHARACTERS, function (character) {
            return ACCENT_FALLBACKS[character] || character;
        });
    }

    function normalizeCommand(value) {
        var command = typeof value === "string" ? value : "";

        return removeAccents(command.toLowerCase())
            .trim()
            .replace(/\s+/g, " ");
    }

    return {
        normalizeCommand: normalizeCommand
    };
}));
