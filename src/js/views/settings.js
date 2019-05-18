var h = require("hyperscript");
var nThen = require("nthen");
var storage = require("../storage");
var source = require("cryptomancy-source");
var format = require("cryptomancy-format");
var State = require("../state");
var ui = require("../ui");
var constants = require("../constants");

module.exports.route = function (req, res) {
    res.setTitle("Whoami");
    var name;

    var draw = function () {
        res.main.innerHTML = '';
        var old = name;

        var button = ui.button([
            '"',
            name,
            '"',
        ]);

        button.onclick = function () {
            nThen(function (w) {
                ui.prompt("enter your new name", {}, w(function (err, val) {
                    if (err) {
                        w.abort();
                        return void console.error(err);
                    }
                    val = val.trim();

                    if (!val) {
                        w.abort();
                        return void ui.alert("That name is not valid");
                    }

                    name = val.slice(0, constants.NICK_LENGTH);
                }));
            }).nThen(function (w) {
                storage.set('name', name, w(function (/* err, v */) {
                    State.events['name/self'].invoke({
                        old: old,
                        new: name,
                    });
                }));
            }).nThen(function () {
                draw();
            });
       };

        var rename = h('p', [
            'Your name: ',
            button,
        ]);

        var channel_button = ui.button([
            'TODO',

        ]);

        var channel = h('p', [
            'Your current chat channel: ',
            channel_button,
        ]);
        channel = channel;

        var box = h('div', [
            rename,
            h('br'),
            //channel,
        ]);
        res.main.appendChild(box);
    };

    nThen(function (w) {
        storage.get('name', w(function (err, v) {
            // TODO handle errors if they ever become possible
            name = v;
        }));
    }).nThen(function (w) {
        if (name) { return; }
        name = format.encodeHex(source.bytes.secure()(4)); // 8 bytes of hex
        storage.set('name', name, w(function () {
            // emit a name/self event
            // TODO actually listen for this event...
            State.events['name/self'].invoke({
                old: null,
                new: name,
            });
        }));
    }).nThen(function () {
        draw();
    });
};
