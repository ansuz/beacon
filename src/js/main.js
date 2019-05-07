var State = require("./state");
var util = require("./util");

// events
var netEvents = util.events([
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
]);

State.events = netEvents.events;

State.on = function (k, f) {
    if (State.events[k]) {
        State.events[k].on(f);
        return State;
    }
    var handler = State.events[k] = util.handler();
    State.global.addEventListener(k, handler.invoke);
    handler.on(f);
    return State;
};

State.off = function (k, f) {
    if (!State.events[k]) { return State; }
    State.events[k].off(f);
    return State;
};

var router = require("./router");
require("./polyfill");
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

var Network = require("./network");
var Multi = require("./mpc");
var Hash = require("./hash");

var seed = Hash.parse(Hash.get())[1] || '';

Network.connect(seed, function (err, api) {
    if (err) { return void console.error(err); }
    //State.events['net/connect'].invoke();

    Multi.prepare(api, function (err, commands) {
        if (err) {
            return console.error(err);
        }
        State.commands = commands;
        State.messaging.ready = true;
        State.events['mpc/ready'].invoke();
    });
});

(function () {
    var Visible = require("./browser/visible");
    if (!Visible.isSupported()) { return; }

    var Notify = require("./browser/notify");

    Visible.onChange(function (visible) {
        // unnotify if visible
        if (visible) { return void Notify.cancel(); }
    });

    State.events['tab/notify'].on(function (reason) {
        console.log("Notified because: ", reason);
        if (Visible.currently()) { return; }
        Notify.blink();
    });
}());
