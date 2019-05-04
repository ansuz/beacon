var State = require("./state");
var localStorage = State.global.localStorage;

module.exports = {
    set: function (k, v, cb) {
        setTimeout(function () {
            cb(void 0, localStorage.setItem(k, v));
        });
    },
    get: function (k, cb) {
        setTimeout(function () {
            cb(void 0, localStorage.getItem(k));
        });
    },
    remove: function (k, cb) {
        setTimeout(function () {
            cb(void 0, localStorage.removeItem(k));
        });
    }
};
