var State = require("./state");
var util = require("./util");

State.events = util.events([
    // you successfully connected to the server
    'net/connect',
    // you lost your connection to the server
    'net/disconnect',
    // you reconnected to the server
    'net/reconnect',

    // somebody else joined a channel
    'chan/join',
    // somebody else left a channel
    'chan/part',
    // a channel is ready for use
    'chan/ready',

    // the mpc module is ready for use
    'mpc/ready',
    // secure random bytes were generated
    'mpc/bytes',
    // somebody else sent a text message
    'mpc/message',
    // somebody else changed their nick?
    'mpc/nick',

    // naming things
    'name/self',
    //'name/other',

    // a notification was triggered
    'tab/notify',
    // a key was pressed
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
