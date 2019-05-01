var State = require("./state");
var g = State.global;

// isArray
if (typeof(Array.isArray) !== 'function') {
    console.log('polyfilling for Array.isArray');
    g.Array.isArray = function (arg) {
        return Object.prototype.toString.call(arg) === '[object Array]';
    };
}

// fill
if (typeof(Array.prototype.fill) !== 'function') {
    console.log('polyfilling for Array.fill');
    g.Array.prototype.fill = function (x) {
        var l = this.length;
        for (var i = 0; i < l; i++) {
            this[i] = x;
        }
        return this;
    };
}

if (typeof(Number.MAX_SAFE_INTEGER) !== 'number') {
    console.log("polyfilling for Number.MAX_SAFE_INTEGER");
    Number.MAX_SAFE_INTEGER = 9007199254740991;
}
