var ui = require("./ui");
var h = require("hyperscript");
var Hash = require("./hash");

var listed_pages = [
    'about',
    'settings',
    'dicebag',
    'users',
];

var navLink = function (p) {
    var hash = Hash.parse(Hash.get());
    var target = Hash.format(p, hash[1]);
    return ui.link(target, p, p);
};

module.exports = function () {
    return h('nav.nav', listed_pages.map(navLink));
};

