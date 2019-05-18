var State = require("./state");
var util = require("./util");

State.events = util.events([
    'mpc/bytes',
    'mpc/message',
    'mpc/ready',
    'mpc/nick',

    'net/connect',
    'net/reconnect',
    'net/disconnect',
    // TODO differentiate between net and chan
    'net/join',
    'net/part',

    // naming things
    'name/self',
    //'name/other',

    'tab/notify',

    'doc/keypress',
]);

State.global.document.addEventListener('keypress', function (ev) {
    State.events.invoke('doc/keypress', ev);
});


var router = require("./router");
var global = State.global;
var doc = global.document;
var loc = global.location;

doc.onreadystatechange = function () {
    if (doc.readyState === "interactive") {
        console.log("READY");
        router.render(loc.hash);
    }
};

global.onhashchange = function () {
    router.render(loc.hash);
};


(function () {
    var Visible = require("./browser/visible");
    if (!Visible.isSupported()) { return; }

    var Notify = require("./browser/notify");

    Visible.onChange(function (visible) {
        // unnotify if visible
        if (visible) { return void Notify.cancel(); }
    });

    State.events.on('tab/notify', function (reason) {
        console.log("Notified because: ", reason);
        if (Visible.currently()) { return; }
        Notify.blink();
    });
}());
