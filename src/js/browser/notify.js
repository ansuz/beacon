var State = require("../state");
var DEFAULT = 'favicon.png';
var ALT = 'favicon-alt.png';

var N = module.exports;

var getIcon = function () {
    return State.global.document.querySelector('link[rel="icon"]');
};

// set(bool)
N.set = function (bool) {
    getIcon().setAttribute('href', bool? DEFAULT: ALT);
};

// toggle
N.toggle = function () {
    var icon = getIcon();
    var href = icon.getAttribute('href');
    icon.setAttribute('href', /alt/.test(href)? DEFAULT: ALT);
};

N.cancel = function () {
    if (State.notification) { clearInterval(State.notification); }
};

N.blink = function () {
    N.cancel();
    N.set(false);
    State.notification = setInterval(function () {
        N.toggle();
    }, 500);
};
