var State = require("../state");
var document = State.global.document;

// Set the name of the hidden property and the change event for visibility
var hidden, visibilityChange;
if (typeof(document.hidden) !== "undefined") { // Opera 12.10 and Firefox 18 and later support 
    hidden = "hidden";
    visibilityChange = "visibilitychange";
} else if (typeof document.mozHidden !== "undefined") {
    hidden = "mozHidden";
    visibilityChange = "mozvisibilitychange";
} else if (typeof document.msHidden !== "undefined") {
    hidden = "msHidden";
    visibilityChange = "msvisibilitychange";
} else if (typeof document.webkitHidden !== "undefined") {
    hidden = "webkitHidden";
    visibilityChange = "webkitvisibilitychange";
}

var Visible = module.exports = {
    hidden: hidden,
    visibilityChange: visibilityChange,
};

Visible.isSupported = function () {
    return !(typeof(document.addEventListener) === "undefined" ||
        typeof document[hidden] === "undefined");
};

Visible.currently = function () {
    return !document[hidden];
};

Visible.onChange = function (f) {
    document.addEventListener(visibilityChange, function (ev) {
        f(Visible.currently(), ev);
    }, false);
};

