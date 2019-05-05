var State = require("./state");
var global = State.global;
var loc = global.location;

var Hash = module.exports;

Hash.get = function () {
    return loc.hash || '#/';
};

Hash.prepare = function (hash) {
    return (hash || '').replace(/^#+/, '');
};

Hash.parse = function (hash) {
    return Hash.prepare(hash).split('/').filter(Boolean);
};

Hash.format = function (target, seed) {
    var hash = '#/';
    if (target) { hash += target + '/'; }
    else { return hash; }
    if (typeof(seed) === 'string') { hash += seed + '/'; }
    return hash;
};

