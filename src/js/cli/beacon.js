var Network = require("../network");
var Multi = require("../mpc");
var State = require("../state");
var global = State.global;
global.WebSocket = require("ws");

Network.connect(function (err, api) {
    if (err) {
        return void console.error(err);
    }

    Multi.prepare(api, function (err, commands) {
        if (err) {
            return void console.log(err);
        }

        setInterval(function () {
            commands.bytes(32, '3d100', function (err, result) {
                //console.log(result);
                result = result;
            });
        }, 5000);
    });

});
