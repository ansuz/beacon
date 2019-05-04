var ui = require("./ui");
var h = require("hyperscript");

var listed_pages = [
    'about',
    'whoami',
     'dicebag',
];

var navLink = function (p) {
    return ui.link('#/' + p + '/', p, p);
};

module.exports = function () {
    return h('nav.nav', listed_pages.map(navLink));
};

