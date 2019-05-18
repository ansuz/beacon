var State = require("./state");

require("./events");
require("./polyfill");

var Network = require("./network");
var Multi = require("./mpc");
var Hash = require("./hash");

var seed = Hash.parse(Hash.get())[1] || '';

Network.connect(seed, function (err, api) {
    if (err) { return void console.error(err); }

    State.transport = api;

    Multi.prepare(api, function (err, commands) {
        if (err) {
            return console.error(err);
        }
        State.commands = commands;
        State.messaging.ready = true;
        State.events.invoke('mpc/ready');
    });
});

